import { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAutoSave } from '@/hooks/useAutoSave';
import UploadDropzone, { type UploadStatus } from '@/components/publish/UploadDropzone';
import { extractLegalDetailsFromOcr, type LegalDetails } from '@/next/publish/flow/lib/legalDetails';
import { renderTemplateText, hasPlaceholders, type NoticeFormData } from '@/lib/templateRenderer';

interface Department {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
  };
}

interface ContextType {
  department: Department;
  userRole: string;
}

interface NoticeData {
  title: string;
  notice_type: string;
  status: string;
  description: string;
  premises: any;
  applicant: any;
  consultation: any;
  licensing: any;
  representation_deadline: string;
  expires_at: string;
}

export default function NoticeEditor() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug, noticeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<{id: string, name: string, default_values: any, template_text: string | null, notice_type: string}>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadedTemplateText, setLoadedTemplateText] = useState<string>('');
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [loadedTemplateName, setLoadedTemplateName] = useState<string>('');
  const [showTemplatePreview, setShowTemplatePreview] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<UploadStatus>('idle');

  const [noticeData, setNoticeData] = useState<NoticeData>({
    title: '',
    notice_type: 'premises-licence',
    status: 'draft',
    description: '',
    premises: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        postcode: ''
      }
    },
    applicant: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        postcode: ''
      }
    },
    consultation: {
      authority: department.organization.name,
      start_date: '',
      end_date: ''
    },
    licensing: {
      activities: []
    },
    representation_deadline: '',
    expires_at: ''
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Map notice_type to notice_category for drafts API
  const getNoticeCategory = (noticeType: string): 'licensing' | 'gambling' | 'gvol' | 'planning' | 'probate' => {
    if (noticeType.includes('licence') || noticeType.includes('certificate')) return 'licensing';
    if (noticeType.includes('planning')) return 'planning';
    if (noticeType.includes('traffic')) return 'licensing'; // Default to licensing
    return 'licensing';
  };

  // Auto-save hook
  const { isSaving: isAutoSaving, lastSaved } = useAutoSave({
    draftId,
    formData: noticeData as unknown as Record<string, unknown>,
    noticeCategory: getNoticeCategory(noticeData.notice_type),
    noticeDefinitionId: noticeData.notice_type,
    draftName: noticeData.title || 'Untitled Draft',
    organizationId: department.organization.id,
    departmentId: department.id,
    enabled: !isEdit && noticeData.title.length > 0, // Only auto-save for new notices with content
    onSaveSuccess: (savedDraftId) => {
      if (!draftId) {
        setDraftId(savedDraftId);
      }
    },
  });

  useEffect(() => {
    loadTemplates();
    loadDepartmentSettings();
  }, [department.id]);

  const loadDepartmentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('settings')
        .eq('id', department.id)
        .single();

      if (!error && data?.settings) {
        setRequireApproval(data.settings.require_approval_for_publication === true);
      }
    } catch (err) {
      console.error('Failed to load department settings:', err);
    }
  };

  useEffect(() => {
    if (noticeId && noticeId !== 'new') {
      setIsEdit(true);
      loadNotice();
    } else {
      // Check for template parameter
      const templateId = searchParams.get('template');
      if (templateId) {
        loadTemplateAndApply(templateId);
      }
    }
  }, [noticeId, searchParams]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, default_values, notice_type, template_text')
        .eq('department_id', department.id)
        .order('use_count', { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadTemplateAndApply = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      if (!data) return;

      // Store template_text for rendering (Task 2 of Plan 01-03)
      setLoadedTemplateText(data.template_text || '');
      setLoadedTemplateId(data.id);
      setLoadedTemplateName(data.name || '');

      // Apply template defaults
      applyTemplateDefaults(data.default_values, data.notice_type);
      setSelectedTemplate(templateId);

      // Increment use count
      await supabase
        .from('templates')
        .update({ use_count: (data.use_count || 0) + 1 })
        .eq('id', templateId);
    } catch (err) {
      console.error('Failed to load template:', err);
    }
  };

  const applyTemplateDefaults = (defaults: any, templateNoticeType?: string) => {
    if (!defaults) return;

    setNoticeData(prev => ({
      ...prev,
      ...(templateNoticeType && { notice_type: templateNoticeType }),
      ...(defaults.title && { title: defaults.title }),
      ...(defaults.description && { description: defaults.description }),
      ...(defaults.premises && { premises: { ...prev.premises, ...defaults.premises } }),
      ...(defaults.applicant && { applicant: { ...prev.applicant, ...defaults.applicant } }),
      ...(defaults.consultation && { consultation: { ...prev.consultation, ...defaults.consultation } }),
      ...(defaults.licensing && { licensing: { ...prev.licensing, ...defaults.licensing } }),
      ...(defaults.representation_deadline && { representation_deadline: defaults.representation_deadline }),
      ...(defaults.expires_at && { expires_at: defaults.expires_at }),
    }));
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      // Store template_text for rendering
      setLoadedTemplateText(template.template_text || '');
      setLoadedTemplateId(template.id);
      setLoadedTemplateName(template.name || '');

      applyTemplateDefaults(template.default_values, template.notice_type);
    }
  };

  const handleOcrText = (text: string) => {
    console.log('[NoticeEditor] OCR text received:', text.substring(0, 100));

    // Extract legal details from OCR text
    const extraction = extractLegalDetailsFromOcr(text);
    const details = extraction.details;

    console.log('[NoticeEditor] Extracted details:', details);

    // Map extracted details to notice data
    setNoticeData(prev => ({
      ...prev,
      title: details.premisesName || details.tradingName || prev.title,
      description: details.applicationSummary || details.aiGeneratedSummary || prev.description,
      premises: {
        name: details.premisesName || prev.premises.name,
        address: {
          line1: details.premisesLine1 || prev.premises.address.line1,
          line2: details.premisesLine2 || prev.premises.address.line2,
          city: details.premisesCity || prev.premises.address.city,
          postcode: details.premisesPostcode || prev.premises.address.postcode,
        }
      },
      applicant: {
        name: details.applicantName || prev.applicant.name,
        address: prev.applicant.address
      },
      consultation: {
        ...prev.consultation,
        authority: details.councilName || prev.consultation.authority,
      },
      licensing: {
        activities: details.activities.length > 0 ? details.activities : prev.licensing.activities
      },
      representation_deadline: details.representationDeadline || prev.representation_deadline,
    }));

    // Close modal on successful OCR
    if (ocrStatus === 'ready') {
      setTimeout(() => {
        setShowOcrModal(false);
      }, 1000);
    }
  };

  const handleOcrStatusChange = (status: UploadStatus) => {
    setOcrStatus(status);
  };

  const loadNotice = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('id', noticeId)
        .eq('department_id', department.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Notice not found');

      setNoticeData({
        title: data.title || '',
        notice_type: data.notice_type || 'premises-licence',
        status: data.status || 'draft',
        description: data.description || '',
        premises: data.premises || noticeData.premises,
        applicant: data.applicant || noticeData.applicant,
        consultation: data.consultation || noticeData.consultation,
        licensing: data.licensing || noticeData.licensing,
        representation_deadline: data.representation_deadline ? data.representation_deadline.split('T')[0] : '',
        expires_at: data.expires_at ? data.expires_at.split('T')[0] : ''
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to load notice:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notice');
      setLoading(false);
    }
  };

  const handleSave = async (newStatus?: string) => {
    try {
      setSaving(true);
      setError(null);

      if (!noticeData.title) {
        throw new Error('Title is required');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Render template text if available (Task 3 of Plan 01-03)
      // The rendered template becomes the notice description
      let renderedDescription = noticeData.description || null;
      if (loadedTemplateText && hasPlaceholders(loadedTemplateText)) {
        // Convert noticeData to NoticeFormData shape for renderer
        const formDataForRenderer: NoticeFormData = {
          title: noticeData.title,
          notice_type: noticeData.notice_type,
          premises: noticeData.premises,
          applicant: noticeData.applicant,
          consultation: noticeData.consultation,
          licensing: noticeData.licensing,
          representation_deadline: noticeData.representation_deadline,
          expires_at: noticeData.expires_at,
        };
        renderedDescription = renderTemplateText(loadedTemplateText, formDataForRenderer);
      }

      // Build extras with template metadata for audit trail
      const extras: Record<string, any> = {};
      if (loadedTemplateId) {
        extras.template_id = loadedTemplateId;
        extras.template_name = loadedTemplateName;
        extras.template_text_original = loadedTemplateText;
      }

      const saveData = {
        title: noticeData.title,
        notice_type: noticeData.notice_type,
        status: newStatus || noticeData.status,
        description: renderedDescription,
        premises: noticeData.premises,
        applicant: noticeData.applicant,
        consultation: noticeData.consultation,
        licensing: noticeData.licensing,
        representation_deadline: noticeData.representation_deadline || null,
        expires_at: noticeData.expires_at || null,
        department_id: department.id,
        organization_id: department.organization.id,
        created_by: session.user.id,
        ...(Object.keys(extras).length > 0 && { extras }),
      };

      if (isEdit && noticeId) {
        // Update existing notice
        const { error: updateError } = await supabase
          .from('notices')
          .update(saveData)
          .eq('id', noticeId);

        if (updateError) throw updateError;
      } else {
        // Create new notice
        const { data: newNotice, error: insertError } = await supabase
          .from('notices')
          .insert(saveData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Navigate to edit mode for the new notice
        navigate(`/c/${orgSlug}/${deptSlug}/notices/${newNotice.id}`, { replace: true });
        setIsEdit(true);
      }

      setSaving(false);

      // If publishing or submitting for approval, navigate back to list
      if (newStatus === 'published' || newStatus === 'pending_approval') {
        navigate(`/c/${orgSlug}/${deptSlug}/notices`);
      }
    } catch (err) {
      console.error('Failed to save notice:', err);
      setError(err instanceof Error ? err.message : 'Failed to save notice');
      setSaving(false);
    }
  };

  const handlePublish = () => {
    if (confirm('Are you sure you want to publish this notice? It will become publicly visible.')) {
      handleSave('published');
    }
  };

  const handleSubmitForApproval = () => {
    if (confirm('Submit this notice for approval?')) {
      handleSave('pending_approval');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const noticeTypes = [
    { value: 'premises-licence', label: 'Premises Licence' },
    { value: 'variation', label: 'Variation' },
    { value: 'review', label: 'Review' },
    { value: 'club-certificate', label: 'Club Certificate' },
    { value: 'planning-application', label: 'Planning Application' },
    { value: 'traffic-order', label: 'Traffic Order' }
  ];

  const licensableActivities = [
    'Sale of alcohol',
    'Supply of alcohol (club)',
    'Late night refreshment',
    'Live music',
    'Recorded music',
    'Performance of dance',
    'Films',
    'Indoor sporting events',
    'Boxing or wrestling',
    'Performance of plays'
  ];

  const canPublish = ['owner', 'org_admin', 'department_admin'].includes(userRole);
  const canEdit = ['owner', 'org_admin', 'department_admin', 'editor'].includes(userRole);

  // Compute rendered preview text when template_text and form data are available
  const renderedPreviewText = useMemo(() => {
    if (!loadedTemplateText || !hasPlaceholders(loadedTemplateText)) {
      return '';
    }

    const formDataForRenderer: NoticeFormData = {
      title: noticeData.title,
      notice_type: noticeData.notice_type,
      premises: noticeData.premises,
      applicant: noticeData.applicant,
      consultation: noticeData.consultation,
      licensing: noticeData.licensing,
      representation_deadline: noticeData.representation_deadline,
      expires_at: noticeData.expires_at,
    };

    return renderTemplateText(loadedTemplateText, formDataForRenderer);
  }, [loadedTemplateText, noticeData]);

  // Format last saved time
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!canEdit) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 text-center">
        <p className="text-gray-600">You don't have permission to create or edit notices.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Notice' : 'Create Notice'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">
              {isEdit ? 'Update notice details' : 'Create a new public notice'}
            </p>
            {!isEdit && (
              <div className="flex items-center gap-2 text-sm">
                {isAutoSaving ? (
                  <span className="text-blue-600 flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving draft...
                  </span>
                ) : lastSaved ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Draft saved {formatLastSaved(lastSaved)}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate(`/c/${orgSlug}/${deptSlug}/notices`)}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← Back to Notices
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        <div className="space-y-6">
          {/* Template Selector */}
          {!isEdit && templates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Start from a Template</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save time by using a pre-filled template with default values for common notice types.
              </p>
              <div className="flex gap-3">
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply Template
                </button>
              </div>
            </div>
          )}

          {/* OCR Import */}
          {!isEdit && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Import from Document</h3>
                  <p className="text-sm text-gray-600">
                    Upload a PDF, Word document, or image to automatically extract notice details using OCR.
                  </p>
                </div>
                <button
                  onClick={() => setShowOcrModal(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Import Document
                </button>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Title *
                </label>
                <input
                  type="text"
                  value={noticeData.title}
                  onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Application for Premises Licence - The Red Lion"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notice Type *
                </label>
                <select
                  value={noticeData.notice_type}
                  onChange={(e) => setNoticeData({ ...noticeData, notice_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {noticeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={noticeData.description}
                  onChange={(e) => setNoticeData({ ...noticeData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Brief description of the notice..."
                />
              </div>
            </div>
          </div>

          {/* Premises Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Premises Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premises Name
                </label>
                <input
                  type="text"
                  value={noticeData.premises.name}
                  onChange={(e) => setNoticeData({
                    ...noticeData,
                    premises: { ...noticeData.premises, name: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., The Red Lion"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={noticeData.premises.address.line1}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      premises: {
                        ...noticeData.premises,
                        address: { ...noticeData.premises.address, line1: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 123 High Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={noticeData.premises.address.line2}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      premises: {
                        ...noticeData.premises,
                        address: { ...noticeData.premises.address, line2: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={noticeData.premises.address.city}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      premises: {
                        ...noticeData.premises,
                        address: { ...noticeData.premises.address, city: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., London"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={noticeData.premises.address.postcode}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      premises: {
                        ...noticeData.premises,
                        address: { ...noticeData.premises.address, postcode: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., SW1A 1AA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Applicant Details */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applicant Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={noticeData.applicant.name}
                  onChange={(e) => setNoticeData({
                    ...noticeData,
                    applicant: { ...noticeData.applicant, name: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., John Smith"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={noticeData.applicant.address.line1}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      applicant: {
                        ...noticeData.applicant,
                        address: { ...noticeData.applicant.address, line1: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={noticeData.applicant.address.city}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      applicant: {
                        ...noticeData.applicant,
                        address: { ...noticeData.applicant.address, city: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={noticeData.applicant.address.postcode}
                    onChange={(e) => setNoticeData({
                      ...noticeData,
                      applicant: {
                        ...noticeData.applicant,
                        address: { ...noticeData.applicant.address, postcode: e.target.value }
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Licensing Activities */}
          {noticeData.notice_type.includes('licence') && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Licensable Activities</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {licensableActivities.map(activity => (
                  <label key={activity} className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeData.licensing.activities.includes(activity)}
                      onChange={(e) => {
                        const activities = e.target.checked
                          ? [...noticeData.licensing.activities, activity]
                          : noticeData.licensing.activities.filter((a: string) => a !== activity);
                        setNoticeData({
                          ...noticeData,
                          licensing: { ...noticeData.licensing, activities }
                        });
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{activity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Planning Attachments */}
          {noticeData.notice_type.includes('planning') && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Planning Documents</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload site plans, drawings, and supporting documents (PDF, PNG, JPG). Max 10MB per file.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">Uploaded Files ({attachments.length})</h3>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="flex-shrink-0 ml-3 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Dates</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representation Deadline
                </label>
                <input
                  type="date"
                  value={noticeData.representation_deadline}
                  onChange={(e) => setNoticeData({ ...noticeData, representation_deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Last date for submitting representations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires At
                </label>
                <input
                  type="date"
                  value={noticeData.expires_at}
                  onChange={(e) => setNoticeData({ ...noticeData, expires_at: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  When this notice should be automatically archived
                </p>
              </div>
            </div>
          </div>

          {/* Template Preview Section - Only show when a template with template_text is loaded */}
          {loadedTemplateText && renderedPreviewText && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">Notice Text Preview</h2>
                  {loadedTemplateName && (
                    <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                      Template: {loadedTemplateName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {showTemplatePreview ? (
                    <>
                      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Show Preview
                    </>
                  )}
                </button>
              </div>

              {showTemplatePreview && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-xs text-gray-500 mb-3">
                    This preview shows how your notice will appear with the form values substituted into the template.
                  </p>
                  <div
                    className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {renderedPreviewText}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <button
          onClick={() => navigate(`/c/${orgSlug}/${deptSlug}/notices`)}
          className="text-gray-600 hover:text-gray-900 font-semibold"
          disabled={saving}
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>

          {requireApproval ? (
            <button
              onClick={handleSubmitForApproval}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          ) : canPublish ? (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish Notice'}
            </button>
          ) : null}
        </div>
      </div>

      {/* OCR Import Modal */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Import from Document</h2>
                <button
                  onClick={() => setShowOcrModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Upload a PDF, Word document, or image file. Our OCR system will automatically extract notice details and populate the form fields.
                </p>
                {ocrStatus === 'ready' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-green-800 font-semibold">
                      Document processed successfully! Form fields have been pre-filled.
                    </p>
                  </div>
                )}
              </div>

              <UploadDropzone
                onText={handleOcrText}
                onStatusChange={handleOcrStatusChange}
                heading="Upload Notice Document"
                description="PDF, DOC, DOCX, Pages, RTF, PNG, JPG, or TIFF (max 25MB)"
              />

              {ocrStatus === 'ready' && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowOcrModal(false)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Continue Editing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
