import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, ExternalLink, ArrowRight, Calendar, Clock, Download } from 'lucide-react';
import * as UI from '@/styles/ui';

type NoticeDetail = {
  id: string;
  premisesName: string;
  noticeType: string;
  publicationDate: string;
  repsDeadline: string | null;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

export default function PublishConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublished = searchParams.get('published') === 'true';

  useEffect(() => {
    if (!id || !isPublished) {
      // If not coming from publish flow, redirect to notice detail
      navigate(`/notices/${id || ''}`);
      return;
    }

    fetch(`/api/notices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notice');
        return res.json();
      })
      .then((data) => {
        setNotice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading notice:', err);
        setLoading(false);
      });
  }, [id, isPublished, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <p className="text-slate-600">Notice not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(notice.repsDeadline);

  // Check if this is a licensing notice that supports blue notice PDFs
  const licensingTypes = [
    'premises-licence',
    'premises-licence-variation',
    'premises-licence-transfer',
    'premises-licence-review',
    'club-premises-certificate',
    'temporary-event-notice'
  ];
  const isLicensingNotice = licensingTypes.includes(notice.noticeType);

  const handleDownloadBlueNotice = async () => {
    try {
      const response = await fetch(`/api/blue-notices/${notice.id}`);

      if (!response.ok) {
        throw new Error('Failed to generate blue notice PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blue-notice-${notice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading blue notice:', error);
      alert('Failed to download blue notice PDF. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className={`${UI.container} flex items-center justify-between py-4`}>
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
          >
            CivicNotices
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Back to Home
          </button>
        </div>
      </header>

      {/* Success Content */}
      <div className={`${UI.container} py-12`}>
        <div className="mx-auto max-w-3xl">
          {/* Success Hero */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-xl">
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="mb-3 text-4xl font-bold text-slate-900">
              Notice Published Successfully!
            </h1>
            <p className="text-lg text-slate-600">
              Your notice is now live and visible to the public
            </p>
          </div>

          {/* Notice Details Card */}
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">{notice.premisesName}</h2>
              <p className="mt-1 text-blue-100">{notice.noticeType}</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4" />
                    Published Date
                  </div>
                  <p className="text-lg font-medium text-slate-900">
                    {formatDate(notice.publicationDate)}
                  </p>
                </div>

                {notice.repsDeadline && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Clock className="h-4 w-4" />
                      Representations Deadline
                    </div>
                    <p className="text-lg font-medium text-slate-900">
                      {formatDate(notice.repsDeadline)}
                    </p>
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-lg">
            <h3 className="mb-4 text-xl font-bold text-emerald-900">
              What Happens Next?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <p className="text-slate-700">
                  Your notice is now <strong>live on the public portal</strong> and visible to everyone
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <p className="text-slate-700">
                  Members of the public can <strong>submit representations</strong> before the deadline
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <p className="text-slate-700">
                  The licensing authority will <strong>review your application</strong> and any representations received
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <p className="text-slate-700">
                  You will be notified of any <strong>representations or decisions</strong> regarding your application
                </p>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4">
            {/* Primary Actions Row */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/notices/${notice.id}`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-800"
              >
                <FileText className="h-5 w-5" />
                View Public Notice
                <ExternalLink className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            {/* Blue Notice PDF Download - only for licensing notices */}
            {isLicensingNotice && (
              <button
                onClick={handleDownloadBlueNotice}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-cyan-700"
              >
                <Download className="h-5 w-5" />
                Download Blue Notice PDF
                <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs">
                  For display at premises
                </span>
              </button>
            )}
          </div>

          {/* Notice ID */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Notice ID: <span className="font-mono font-semibold text-slate-700">{notice.id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
