import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { getDepartmentConfig } from '@/config/departmentConfig';
import { isClosingSoon, formatCouncilDate } from '@/lib/dateUtils';
import RepresentationsList from '@/components/council/RepresentationsList';

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

interface NoticeDetailData {
  id: string;
  title: string;
  noticeType: string;
  status: string;
  premisesName: string;
  premisesAddress: string;
  publicationDate: string;
  repsDeadline: string | null;
  noticeText?: string;
  proof_pdf_url?: string | null;
}

type TabType = 'overview' | 'representations' | 'documents' | 'history';

export default function NoticeDetail() {
  const { department } = useOutletContext<ContextType>();
  const { orgSlug, deptSlug, noticeId } = useParams<{ orgSlug: string; deptSlug: string; noticeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Get department-specific configuration
  const deptConfig = getDepartmentConfig(department.type);

  useEffect(() => {
    loadNoticeData();
  }, [noticeId]);

  const loadNoticeData = async () => {
    try {
      const response = await fetch(`/api/notices/${noticeId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('This notice could not be found. It may have been removed or is not yet published.');
        } else {
          setError('This notice could not be retrieved. Please try again later.');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setNotice({
        id: data.id,
        title: data.title || data.premisesName || 'Notice',
        noticeType: data.noticeType || 'Unknown',
        status: data.status || 'published',
        premisesName: data.premisesName || '',
        premisesAddress: data.premisesAddress || '',
        publicationDate: data.publicationDate || data.published_at || '',
        repsDeadline: data.repsDeadline || null,
        noticeText: data.noticeText || data.text || '',
        proof_pdf_url: data.proof_pdf_url || null,
      });
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load notice:', err);
      setError('This notice could not be retrieved. Please try again later.');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 mb-4">
          {error || 'This notice could not be found. It may have been removed or is not yet published.'}
        </p>
        <Link
          to={`/c/${orgSlug}/${deptSlug}/notices`}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Back to Notices
        </Link>
      </div>
    );
  }

  const basePath = `/c/${orgSlug}/${deptSlug}`;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'representations', label: deptConfig.repLabelPlural },
    { id: 'documents', label: 'Documents' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link to={`${basePath}/dashboard`} className="hover:text-gray-900">Dashboard</Link>
          <span>›</span>
          <Link to={`${basePath}/notices`} className="hover:text-gray-900">Notices</Link>
          <span>›</span>
          <span className="text-gray-900">{notice.title}</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{notice.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">URN: {notice.id.slice(0, 8)}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(notice.status)}`}>
                {formatStatus(notice.status)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <a
              href={`/notices/${notice.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              View Public Version ↗
            </a>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-600">Published:</span>{' '}
            <span className="font-semibold">{formatCouncilDate(notice.publicationDate)}</span>
          </div>
          {notice.repsDeadline && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">{deptConfig.repLabelPlural} close:</span>{' '}
              <span className="font-semibold">{formatCouncilDate(notice.repsDeadline)}</span>
              {isClosingSoon(notice.repsDeadline) && notice.status !== 'expired' && (
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full ml-1"
                      title="Closing within 48 hours"></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notice Overview</h2>
            <div className="prose max-w-none">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premises</h3>
                <p className="text-gray-700">{notice.premisesName}</p>
                <p className="text-gray-600 text-sm">{notice.premisesAddress}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notice Type</h3>
                <p className="text-gray-700">{notice.noticeType}</p>
              </div>

              {notice.noticeText && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Notice Text</h3>
                  <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {notice.noticeText}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'representations' && noticeId && (
          <RepresentationsList
            noticeId={noticeId}
            userId={department.id || 'demo-user'}
            repLabel={deptConfig.repLabel}
            repLabelPlural={deptConfig.repLabelPlural}
          />
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Documents</h2>

            <div className="space-y-3">
              {notice.proof_pdf_url ? (
                <a
                  href={notice.proof_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Public Notice PDF</p>
                      <p className="text-sm text-gray-600">Generated notice document</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Download ↗
                  </span>
                </a>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-amber-600 font-semibold mb-2">Awaiting proof.</p>
                  <p className="text-sm">This usually appears the morning after publication.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">History</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold text-gray-900">Published</p>
                  <p className="text-sm text-gray-600">Notice published and made live</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notice.publicationDate)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
