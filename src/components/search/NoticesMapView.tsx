import 'maplibre-gl/dist/maplibre-gl.css';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import MapGL, { Marker, NavigationControl, Popup, type MapRef, type ViewState } from 'react-map-gl/maplibre';
import Supercluster from 'supercluster';
import type { Feature, Point } from 'geojson';

import type { NoticeBoundingBox, NoticeSearchItem } from '@/lib/notices';

const DEFAULT_VIEW_STATE: ViewState = {
  latitude: 54.5,
  longitude: -2.5,
  zoom: 5.5,
  bearing: 0,
  pitch: 0,
};

const DEFAULT_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json';

type NoticePointProperties = {
  noticeId: string;
};

type NoticesMapViewProps = {
  notices: NoticeSearchItem[];
  loading?: boolean;
  activeNoticeId?: string | null;
  hoveredNoticeId?: string | null;
  onActiveNoticeChange?: (noticeId: string | null) => void;
  onHoverNoticeChange?: (noticeId: string | null) => void;
  onBoundsChange?: (bbox: NoticeBoundingBox, zoom: number) => void;
  initialViewState?: Partial<ViewState>;
  initialBounds?: NoticeBoundingBox | null;
  autoFitToNotices?: boolean;
  mapStyleUrl?: string;
  className?: string;
};

type PointFeature = Supercluster.PointFeature<NoticePointProperties>;
type ClusterFeature = Supercluster.ClusterFeature<NoticePointProperties>;

type ClusterItem = Feature<Point, NoticePointProperties & Supercluster.ClusterProperties>;

function formatAddress(address: NoticeSearchItem['premisesAddress']): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [address.line1, address.line2, address.town, address.postcode]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.join(', ');
}

