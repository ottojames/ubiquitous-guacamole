import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { getDepartmentConfig } from '@/config/departmentConfig';
import { isClosingSoon, formatCouncilDate } from '@/lib/dateUtils';
import RepresentationsList from '@/components/council/RepresentationsList';
import EvidencePackDownload from '@/components/council/EvidencePackDownload';
import { supabase } from '@/lib/supabase';

// P1-001: Interface for real audit log entries
interface AuditEntry {
  id: string;
  action: string;
  action_category: string;
  created_at: string;
  user_email?: string;
  metadata?: any;
}

// P1-001: Interface for representation stats
interface RepStats {
  total: number;
  objections: number;
  support: number;
}

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
  premisesPostcode: string;
  publicationDate: string;
  repsDeadline: string | null;
  noticeText?: string;
  proof_pdf_url?: string | null;
  applicantName?: string;
  applicantAddress?: string;
  applicantEmail?: string;
  dpsName?: string;
  dpsLicenceNumber?: string;
  licensingActivities?: string[];
  openingHours?: any;
  description?: string;
  applicationDate?: string;
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
  // P1-001: State for real audit history and representation stats
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [repStats, setRepStats] = useState<RepStats>({ total: 0, objections: 0, support: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Get department-specific configuration
  const deptConfig = getDepartmentConfig(department.type);

  useEffect(() => {
    loadNoticeData();
  }, [noticeId]);

  // P1-001: Load audit history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && noticeId) {
      loadAuditHistory();
      loadRepresentationStats();
    }
  }, [activeTab, noticeId]);

  // P1-001: Fetch real audit log entries for this notice
  const loadAuditHistory = async () => {
    if (!noticeId) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, action_category, created_at, user_email, metadata')
        .eq('resource_id', noticeId)
        .eq('resource_type', 'notice')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditHistory(data || []);
    } catch (err) {
      console.error('Failed to load audit history:', err);
      setAuditHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // P1-001: Fetch real representation counts for this notice
  const loadRepresentationStats = async () => {
    if (!noticeId) return;
    try {
      const { data, error } = await supabase
        .from('representations')
        .select('type')
        .eq('notice_id', noticeId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        objections: data?.filter(r => r.type === 'objection').length || 0,
        support: data?.filter(r => r.type === 'support').length || 0
      };
      setRepStats(stats);
    } catch (err) {
      console.error('Failed to load representation stats:', err);
    }
  };

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
        premisesPostcode: data.premisesPostcode || '',
        publicationDate: data.publicationDate || data.published_at || '',
        repsDeadline: data.repsDeadline || null,
        noticeText: data.noticeText || data.text || data.description || '',
        proof_pdf_url: data.proof_pdf_url || null,
        applicantName: data.applicantName || null,
        applicantAddress: data.applicantAddress || null,
        applicantEmail: data.applicantEmail || null,
        dpsName: data.dpsName || null,
        dpsLicenceNumber: data.dpsLicenceNumber || null,
        licensingActivities: data.licensingActivities || [],
        openingHours: data.openingHours || null,
        description: data.description || null,
        applicationDate: data.applicationDate || null,
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Details</h2>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Premises Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Premises Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Name</p>
                    <p className="text-base text-gray-900 font-semibold">{notice.premisesName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                    <p className="text-base text-gray-900">{notice.premisesAddress}</p>
                    {notice.premisesPostcode && (
                      <p className="text-base text-gray-900 font-mono mt-1">{notice.premisesPostcode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Application Type</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Notice Type</p>
                    <p className="text-base text-gray-900 font-semibold">
                      {notice.noticeType === 'licensing-premises-new' && 'Premises Licence - New Application'}
                      {notice.noticeType === 'licensing-premises-variation' && 'Premises Licence - Variation'}
                      {notice.noticeType === 'licensing-club-new' && 'Club Premises Certificate - New'}
                      {notice.noticeType === 'gambling-premises-new' && 'Gambling Premises Licence - New'}
                      {!['licensing-premises-new', 'licensing-premises-variation', 'licensing-club-new', 'gambling-premises-new'].includes(notice.noticeType) && notice.noticeType}
                    </p>
                  </div>
                  {notice.applicationDate && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Application Date</p>
                      <p className="text-base text-gray-900">{formatDate(notice.applicationDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Publication Date</p>
                    <p className="text-base text-gray-900">{formatDate(notice.publicationDate)}</p>
                  </div>
                </div>
              </div>

              {/* Applicant Information */}
              {(notice.applicantName || notice.noticeType.includes('licensing')) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Applicant Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Applicant</p>
                      <p className="text-base text-gray-900 font-semibold">
                        {notice.applicantName || `${notice.premisesName} Limited`}
                      </p>
                    </div>
                    {notice.applicantAddress && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Address</p>
                        <p className="text-base text-gray-900">{notice.applicantAddress}</p>
                      </div>
                    )}
                    {notice.applicantEmail && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Contact Email</p>
                        <p className="text-base text-blue-600">{notice.applicantEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Consultation Period */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Consultation Period</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Published</p>
                    <p className="text-base text-gray-900">{formatCouncilDate(notice.publicationDate)}</p>
                  </div>
                  {notice.repsDeadline && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">
                        {deptConfig.repLabelPlural} Deadline
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-base text-gray-900 font-semibold">
                          {formatCouncilDate(notice.repsDeadline)}
                        </p>
                        {isClosingSoon(notice.repsDeadline) && notice.status !== 'expired' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Consultation Period</p>
                    <p className="text-base text-gray-900">28 days (statutory minimum)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Licensing Activities - Full Width if present */}
            {notice.licensingActivities && notice.licensingActivities.length > 0 && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Licensable Activities</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notice.licensingActivities.map((activity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-900">
                      <svg className="w-4 h-4 text-cyan-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-base">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* P1-002: Show "No activities specified" instead of fake data when none present */}
            {(!notice.licensingActivities || notice.licensingActivities.length === 0) && notice.noticeType.includes('licensing') && (
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Licensable Activities</h3>
                </div>
                <p className="text-gray-600 italic">No activities specified in this application.</p>
              </div>
            )}

            {/* P1-003: Operating Hours - Only show if actual data exists, otherwise show "Hours not specified" */}
            {notice.noticeType.includes('licensing') && (
              <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 border border-rose-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Proposed Operating Hours</h3>
                </div>
                {notice.openingHours ? (
                  <div className="space-y-2">
                    {Object.entries(notice.openingHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center py-2 border-b border-rose-100 last:border-0">
                        <span className="font-semibold text-gray-900 capitalize">{day}</span>
                        <span className="text-gray-700">{hours.start} - {hours.end}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">Hours not specified in this application.</p>
                )}
              </div>
            )}

            {/* DPS Information if available */}
            {notice.dpsName && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Designated Premises Supervisor</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Name</p>
                    <p className="text-base text-gray-900 font-semibold">{notice.dpsName}</p>
                  </div>
                  {notice.dpsLicenceNumber && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Personal Licence Number</p>
                      <p className="text-base text-gray-900 font-mono">{notice.dpsLicenceNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Notice Text */}
            {notice.noticeText && (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Full Statutory Notice Text
                </h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {notice.noticeText}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'representations' && noticeId && (
          department.id ? (
            <RepresentationsList
              noticeId={noticeId}
              userId={department.id}
              repLabel={deptConfig.repLabel}
              repLabelPlural={deptConfig.repLabelPlural}
            />
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 font-semibold">Unable to load representations</p>
              <p className="text-gray-600 text-sm mt-1">Department context is not available. Please refresh the page or contact support.</p>
            </div>
          )
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Documents</h2>

            <div className="space-y-3">
              {/* Published Notice (Proof) - Only real document shown */}
              {notice.proof_pdf_url ? (
                <a
                  href={notice.proof_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-gray-900">Published Notice (Proof)</p>
                      <p className="text-sm text-gray-600">Proof of publication as displayed to public</p>
                      <p className="text-xs text-gray-500 mt-1">PDF • Published {formatDate(notice.publicationDate)}</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-50">
                    Download
                  </span>
                </a>
              ) : (
                <div className="p-4 border border-gray-200 rounded-xl bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-amber-600 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-amber-900">Published Notice (Proof) - Pending</p>
                      <p className="text-sm text-amber-700">Proof of publication will appear here once available</p>
                      <p className="text-xs text-amber-600 mt-1">Usually available the morning after publication</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Evidence Pack Download */}
            <div className="mt-6">
              <EvidencePackDownload
                noticeId={notice.id}
                noticeType={notice.noticeType}
                variant="card"
              />
            </div>

            {/* Document Info Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 mb-1">Document Access</p>
                  <p className="text-gray-700">
                    Application documents such as site plans and operating schedules are submitted directly to the licensing authority. Contact the licensing team for access to the full application file. Representations and decision notices will be added to this section as they become available.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* P1-001: History tab now shows real audit data instead of hardcoded timeline */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Application Timeline</h2>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Current Status - Based on notice status and deadline */}
                {notice.status === 'published' && notice.repsDeadline && new Date(notice.repsDeadline) > new Date() && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 bg-green-600 rounded-full"></div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">Consultation Active</p>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Current
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Public consultation period in progress. Representations being accepted until deadline.
                      </p>
                      <p className="text-xs text-gray-500">
                        Deadline: {formatCouncilDate(notice.repsDeadline)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Representations received - Real count from database */}
                {repStats.total > 0 && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 bg-blue-600 rounded-full"></div>
                    <div className="flex-1 pb-6">
                      <p className="font-semibold text-gray-900">{repStats.total} Representation{repStats.total !== 1 ? 's' : ''} Received</p>
                      <p className="text-sm text-gray-600 mb-2">
                        {repStats.objections > 0 && `${repStats.objections} objection${repStats.objections !== 1 ? 's' : ''}`}
                        {repStats.objections > 0 && repStats.support > 0 && ' and '}
                        {repStats.support > 0 && `${repStats.support} support submission${repStats.support !== 1 ? 's' : ''}`}
                        {repStats.objections === 0 && repStats.support === 0 && `${repStats.total} comment${repStats.total !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Real audit log entries */}
                {auditHistory.length > 0 ? (
                  auditHistory.map((entry, idx) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className={`flex-shrink-0 w-2 rounded-full ${
                        entry.action.includes('created') ? 'bg-green-600' :
                        entry.action.includes('published') ? 'bg-purple-600' :
                        entry.action.includes('updated') ? 'bg-blue-600' :
                        entry.action.includes('viewed') ? 'bg-gray-400' :
                        'bg-indigo-600'
                      }`}></div>
                      <div className={`flex-1 ${idx < auditHistory.length - 1 ? 'pb-6' : ''}`}>
                        <p className="font-semibold text-gray-900 capitalize">
                          {entry.action.replace(/_/g, ' ').replace(/\./g, ' ')}
                        </p>
                        {entry.user_email && (
                          <p className="text-sm text-gray-600 mb-1">
                            By: {entry.user_email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {/* Fallback: Show publication event from notice data */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-2 bg-purple-600 rounded-full"></div>
                      <div className="flex-1 pb-6">
                        <p className="font-semibold text-gray-900">Notice Published</p>
                        <p className="text-sm text-gray-600 mb-2">
                          Statutory public notice published and consultation period commenced
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(notice.publicationDate)}</p>
                      </div>
                    </div>

                    {/* Application date if available */}
                    {notice.applicationDate && (
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-2 bg-amber-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Application Received</p>
                          <p className="text-sm text-gray-600 mb-2">
                            Application submitted by applicant
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(notice.applicationDate)}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Empty state for audit history */}
                {auditHistory.length === 0 && !notice.applicationDate && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No detailed audit history available for this notice.</p>
                    <p className="text-sm mt-1">Activity will be recorded as events occur.</p>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps - Only show if consultation is still active */}
            {notice.status === 'published' && notice.repsDeadline && new Date(notice.repsDeadline) > new Date() && (
              <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Next Steps</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Consultation period closes on {formatCouncilDate(notice.repsDeadline)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Officer will prepare report summarizing all representations received</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Application will be determined by Licensing Sub-Committee hearing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Decision notice will be issued to all parties within 5 working days</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
