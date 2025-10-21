import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
}

interface Submission {
  id: string;
  title: string;
  notice_type: string;
  status: string;
  submitted_at: string;
  submitter_name: string;
  organization_name: string;
}

export default function BulkActions() {
  const { department } = useOutletContext<{ department: Department }>();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'assign' | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, [department.id]);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          title,
          notice_type,
          status,
          submitted_at,
          submitter_name,
          organization:submitting_organization_id (
            name
          )
        `)
        .eq('receiving_department_id', department.id)
        .in('status', ['new', 'in_review'])
        .order('submitted_at', { ascending: true });

      if (error) throw error;

      const formatted = data?.map((sub: any) => ({
        ...sub,
        organization_name: sub.organization?.name || 'Unknown'
      })) || [];

      setSubmissions(formatted);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map((s) => s.id)));
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedIds.size === 0) {
      alert('Please select submissions and an action');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmBulkAction = async () => {
    try {
      setProcessing(true);
      setShowConfirmModal(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const updates: any = {
        reviewed_at: new Date().toISOString(),
        assigned_to: session.user.id
      };

      if (bulkAction === 'approve') {
        updates.status = 'approved';
        if (bulkNotes) updates.notes = bulkNotes;
      } else if (bulkAction === 'reject') {
        updates.status = 'rejected';
        updates.notes = bulkNotes || 'Rejected via bulk action';
      }

      // Update each selected submission
      const promises = Array.from(selectedIds).map((id) =>
        supabase.from('submissions').update(updates).eq('id', id)
      );

      await Promise.all(promises);

      alert(`Successfully ${bulkAction}d ${selectedIds.size} submissions`);

      // Reset and reload
      setSelectedIds(new Set());
      setBulkAction('');
      setBulkNotes('');
      await loadSubmissions();
      setProcessing(false);
    } catch (err) {
      console.error('Bulk action failed:', err);
      alert('Failed to perform bulk action. Please try again.');
      setProcessing(false);
    }
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Actions</h1>
        <p className="text-gray-600 mt-1">Select and process multiple submissions at once</p>
      </div>

      {/* Bulk Action Controls */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-blue-900">{selectedIds.size} submissions selected</p>
              <p className="text-sm text-blue-700">Choose an action to apply to all selected submissions</p>
            </div>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Bulk Action</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select action...</option>
                <option value="approve">Approve All</option>
                <option value="reject">Reject All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">
                Notes (optional)
              </label>
              <input
                type="text"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Add notes for all submissions"
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleBulkAction}
            disabled={!bulkAction || processing}
            className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : `Apply Action to ${selectedIds.size} Submissions`}
          </button>
        </div>
      )}

      {/* Submissions List */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Pending Submissions</h2>
          <button
            onClick={toggleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            {selectedIds.size === submissions.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">No pending submissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
              const isSelected = selectedIds.has(submission.id);
              const daysAgo = getDaysAgo(submission.submitted_at);
              const isOverdue = (submission.status === 'new' && daysAgo > 5) || (submission.status === 'in_review' && daysAgo > 10);

              return (
                <div
                  key={submission.id}
                  onClick={() => toggleSelection(submission.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isOverdue
                      ? 'border-red-200 hover:border-red-400'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center h-6">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(submission.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{submission.title}</h3>
                          <p className="text-sm text-gray-600">
                            {submission.notice_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </p>
                        </div>
                        {isOverdue && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>From: {submission.organization_name}</span>
                        <span>•</span>
                        <span>Submitted: {formatDate(submission.submitted_at)}</span>
                        <span>•</span>
                        <span>{daysAgo} days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Bulk Action</h3>
            <p className="text-gray-600 mb-6">
              You are about to <span className="font-bold">{bulkAction}</span> {selectedIds.size} submissions.
              This action cannot be undone.
            </p>

            {bulkNotes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                <p className="text-sm text-gray-600">{bulkNotes}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
