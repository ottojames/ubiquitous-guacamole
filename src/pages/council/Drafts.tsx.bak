import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/permissions';

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

interface Draft {
  id: string;
  notice_category: string;
  draft_name: string | null;
  notes: string | null;
  form_data: Record<string, unknown>;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export default function Drafts() {
  const { department, userRole } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const canCreateNotice = hasPermission(PERMISSIONS.NOTICES_CREATE);

  useEffect(() => {
    loadDrafts();
  }, [department.id]);

  const loadDrafts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/drafts?department_id=${department.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await response.json();
      setDrafts(data.drafts || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load drafts:', err);
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(draftId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete draft');
      }

      // Remove from local state
      setDrafts(drafts.filter(d => d.id !== draftId));
    } catch (err) {
      console.error('Failed to delete draft:', err);
      alert('Failed to delete draft. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleResumeDraft = (draftId: string) => {
    // Navigate to the notice editor with the draft ID
    navigate(`/c/${orgSlug}/${deptSlug}/notices/new?draft=${draftId}`);
  };

  const filteredDrafts = drafts.filter(draft => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      draft.draft_name?.toLowerCase().includes(query) ||
      draft.notice_category.toLowerCase().includes(query) ||
      draft.notes?.toLowerCase().includes(query)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCategory = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDraftTitle = (draft: Draft) => {
    if (draft.draft_name) return draft.draft_name;

    // Try to extract a title from form_data
    const formData = draft.form_data;
    if (formData?.PREMISES_NAME) return String(formData.PREMISES_NAME);
    if (formData?.APPLICANT_NAME) return String(formData.APPLICANT_NAME);
    if (formData?.title) return String(formData.title);

    return 'Untitled Draft';
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
          <p className="text-gray-600 mt-1">
            Resume editing or manage your saved drafts
          </p>
        </div>
        {canCreateNotice && (
          <Link
            to={`/c/${orgSlug}/${deptSlug}/notices/new`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            + Create Notice
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <input
          type="text"
          placeholder="Search drafts by name, category, or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Drafts List */}
      {filteredDrafts.length === 0 ? (
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
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'No drafts match your search'
              : 'No drafts saved yet'}
          </p>
          {canCreateNotice && !searchQuery && (
            <Link
              to={`/c/${orgSlug}/${deptSlug}/notices/new`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Your First Notice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getDraftTitle(draft)}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {formatCategory(draft.notice_category)}
                    </span>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-gray-500">
                      Last saved: {formatDate(draft.last_saved_at)}
                    </p>
                    {draft.notes && (
                      <p className="text-sm text-gray-600">
                        {draft.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResumeDraft(draft.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Resume Editing
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      disabled={deleting === draft.id}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === draft.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
