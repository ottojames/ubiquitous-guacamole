import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, FileText, User, Building2,
  ArrowLeft, ExternalLink, Download, Share2, AlertCircle
} from 'lucide-react';
import * as UI from '@/styles/ui';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const NAV_LINKS = [
  { href: '/#notices', label: 'Find notices' },
  { href: '/#for-councils', label: 'For councils' },
  { href: '/pricing', label: 'Pricing' },
] as const;

type NoticeDetail = {
  id: string;
  noticeType: string;
  status: string;
  premisesName: string;
  premisesAddress: string;
  premisesPostcode: string;
  repsDeadline: string | null;
  applicationDate: string | null;
  publicationDate: string;
  newspaper: string | null;
  viewUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  applicantName: string | null;
  applicantAddress: string | null;
  licensingActivities: string[];
  openingHours: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
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

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'published':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'draft':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

function getDaysRemaining(deadline: string | null): { days: number; urgent: boolean } | null {
  if (!deadline) return null;
  try {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, urgent: diffDays <= 7 && diffDays >= 0 };
  } catch {
    return null;
  }
}

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

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
        console.error('[notice-detail] Error loading notice:', err);
        setError('Failed to load notice details');
        setLoading(false);
      });
  }, [id]);

  // Initialize map with same style as Notices page
  useEffect(() => {
    if (!mapContainer || !notice || !notice.latitude || !notice.longitude) return;

    let map: maplibregl.Map | null = null;
    let mounted = true;

    const initializeMap = () => {
      if (!mounted || !mapContainer) return;

      try {
        setMapLoading(true);
        setMapError(false);

        // Use same map style as NoticesMapView component
        const FALLBACK_MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
        const MAPTILER_STREETS_STYLE = import.meta.env.VITE_MAPTILER_KEY
          ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`
          : null;
        const MAP_STYLE =
          import.meta.env.VITE_MAP_STYLE_URL || MAPTILER_STREETS_STYLE || FALLBACK_MAP_STYLE;

        map = new maplibregl.Map({
          container: mapContainer,
          style: MAP_STYLE,
          center: [notice.longitude!, notice.latitude!],
          zoom: 14,
        });

        // Handle successful load
        map.on('load', () => {
          if (!mounted) return;
          setMapLoading(false);
          setMapError(false);
        });

        // Handle errors
        map.on('error', (e) => {
          console.warn('[map] Error loading map:', e);
          if (!mounted) return;
          setMapLoading(false);
          setMapError(true);
        });

        // Add controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        // Add marker
        new maplibregl.Marker({ color: '#2563eb' })
          .setLngLat([notice.longitude!, notice.latitude!])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <p class="font-semibold text-sm">${notice.premisesName || 'Notice Location'}</p>
                <p class="text-xs text-slate-600">${notice.premisesAddress || ''}</p>
              </div>`
            )
          )
          .addTo(map);

      } catch (err) {
        console.error('[map] Failed to initialize map:', err);
        setMapLoading(false);
        setMapError(true);
      }
    };

    initializeMap();

    return () => {
      mounted = false;
      if (map) {
        try {
          map.remove();
        } catch (err) {
          console.warn('[map] Error removing map:', err);
        }
      }
    };
  }, [mapContainer, notice]);

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

  const daysRemaining = getDaysRemaining(notice.repsDeadline);

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
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(notice.status)}`}>
                    {notice.status}
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
                    {notice.premisesName}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.share?.({ title: notice.premisesName, url: window.location.href })}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  {notice.viewUrl && (
                    <a
                      href={notice.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                      title="View original"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600 mb-6">
                <MapPin className="h-5 w-5" />
                <span className="text-sm">{notice.premisesAddress}</span>
              </div>

              {/* Full Notice Text */}
              {notice.description && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Full Notice</h2>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
{notice.description}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/70 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Publication Date</span>
                </div>
                <p className="text-slate-600 pl-8">{formatDate(notice.publicationDate)}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Application Date</span>
                </div>
                <p className="text-slate-600 pl-8">{formatDate(notice.applicationDate)}</p>
              </div>

              {notice.repsDeadline && (
                <div className={`rounded-2xl border bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${daysRemaining?.urgent ? 'border-amber-200 bg-amber-50' : 'border-white/70'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className={`h-5 w-5 ${daysRemaining?.urgent ? 'text-amber-600' : 'text-blue-600'}`} />
                    <span className="font-semibold text-slate-900">Representations Deadline</span>
                  </div>
                  <p className={`pl-8 ${daysRemaining?.urgent ? 'text-amber-900 font-semibold' : 'text-slate-600'}`}>
                    {formatDate(notice.repsDeadline)}
                    {daysRemaining && daysRemaining.days >= 0 && (
                      <span className="block text-sm mt-1">
                        {daysRemaining.days === 0 ? 'Today' : `${daysRemaining.days} day${daysRemaining.days !== 1 ? 's' : ''} remaining`}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {notice.newspaper && (
                <div className="rounded-2xl border border-white/70 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-slate-900">Publication</span>
                  </div>
                  <p className="text-slate-600 pl-8">{notice.newspaper}</p>
                </div>
              )}
            </div>

            {/* Applicant Info */}
            {notice.applicantName && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Applicant Information</h2>
                </div>
                <div className="space-y-2 pl-9">
                  <p className="text-slate-900 font-medium">{notice.applicantName}</p>
                  {notice.applicantAddress && (
                    <p className="text-slate-600 text-sm">{notice.applicantAddress}</p>
                  )}
                </div>
              </div>
            )}

            {/* Licensing Activities */}
            {notice.licensingActivities && notice.licensingActivities.length > 0 && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Licensed Activities</h2>
                </div>
                <ul className="space-y-2 pl-9">
                  {notice.licensingActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Map & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Map */}
            {notice.latitude && notice.longitude && (
              <div className="rounded-3xl border border-white/70 bg-white p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="relative">
                  <div
                    ref={setMapContainer}
                    className="h-[400px] rounded-2xl bg-slate-100"
                    style={{ width: '100%' }}
                  />
                  {/* Map loading overlay */}
                  {mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                      <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
                        <p className="text-xs text-slate-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                  {/* Map error state */}
                  {mapError && !mapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-2xl">
                      <div className="text-center px-4">
                        <MapPin className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-600">Unable to load map</p>
                        <p className="text-xs text-slate-500 mt-1">Location data available below</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-slate-900 mb-1">Location</p>
                  <p className="text-sm text-slate-600">{notice.premisesPostcode}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {notice.latitude.toFixed(6)}, {notice.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-blue-50 to-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <h3 className="font-bold text-slate-900 mb-4">Need to Respond?</h3>
              <p className="text-sm text-slate-600 mb-4">
                If you have concerns or support for this notice, you can submit representations before the deadline.
              </p>
              <button
                onClick={() => navigate(`/notices/${notice.id}/respond`)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
              >
                Submit Representation
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-50 py-12 mt-16">
        <div className={UI.container}>
          <div className="text-center text-sm text-slate-600">
            <p className="mb-2">© 2025 CivicNotices. Making local democracy transparent.</p>
            <p className="text-xs text-slate-500">
              Notice ID: {notice.id}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
