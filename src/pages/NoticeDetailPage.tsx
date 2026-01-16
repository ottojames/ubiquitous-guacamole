import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, FileText, User, Building2,
  ArrowLeft, ExternalLink, Download, Share2, AlertCircle, MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';
import * as UI from '@/styles/ui';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRepresentations, type Representation } from '@/hooks/useRepresentations';

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
  applicantEmail: string | null;
  dpsName: string | null;
  dpsLicenceNumber: string | null;
  applicationReference: string | null;
  licensingActivities: string[];
  openingHours: string | null;
  description: string | null;
  contactEmail: string | null;
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

  // Fetch representations for this notice
  const { representations, stats, loading: repsLoading } = useRepresentations(id);
  const [representationsFilter, setRepresentationsFilter] = useState<'all' | 'objection' | 'support' | 'comment'>('all');

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

        // Track view for this notice
        fetch(`/api/notices/${id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timestamp: new Date().toISOString() })
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              console.log(`[notice-detail] View tracked: ${result.is_new_view ? 'new' : 'duplicate'} view, total: ${result.view_count}`);
            }
          })
          .catch(err => {
            console.error('[notice-detail] Failed to track view:', err);
          });
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

        // Add red marker for notice location
        new maplibregl.Marker({ color: '#DC2626' }) // Red color for the pin
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
                <div className="space-y-3 pl-9">
                  <div>
                    <p className="text-slate-900 font-medium">{notice.applicantName}</p>
                    {notice.applicantAddress && (
                      <p className="text-slate-600 text-sm mt-1">{notice.applicantAddress}</p>
                    )}
                  </div>
                  {notice.applicantEmail && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Contact</p>
                      <a href={`mailto:${notice.applicantEmail}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        {notice.applicantEmail}
                      </a>
                    </div>
                  )}
                  {notice.applicationReference && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Application Reference</p>
                      <p className="text-slate-900 text-sm font-mono">{notice.applicationReference}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Licensing Activities & Operating Hours */}
            {(notice.licensingActivities?.length > 0 || notice.openingHours) && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Licensed Activities & Hours</h2>
                </div>

                {notice.licensingActivities?.length > 0 && (
                  <div className="mb-6 pl-9">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Licensed Activities</p>
                    <div className="flex flex-wrap gap-2">
                      {notice.licensingActivities.map((activity: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {notice.openingHours && (
                  <div className="pl-9">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Operating Hours</p>
                    <div className="space-y-2">
                      {typeof notice.openingHours === 'object' && !Array.isArray(notice.openingHours) ? (
                        Object.entries(notice.openingHours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                            <span className="text-slate-900 font-medium capitalize">{day}</span>
                            <span className="text-slate-600 font-mono text-sm">{String(hours)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-600">{String(notice.openingHours)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DPS Information */}
            {notice.dpsName && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Designated Premises Supervisor</h2>
                </div>
                <div className="space-y-2 pl-9">
                  <p className="text-slate-900 font-medium">{notice.dpsName}</p>
                  {notice.dpsLicenceNumber && (
                    <p className="text-slate-600 text-sm">Licence: {notice.dpsLicenceNumber}</p>
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

            {/* How to Respond - Council Contact */}
            {notice.noticeType?.includes('licensing') && notice.contactEmail && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">How to Submit Representations</h2>
                </div>
                <div className="space-y-4 text-sm text-slate-700">
                  <p className="leading-relaxed">
                    Any person wishing to make a representation about this application should do so in writing to the licensing authority before the deadline above.
                  </p>
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Licensing Authority Contact</p>
                    <a href={`mailto:${notice.contactEmail}`} className="text-blue-600 hover:text-blue-700 font-medium break-all">
                      {notice.contactEmail}
                    </a>
                  </div>
                  <div className="pt-4 border-t border-blue-200">
                    <p className="font-semibold text-slate-900 mb-2">Relevant Licensing Objectives:</p>
                    <ul className="space-y-1.5 ml-4">
                      <li className="flex gap-2 items-start">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>The prevention of crime and disorder</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Public safety</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>The prevention of public nuisance</span>
                      </li>
                      <li className="flex gap-2 items-start">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>The protection of children from harm</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600 italic">
                      Representations must relate to one or more of these licensing objectives under the Licensing Act 2003.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Map & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mini-Map with 1km Radius */}
            {notice.latitude && notice.longitude && (
              <div className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Location Map</h3>
                </div>
                <div className="relative">
                  <div
                    ref={setMapContainer}
                    className="h-[300px] rounded-2xl bg-slate-100"
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
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">Premises Location</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                      1km radius shown
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">{notice.premisesAddress}</p>
                    <p className="text-sm text-slate-600">{notice.premisesPostcode}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {notice.latitude.toFixed(6)}, {notice.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* RESIDENT ACTION CARD - THIS IS FOR RESIDENTS! */}
            {notice.repsDeadline && getDaysRemaining(notice.repsDeadline) && (
              <div className="sticky top-24 rounded-3xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-2xl">
                <div className="mb-4 flex items-start gap-3">
                  <div className="rounded-full bg-blue-600 p-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Have Your Say</h3>
                    <p className="mt-1 text-sm text-slate-600">Residents can submit their views</p>
                  </div>
                </div>

                {(() => {
                  const remaining = getDaysRemaining(notice.repsDeadline);
                  const isUrgent = remaining && remaining.urgent;
                  const daysLeft = remaining?.days ?? 0;

                  return (
                    <div className={`mb-6 rounded-xl border-2 p-4 ${
                      isUrgent
                        ? 'border-red-300 bg-red-50'
                        : 'border-emerald-300 bg-emerald-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className={`h-5 w-5 ${isUrgent ? 'text-red-600' : 'text-emerald-600'}`} />
                        <p className={`font-bold ${isUrgent ? 'text-red-900' : 'text-emerald-900'}`}>
                          {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left to respond` : 'Deadline today'}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700">
                        <span className="font-semibold">Deadline:</span> {formatDate(notice.repsDeadline)}
                      </p>
                    </div>
                  );
                })()}

                <div className="space-y-3 mb-6 text-sm text-slate-700">
                  <p className="font-medium">You can submit a representation if:</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <span>You live near the premises</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Your business is affected</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <span>You represent a community group</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate(`/notices/${id}/respond`)}
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 text-center text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Submit Your Representation
                </button>

                <p className="mt-4 text-xs text-center text-slate-500">
                  Your submission will be considered by the licensing authority
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PUBLIC REPRESENTATIONS SECTION - LEGALLY REQUIRED (Licensing Act 2003 s.35(5)) */}
        {stats.total > 0 && (
          <div className="mt-16">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              {/* Header with Stats */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-7 w-7 text-blue-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Public Representations ({stats.total})
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      All representations are public documents under the Licensing Act 2003
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setRepresentationsFilter('all')}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    representationsFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All ({stats.total})
                </button>
                {stats.objections > 0 && (
                  <button
                    onClick={() => setRepresentationsFilter('objection')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      representationsFilter === 'objection'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Objections ({stats.objections})
                  </button>
                )}
                {stats.support > 0 && (
                  <button
                    onClick={() => setRepresentationsFilter('support')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      representationsFilter === 'support'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Support ({stats.support})
                  </button>
                )}
                {stats.comments > 0 && (
                  <button
                    onClick={() => setRepresentationsFilter('comment')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      representationsFilter === 'comment'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Comments ({stats.comments})
                  </button>
                )}
              </div>

              {/* Representations List */}
              <div className="space-y-6">
                {repsLoading ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                    <p className="text-sm text-slate-600">Loading representations...</p>
                  </div>
                ) : (
                  representations
                    .filter((rep) => representationsFilter === 'all' || rep.type === representationsFilter)
                    .map((rep) => (
                      <div
                        key={rep.id}
                        className={`rounded-2xl border-2 p-6 transition-all ${
                          rep.type === 'objection'
                            ? 'border-red-200 bg-red-50/50'
                            : rep.type === 'support'
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-blue-200 bg-blue-50/50'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg font-bold text-slate-900">
                                {rep.representor_name}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                  rep.type === 'objection'
                                    ? 'bg-red-600 text-white'
                                    : rep.type === 'support'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {rep.type === 'objection' && <ThumbsDown className="h-3 w-3" />}
                                {rep.type === 'support' && <ThumbsUp className="h-3 w-3" />}
                                {rep.type === 'comment' && <MessageSquare className="h-3 w-3" />}
                                {rep.type}
                              </span>
                            </div>
                            {rep.representor_address && typeof rep.representor_address === 'object' && rep.representor_address.town && (
                              <p className="text-sm text-slate-600">
                                Resident of {rep.representor_address.town}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Submitted</p>
                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(rep.submitted_at)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 font-mono">
                              Ref: {rep.reference_number}
                            </p>
                          </div>
                        </div>

                        {/* Grounds (for licensing objections) */}
                        {rep.grounds && (
                          <div className="mb-4 rounded-lg bg-white/80 p-3 border border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                              Licensing Grounds Cited
                            </p>
                            <div className="text-sm text-slate-700">
                              {Array.isArray(rep.grounds) ? (
                                <ul className="space-y-1">
                                  {rep.grounds.map((ground: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-blue-600 mt-0.5">•</span>
                                      <span>{ground}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : typeof rep.grounds === 'object' && rep.grounds !== null ? (
                                <div className="space-y-2">
                                  {rep.grounds.concerns && (
                                    <div>
                                      <span className="font-semibold">Concerns: </span>
                                      <span>{rep.grounds.concerns}</span>
                                    </div>
                                  )}
                                  {rep.grounds.support_reason && (
                                    <div>
                                      <span className="font-semibold">Reason: </span>
                                      <span>{rep.grounds.support_reason}</span>
                                    </div>
                                  )}
                                  {rep.grounds.licensing_objectives && Array.isArray(rep.grounds.licensing_objectives) && (
                                    <div>
                                      <span className="font-semibold">Licensing Objectives: </span>
                                      <ul className="mt-1 space-y-1">
                                        {rep.grounds.licensing_objectives.map((obj: string, idx: number) => (
                                          <li key={idx} className="flex items-start gap-2 ml-4">
                                            <span className="text-blue-600 mt-0.5">•</span>
                                            <span>{obj}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span>{String(rep.grounds)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Representation Text */}
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {rep.representation_text}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* No representations message when filtered */}
              {!repsLoading && representations.filter((rep) => representationsFilter === 'all' || rep.type === representationsFilter).length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No {representationsFilter !== 'all' ? representationsFilter + 's' : 'representations'} to display</p>
                </div>
              )}
            </div>
          </div>
        )}
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
