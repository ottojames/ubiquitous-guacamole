import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import * as UI from '@/styles/ui';
import RepresentationForm from '@/components/notice/RepresentationForm';

const NAV_LINKS = [
  { href: '/#notices', label: 'Find notices' },
  { href: '/#for-councils', label: 'For councils' },
  { href: '/pricing', label: 'Pricing' },
] as const;

interface Notice {
  id: string;
  noticeType: string;
  premisesName: string;
  premisesAddress: string;
  repsDeadline: string | null;
  extras?: {
    noticeCategory?: string;
  };
}

export default function NoticeRespondPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No notice ID provided');
      setLoading(false);
      return;
    }

    fetch(`/api/notices/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load notice: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setNotice(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[notice-respond] Error loading notice:', err);
        setError('Failed to load notice details');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-base text-slate-600">Loading notice details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Notice Not Found</h2>
            <p className="text-slate-600 mb-6">{error || "The notice you're looking for doesn't exist."}</p>
            <button
              onClick={() => navigate('/notices')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Notices
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine notice category from notice type
  const getNoticeCategory = () => {
    const type = notice.noticeType?.toLowerCase() || '';

    if (type.includes('licensing') || type.includes('premises') || type.includes('club')) {
      return 'licensing';
    } else if (type.includes('planning') || type.includes('development') || type.includes('conservation')) {
      return 'planning';
    } else if (type.includes('gambling') || type.includes('betting') || type.includes('gaming')) {
      return 'gambling';
    } else if (type.includes('tro') || type.includes('traffic')) {
      return 'tro';
    } else if (type.includes('gvol') || type.includes('goods vehicle') || type.includes('operating centre')) {
      return 'gvol';
    } else if (type.includes('environmental') || type.includes('noise') || type.includes('pollution')) {
      return 'environmental';
    }

    return notice.extras?.noticeCategory || 'general';
  };

  return (
    <div className={`${UI.pageWrap} min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg" style={{ height: 'var(--headerH)' }}>
        <div className={`${UI.container} h-full`}>
          <div className="flex h-full items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-extrabold tracking-tight text-slate-900" style={{ letterSpacing: '-0.5px' }}>
                CivicNotices
              </a>
              <nav className="hidden items-center gap-6 md:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/notices/${id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Notice
              </button>
              <a
                href="/publish"
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Publish a notice
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${UI.container} py-12`}>
        <RepresentationForm
          noticeId={notice.id}
          noticeType={notice.noticeType}
          noticeCategory={getNoticeCategory()}
          premisesName={notice.premisesName}
          premisesAddress={notice.premisesAddress}
          deadline={notice.repsDeadline}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-50 py-12 mt-16">
        <div className={UI.container}>
          <div className="text-center text-sm text-slate-600">
            <p className="mb-2">© 2025 CivicNotices. Making local democracy transparent.</p>
            <p className="text-xs text-slate-500">
              All representations are public documents and will be shared with the applicant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}