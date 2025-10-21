import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);

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

  useEffect(() => {
    if (noticeId && noticeId !== 'new') {
      setIsEdit(true);
      loadNotice();
    }
  }, [noticeId]);

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

      const saveData = {
        title: noticeData.title,
        notice_type: noticeData.notice_type,
        status: newStatus || noticeData.status,
        description: noticeData.description || null,
        premises: noticeData.premises,
        applicant: noticeData.applicant,
        consultation: noticeData.consultation,
        licensing: noticeData.licensing,
        representation_deadline: noticeData.representation_deadline || null,
        expires_at: noticeData.expires_at || null,
        department_id: department.id,
        organization_id: department.organization.id,
        created_by: session.user.id
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
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update notice details' : 'Create a new public notice'}
          </p>
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

          {noticeData.status === 'draft' && (
            <button
              onClick={handleSubmitForApproval}
              disabled={saving}
              className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              Submit for Approval
            </button>
          )}

          {canPublish && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish Notice'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
