import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Notice {
  id: string;
  notice_type: string;
  premises_name?: string;
  premises_address?: any;
  created_at: string;
  consultation_deadline?: string;
  status: string;
}

interface Representation {
  id: string;
  stance: 'support' | 'object' | 'comment';
  representation_text: string;
  submitter_name: string | null;
  submitter_email: string | null;
  is_anonymous: boolean;
  created_at: string;
  supporting_documents?: Array<{
    filename: string;
    url: string;
  }>;
}

export default function TrackNotice() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [representations, setRepresentations] = useState<Representation[]>([]);

  useEffect(() => {
    if (!token) {
      setError('No tracking token provided');
      setLoading(false);
      return;
    }

    loadNoticeData();
  }, [token]);

  async function loadNoticeData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch notice by tracking token
      const { data: noticeData, error: noticeError } = await supabase
        .from('notices')
        .select('id, notice_type, premises_name, premises_address, created_at, consultation_deadline, status')
        .eq('tracking_token', token)
        .single();

      if (noticeError || !noticeData) {
        setError('Notice not found. The tracking link may be invalid or expired.');
        setLoading(false);
        return;
      }

      setNotice(noticeData);

      // Fetch representations for this notice
      const { data: repsData, error: repsError } = await supabase
        .from('representations')
        .select('id, stance, representation_text, submitter_name, submitter_email, is_anonymous, created_at, supporting_documents')
        .eq('notice_id', noticeData.id)
        .order('created_at', { ascending: false });

      if (!repsError && repsData) {
        setRepresentations(repsData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading notice:', err);
      setError('Failed to load notice data');
      setLoading(false);
    }
  }

  const formatAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (address.formatted) return address.formatted;
    return [address.street, address.city, address.postcode].filter(Boolean).join(', ');
  };

  const getStanceBadge = (stance: string) => {
    const styles = {
      support: 'bg-green-100 text-green-800',
      object: 'bg-red-100 text-red-800',
      comment: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[stance as keyof typeof styles] || styles.comment}`}>
        {stance.charAt(0).toUpperCase() + stance.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your notice...</p>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-slate-900">Access Error</h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const supportCount = representations.filter(r => r.stance === 'support').length;
  const objectCount = representations.filter(r => r.stance === 'object').length;
  const commentCount = representations.filter(r => r.stance === 'comment').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Track Your Notice</h1>
              <p className="mt-1 text-sm text-slate-600">View representations and track engagement</p>
            </div>
            <Link
              to={`/notices/${notice.id}`}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
              View Public Notice
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notice Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Notice Details</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Type</dt>
              <dd className="mt-1 text-sm text-slate-900">{notice.notice_type}</dd>
            </div>
            {notice.premises_name && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Premises</dt>
                <dd className="mt-1 text-sm text-slate-900">{notice.premises_name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">Address</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatAddress(notice.premises_address)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Published</dt>
              <dd className="mt-1 text-sm text-slate-900">{format(new Date(notice.created_at), 'dd MMM yyyy')}</dd>
            </div>
            {notice.consultation_deadline && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Deadline</dt>
                <dd className="mt-1 text-sm text-slate-900">{format(new Date(notice.consultation_deadline), 'dd MMM yyyy')}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  notice.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {notice.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-green-100 p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Support</dt>
                    <dd className="text-lg font-semibold text-slate-900">{supportCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-red-100 p-3">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Object</dt>
                    <dd className="text-lg font-semibold text-slate-900">{objectCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-100 p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-500 truncate">Comments</dt>
                    <dd className="text-lg font-semibold text-slate-900">{commentCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Representations List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Representations ({representations.length})
            </h2>
          </div>

          {representations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">No representations yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Once people submit representations, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {representations.map((rep) => (
                <div key={rep.id} className="px-6 py-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStanceBadge(rep.stance)}
                      {rep.is_anonymous ? (
                        <span className="text-sm text-slate-500">Anonymous</span>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{rep.submitter_name}</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-500">
                      {format(new Date(rep.created_at), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{rep.representation_text}</p>

                  {rep.supporting_documents && rep.supporting_documents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500 mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {rep.supporting_documents.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
                          >
                            <svg className="mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {doc.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Keep this link private.</strong> Anyone with this tracking link can view representations on your notice.
                The link was sent to your email address when the notice was published.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
