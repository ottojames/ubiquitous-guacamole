import { useEffect, useState } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import TemplateTextEditor from './TemplateTextEditor';
import TemplateValidationWarnings from './TemplateValidationWarnings';
import { getNoticeTypesForDepartment, type DepartmentType, ALL_NOTICE_TYPES } from '@/next/publish/config/departmentNoticeTypes';

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

interface Template {
  id: string;
  name: string;
  description: string | null;
  notice_type: string;
  default_values: any;
  template_text: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export default function Templates() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get available notice types for this department
  const availableNoticeTypes = getNoticeTypesForDepartment(department.type as DepartmentType);
  const defaultNoticeType = availableNoticeTypes[0]?.value || 'licensing-premises-new';

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notice_type: defaultNoticeType,
    template_text: '',
    default_values: {}
  });

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingTemplate, setExistingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [department.id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateModal) {
      // Save current scroll position
      const scrollY = window.scrollY;

      // Lock both html and body scroll
      const htmlElement = document.documentElement;
      const bodyElement = document.body;

      // Save original styles
      const originalHtmlOverflow = htmlElement.style.overflow;
      const originalBodyPosition = bodyElement.style.position;
      const originalBodyTop = bodyElement.style.top;
      const originalBodyWidth = bodyElement.style.width;
      const originalBodyOverflow = bodyElement.style.overflow;

      // Apply scroll lock
      htmlElement.style.overflow = 'hidden';
      bodyElement.style.position = 'fixed';
      bodyElement.style.top = `-${scrollY}px`;
      bodyElement.style.width = '100%';
      bodyElement.style.overflow = 'hidden';

      return () => {
        // Restore original styles
        htmlElement.style.overflow = originalHtmlOverflow;
        bodyElement.style.position = originalBodyPosition;
        bodyElement.style.top = originalBodyTop;
        bodyElement.style.width = originalBodyWidth;
        bodyElement.style.overflow = originalBodyOverflow;

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [showCreateModal]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('department_id', department.id)
        .order('use_count', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      notice_type: defaultNoticeType,
      template_text: '',
      default_values: {}
    });
    setShowCreateModal(true);
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to notice editor with template parameter
    window.location.href = `/c/${orgSlug}/${deptSlug}/notices/new?template=${template.id}`;
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      notice_type: template.notice_type,
      template_text: template.template_text || '',
      default_values: template.default_values || {}
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name) {
        throw new Error('Template name is required');
      }

      // Check for existing template with same notice_type (unless we're editing the same one)
      const { data: existing, error: checkError } = await supabase
        .from('templates')
        .select('*')
        .eq('department_id', department.id)
        .eq('notice_type', formData.notice_type)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - that's fine
        throw checkError;
      }

      // If we found an existing template and it's not the one we're editing, show warning
      if (existing && existing.id !== editingTemplate?.id) {
        setExistingTemplate(existing);
        setShowDuplicateWarning(true);
        setSaving(false);
        return;
      }

      // Proceed with save
      await performSave();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
      setSaving(false);
    }
  };

  const performSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const saveData = {
        name: formData.name,
        description: formData.description || null,
        notice_type: formData.notice_type,
        template_text: formData.template_text || null,
        default_values: formData.default_values,
        department_id: department.id
      };

      if (editingTemplate) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('templates')
          .update(saveData)
          .eq('id', editingTemplate.id);

        if (updateError) throw updateError;
        setSuccess('Template updated successfully');
      } else {
        // If replacing, delete the old one first
        if (existingTemplate) {
          const { error: deleteError } = await supabase
            .from('templates')
            .delete()
            .eq('id', existingTemplate.id);

          if (deleteError) throw deleteError;
        }

        // Create new template
        const { error: insertError } = await supabase
          .from('templates')
          .insert(saveData);

        if (insertError) throw insertError;
        setSuccess(existingTemplate ? 'Template replaced successfully' : 'Template created successfully');
      }

      setSaving(false);
      setShowCreateModal(false);
      setShowDuplicateWarning(false);
      setExistingTemplate(null);
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
      setSaving(false);
    }
  };

  const handleConfirmReplace = async () => {
    setShowDuplicateWarning(false);
    await performSave();
  };

  const handleCancelReplace = () => {
    setShowDuplicateWarning(false);
    setExistingTemplate(null);
    setSaving(false);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setSuccess('Template deleted');
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const formatNoticeType = (type: string) => {
    // Try to find the proper label from our registry first
    const noticeTypeDef = ALL_NOTICE_TYPES.find(nt => nt.value === type);
    if (noticeTypeDef) {
      return noticeTypeDef.label;
    }
    // Fallback to simple formatting
    return type.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const canManageTemplates = ['owner', 'org_admin', 'department_admin', 'editor'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notice Templates</h1>
          <p className="text-gray-600 mt-1">
            Create reusable templates for common notice types
          </p>
        </div>
        {canManageTemplates && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            + Create Template
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-gray-600 mb-4">No templates yet</p>
          {canManageTemplates && (
            <button
              onClick={handleCreate}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {formatNoticeType(template.notice_type)}
                  </p>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-3">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Used {template.use_count} times
                </div>
                <span>
                  {formatDate(template.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  Use Template
                </button>
                {canManageTemplates && (
                  <>
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-8 pb-4 border-b border-gray-200 bg-white rounded-t-3xl">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-6">

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Standard Pub Licence"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notice Type *
                  </label>
                  <select
                    value={formData.notice_type}
                    onChange={(e) => setFormData({ ...formData, notice_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableNoticeTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing notice types for {department.type} department only
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe when to use this template..."
                  />
                </div>

                {/* Template Text Editor */}
                <TemplateTextEditor
                  value={formData.template_text}
                  onChange={(value) => setFormData({ ...formData, template_text: value })}
                  noticeType={formData.notice_type}
                />

                {/* Validation Warnings */}
                <TemplateValidationWarnings
                  templateText={formData.template_text}
                  noticeType={formData.notice_type}
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-8 py-6 border-t border-gray-200 bg-white rounded-b-3xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && existingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
            <div className="p-8">
              <div className="flex items-start mb-6">
                <div className="flex-shrink-0">
                  <svg
                    className="w-12 h-12 text-amber-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Replace Existing Template?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    A template for <span className="font-semibold">{formatNoticeType(existingTemplate.notice_type)}</span> already exists in this department.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Current template:</span> {existingTemplate.name}
                    </p>
                    {existingTemplate.description && (
                      <p className="text-sm text-gray-600">
                        {existingTemplate.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Used {existingTemplate.use_count} times
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Creating this new template will permanently replace the existing one. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelReplace}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplace}
                  className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                >
                  Replace Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