function toBoundingBox(bounds: maplibregl.LngLatBounds): NoticeBoundingBox {
  return [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
}

export function NoticesMapView({
  notices,
  loading,
  activeNoticeId,
  hoveredNoticeId,
  onActiveNoticeChange,
  onHoverNoticeChange,
  onBoundsChange,
  initialViewState,
  initialBounds,
  autoFitToNotices = true,
  mapStyleUrl,
  className = '',
}: NoticesMapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    ...initialViewState,
  });
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const mergedActiveId = activeNoticeId ?? internalActiveId;
  const fitKeyRef = useRef<string | null>(null);
  const previousActiveRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialViewState) {
      setViewState((prev) => ({ ...prev, ...initialViewState }));
    }
  }, [initialViewState]);

  const noticeLookup = useMemo(() => {
    return new globalThis.Map(notices.map((notice) => [notice.id, notice]));
  }, [notices]);

  const pointFeatures = useMemo<PointFeature[]>(() => {
    return notices
      .filter((notice) =>
        typeof notice.longitude === 'number' &&
        Number.isFinite(notice.longitude) &&
        typeof notice.latitude === 'number' &&
        Number.isFinite(notice.latitude)
      )
      .map((notice) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [notice.longitude as number, notice.latitude as number],
        },
        properties: {
          noticeId: notice.id,
        },
      }));
  }, [notices]);

  const clusterIndex = useMemo(() => {
    if (!pointFeatures.length) return null;
    return new Supercluster<NoticePointProperties>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
      map: (props) => props,
      reduce: () => undefined,
    }).load(pointFeatures);
  }, [pointFeatures]);

  const clusters = useMemo<ClusterItem[]>(() => {
    if (!clusterIndex) return [];
    const bounds = mapRef.current?.getBounds();
    const zoomLevel = Math.round(viewState.zoom ?? DEFAULT_VIEW_STATE.zoom);
    const bbox = bounds
      ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
      : [-180, -85, 180, 85];
    return clusterIndex.getClusters(bbox, zoomLevel) as ClusterItem[];
  }, [clusterIndex, viewState.zoom]);

  useEffect(() => {
    if (!mapRef.current || !autoFitToNotices) return;

    const boundsKey = initialBounds ? `bounds:${initialBounds.join(',')}` : null;
    const pointsKey = !initialBounds && pointFeatures.length
      ? `points:${pointFeatures.map((feature) => feature.geometry.coordinates.join(':')).join('|')}`
      : null;
    const fitKey = boundsKey ?? pointsKey ?? 'empty';

    if (fitKeyRef.current === fitKey) return;
    fitKeyRef.current = fitKey;

    if (initialBounds) {
      mapRef.current.fitBounds(
        [
          [initialBounds[1], initialBounds[0]],
          [initialBounds[3], initialBounds[2]],
        ],
        { padding: 80, duration: 0 }
      );
      return;
    }

    if (!pointFeatures.length) return;

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const feature of pointFeatures) {
      const [lng, lat] = feature.geometry.coordinates;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    if (!Number.isFinite(minLng) || !Number.isFinite(maxLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLat)) {
      return;
    }

    if (minLng === maxLng && minLat === maxLat) {
      mapRef.current.easeTo({
        center: [minLng, minLat],
        zoom: 13,
        duration: 0,
      });
    } else {
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 0 }
      );
    }
  }, [autoFitToNotices, initialBounds, pointFeatures]);

  const handleMove = useCallback(({ viewState: next }: { viewState: ViewState }) => {
    setViewState(next);
  }, []);

  const handleMoveEnd = useCallback(({ viewState: endViewState }: { viewState: ViewState }) => {
    if (!onBoundsChange || !mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    onBoundsChange(toBoundingBox(bounds), endViewState.zoom);
  }, [onBoundsChange]);

  const setActiveNotice = useCallback((noticeId: string | null) => {
    if (onActiveNoticeChange) {
      onActiveNoticeChange(noticeId);
    } else {
      setInternalActiveId(noticeId ?? null);
    }
  }, [onActiveNoticeChange]);

  const handleMapClick = useCallback(() => {
    setActiveNotice(null);
  }, [setActiveNotice]);

  const handleHoverChange = useCallback((noticeId: string | null) => {
    if (onHoverNoticeChange) {
      onHoverNoticeChange(noticeId);
    }
  }, [onHoverNoticeChange]);

  const handleClusterClick = useCallback((feature: ClusterFeature) => {
    if (!mapRef.current || !clusterIndex) return;
    const clusterId = feature.properties.cluster_id;
    if (typeof clusterId !== 'number') return;
    const expansionZoom = Math.min(clusterIndex.getClusterExpansionZoom(clusterId), 18);
    mapRef.current.easeTo({
      center: feature.geometry.coordinates as [number, number],
      zoom: expansionZoom,
      duration: 400,
    });
  }, [clusterIndex]);

  const activeNotice = mergedActiveId ? noticeLookup.get(mergedActiveId) : null;

  const mapStyle = mapStyleUrl || DEFAULT_MAP_STYLE;

  useEffect(() => {
    if (!mapRef.current) return;
    if (!mergedActiveId) {
      previousActiveRef.current = null;
      return;
    }
    if (previousActiveRef.current === mergedActiveId) return;
    previousActiveRef.current = mergedActiveId;
    const notice = noticeLookup.get(mergedActiveId);
    if (!notice) return;
    if (typeof notice.longitude !== 'number' || typeof notice.latitude !== 'number') return;
    mapRef.current.easeTo({
      center: [notice.longitude, notice.latitude],
      zoom: Math.max(viewState.zoom ?? DEFAULT_VIEW_STATE.zoom, 13),
      duration: 500,
    });
  }, [mergedActiveId, noticeLookup, viewState.zoom]);

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapGL
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        attributionControl
        reuseMaps
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={() => handleMapClick()}
        {...viewState}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const isCluster = Boolean(cluster.properties.cluster);

          if (isCluster) {
            const count = cluster.properties.point_count || 0;
            const display = cluster.properties.point_count_abbreviated || String(count);
            return (
              <Marker key={`cluster-${cluster.properties.cluster_id}`} longitude={longitude} latitude={latitude} anchor="center">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleClusterClick(cluster as ClusterFeature);
                  }}
                >
                  {display}
                </button>
              </Marker>
            );
          }

          const noticeId = cluster.properties.noticeId;
          const notice = noticeId ? noticeLookup.get(noticeId) : null;
          if (!notice) return null;
          const isActive = notice.id === mergedActiveId;
          const isHovered = notice.id === hoveredNoticeId;

          return (
            <Marker key={notice.id} longitude={longitude} latitude={latitude} anchor="center">
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition transform focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                  isActive
                    ? 'border-blue-700 bg-blue-600 text-white shadow-lg scale-110'
                    : 'border-white bg-white text-blue-700 shadow-md hover:shadow-lg'
                } ${isHovered && !isActive ? 'ring-2 ring-blue-300 motion-safe:animate-bounce' : ''}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveNotice(notice.id);
                }}
                onMouseEnter={() => handleHoverChange(notice.id)}
                onMouseLeave={() => handleHoverChange(null)}
              >
                •
              </button>
            </Marker>
          );
        })}

        {activeNotice && typeof activeNotice.longitude === 'number' && typeof activeNotice.latitude === 'number' && (
          <Popup
            longitude={activeNotice.longitude}
            latitude={activeNotice.latitude}
            closeOnClick={false}
            closeButton
            anchor="top"
            onClose={() => setActiveNotice(null)}
            offset={12}
            maxWidth="280px"
          >
            <div className="space-y-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{activeNotice.noticeType}</p>
              <h3 className="text-base font-semibold text-slate-900">{activeNotice.premisesName || 'Notice'}</h3>
              <p className="text-xs text-slate-600">{formatAddress(activeNotice.premisesAddress)}</p>
              <a
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                href={activeNotice.viewUrl ?? `/notices/${activeNotice.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View notice
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </Popup>
        )}
      </MapGL>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!loading && !pointFeatures.length && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
          <div className="rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow-md">
            No notices with map locations in this view yet.
          </div>
        </div>
      )}
    </div>
  );
}

export default NoticesMapView;
