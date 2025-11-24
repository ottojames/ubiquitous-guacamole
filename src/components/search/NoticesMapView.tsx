import 'maplibre-gl/dist/maplibre-gl.css';
import "../../styles/map.css";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import MapGL, {Layer, Marker, Popup, Source,
  type LayerProps,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewState,
} from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection, Point } from 'geojson';

import type { NoticeBoundingBox, NoticeSearchItem } from '@/lib/notices';

type NoticeFeatureProperties = {
  noticeId: string;
  noticeType?: string | null;
  premisesName?: string | null;
  councilName?: string | null;
  publicationDate?: string | null;
  viewUrl?: string | null;
  status?: string | null;
  addressText?: string;
};

type NoticeFeature = Feature<Point, NoticeFeatureProperties>;
type NoticeFeatureCollection = FeatureCollection<Point, NoticeFeatureProperties>;

type HoveredClusterState = {
  id: number;
  longitude: number;
  latitude: number;
  count: number;
  councilName: string;
};

type GeoJSONSourceWithClusters = maplibregl.GeoJSONSource & {
  getClusterExpansionZoom: (clusterId: number) => number;
  getClusterLeaves: (
    clusterId: number,
    limit: number,
    offset: number
  ) => maplibregl.MapboxGeoJSONFeature[];
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
  searchedLocation?: { latitude: number; longitude: number; postcode?: string } | null;
};

const DEFAULT_VIEW_STATE: ViewState = {
  latitude: 51.5072,
  longitude: -0.1276,
  zoom: 5,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

const FALLBACK_MAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const MAPTILER_STREETS_STYLE = import.meta.env.VITE_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`
  : null;
const DEFAULT_MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL || MAPTILER_STREETS_STYLE || FALLBACK_MAP_STYLE;

const SOURCE_ID = 'notices';
const CLUSTER_LAYER_ID = 'notice-clusters';
const CLUSTER_COUNT_LAYER_ID = 'notice-cluster-count';
const NOTICE_HALO_LAYER_ID = 'notice-halo';
const NOTICE_POINTS_LAYER_ID = 'notice-points';

const clusterLayer: LayerProps = {
  id: CLUSTER_LAYER_ID,
  type: 'circle',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#38bdf8',
      10,
      '#0ea5e9',
      30,
      '#2563eb',
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      18,
      10,
      24,
      30,
      30,
    ],
    'circle-opacity': 0.9,
    'circle-stroke-color': 'rgba(255,255,255,0.85)',
    'circle-stroke-width': 2,
    'circle-stroke-opacity': 1,
  },
};

const clusterCountLayer: LayerProps = {
  id: CLUSTER_COUNT_LAYER_ID,
  type: 'symbol',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-size': 12,
    'text-font': ['Inter Semi Bold', 'Arial Unicode MS Bold'],
  },
  paint: {
    'text-color': '#ffffff',
  },
};

const noticeHaloLayer: LayerProps = {
  id: NOTICE_HALO_LAYER_ID,
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      'rgba(37,99,235,0.35)',
      ['boolean', ['feature-state', 'hover'], false],
      'rgba(56,189,248,0.28)',
      'rgba(14,165,233,0.18)',
    ],
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      22,
      ['boolean', ['feature-state', 'hover'], false],
      18,
      ['boolean', ['feature-state', 'ping'], false],
      18,
      0,
    ],
    'circle-opacity': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      0.55,
      ['boolean', ['feature-state', 'hover'], false],
      0.4,
      ['boolean', ['feature-state', 'ping'], false],
      0.35,
      0,
    ],
    'circle-blur': 0.65,
  },
};

const noticePointsLayer: LayerProps = {
  id: NOTICE_POINTS_LAYER_ID,
  type: 'circle',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      '#1d4ed8',
      ['boolean', ['feature-state', 'hover'], false],
      '#0ea5e9',
      '#0284c7',
    ],
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      10,
      ['boolean', ['feature-state', 'hover'], false],
      8,
      ['boolean', ['feature-state', 'ping'], false],
      9,
      7,
    ],
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'active'], false],
      3,
      ['boolean', ['feature-state', 'hover'], false],
      2,
      1.5,
    ],
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.95,
  },
};

function formatAddress(address: NoticeSearchItem['premisesAddress']): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const parts = [address.line1, address.line2, address.town, address.postcode]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);
  return parts.join(', ');
}

function formatShortDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function toBoundingBox(bounds: maplibregl.LngLatBounds): NoticeBoundingBox {
  return [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
}

function buildFeatureCollection(notices: NoticeSearchItem[]): NoticeFeatureCollection {
  const features: NoticeFeature[] = notices
    .filter(
      (notice) =>
        typeof notice.longitude === 'number' &&
        Number.isFinite(notice.longitude) &&
        typeof notice.latitude === 'number' &&
        Number.isFinite(notice.latitude)
    )
    .map((notice) => ({
      type: 'Feature',
      id: notice.id,
      geometry: {
        type: 'Point',
        coordinates: [notice.longitude as number, notice.latitude as number],
      },
      properties: {
        noticeId: notice.id,
        noticeType: notice.noticeType,
        premisesName: notice.premisesName,
        councilName: notice.councilName,
        publicationDate: notice.publicationDate,
        viewUrl: notice.viewUrl,
        status: notice.status,
        addressText: formatAddress(notice.premisesAddress),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

function formatBoundsKey(bbox: NoticeBoundingBox): string {
  return bbox.map((value) => value.toFixed(5)).join(',');
}

function NoticesMapViewComponent({
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
  searchedLocation,
}: NoticesMapViewProps) {
  const mapRef = useRef<MapRef | null>(null);
  const controlsAddedRef = useRef(false);
  const fitKeyRef = useRef<string | null>(null);
  const previousActiveRef = useRef<string | null>(null);
  const previousHoverRef = useRef<string | null>(null);
  const previousPingRef = useRef<string | null>(null);
  const lastHoverNoticeRef = useRef<string | null>(null);
  const lastViewportBoundsKeyRef = useRef<string | null>(null);
  const userAdjustedViewportRef = useRef(false);
  const suppressNextMoveEndRef = useRef(false);
  const moveEndTimeoutRef = useRef<number | null>(null);
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const mergedActiveId = activeNoticeId ?? internalActiveId;
  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [hoveredCluster, setHoveredCluster] = useState<HoveredClusterState | null>(null);
  const [pingedNoticeId, setPingedNoticeId] = useState<string | null>(null);
  const isAnimatingRef = useRef(false);
  const animationTimeoutRef = useRef<number | null>(null);
  const lastAnimatedNoticeRef = useRef<string | null>(null);

  const noticeLookup = useMemo(() => {
    return new Map(notices.map((notice) => [notice.id, notice]));
  }, [notices]);

  const featureCollection = useMemo(() => buildFeatureCollection(notices), [notices]);

  const featureCoordinates = useMemo(() => {
    return featureCollection.features.map((feature) => feature.geometry.coordinates as [number, number]);
  }, [featureCollection]);

  const mapStyle = mapStyleUrl || DEFAULT_MAP_STYLE;
  const initialViewStateMemo = useMemo(() => {
    return { ...DEFAULT_VIEW_STATE, ...initialViewState };
  }, [initialViewState]);

  const setActiveNotice = useCallback(
    (noticeId: string | null) => {
      if (onActiveNoticeChange) {
        onActiveNoticeChange(noticeId);
      } else {
        setInternalActiveId(noticeId);
      }
    },
    [onActiveNoticeChange]
  );

  const handleLoad = useCallback(() => {
    setMapReady(true);
    setMapLoading(true);
    const map = mapRef.current?.getMap();
    if (!map || controlsAddedRef.current) return;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    controlsAddedRef.current = true;
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current.getMap();

    const handleIdle = () => {
      setMapLoading(false);
    };

    map.on('idle', handleIdle);
    return () => {
      map.off('idle', handleIdle);
    };
  }, [mapReady, mapStyle]);

  useEffect(() => {
    if (!mapReady) return;
    if (loading) {
      setMapLoading(true);
    }
  }, [loading, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    setMapLoading(true);
  }, [mapStyle, mapReady]);

  useEffect(() => {
    if (autoFitToNotices && !initialBounds) {
      userAdjustedViewportRef.current = false;
    }
  }, [autoFitToNotices, initialBounds]);

  useEffect(() => {
    return () => {
      if (moveEndTimeoutRef.current) {
        window.clearTimeout(moveEndTimeoutRef.current);
        moveEndTimeoutRef.current = null;
      }
    };
  }, []);

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    const bbox = toBoundingBox(bounds);
    const boundsKey = `bounds:${formatBoundsKey(bbox)}`;
    lastViewportBoundsKeyRef.current = boundsKey;
    const zoom = mapRef.current.getZoom();

    console.log('[NoticesMapView] 📍 handleMoveEnd fired:', {
      zoom: zoom?.toFixed(2),
      isAnimating: isAnimatingRef.current,
      userAdjusted: userAdjustedViewportRef.current,
    });

    // CRITICAL: Block during programmatic animations - check FIRST
    if (isAnimatingRef.current) {
      console.log('[NoticesMapView] ⛔ BLOCKED by animation flag');
      return;
    }

    if (suppressNextMoveEndRef.current) {
      suppressNextMoveEndRef.current = false;
      return;
    }

    userAdjustedViewportRef.current = true;
    if (!onBoundsChange) return;

    if (moveEndTimeoutRef.current) {
      window.clearTimeout(moveEndTimeoutRef.current);
    }

    moveEndTimeoutRef.current = window.setTimeout(() => {
      moveEndTimeoutRef.current = null;
      // Triple-check: NEVER call bounds change during animation
      if (isAnimatingRef.current) {
        console.log('[NoticesMapView] ⛔ BLOCKED in timeout');
        return;
      }
      console.log('[NoticesMapView] ✅ Calling onBoundsChange');
      onBoundsChange(bbox, zoom);
    }, 500); // Increased delay to 500ms
  }, [onBoundsChange]);

  const getClusterSource = useCallback((): GeoJSONSourceWithClusters | null => {
    if (!mapRef.current) return null;
    const map = mapRef.current.getMap();
    const source = map.getSource(SOURCE_ID);
    if (!source || typeof (source as GeoJSONSourceWithClusters).getClusterLeaves !== 'function') {
      return null;
    }
    return source as GeoJSONSourceWithClusters;
  }, []);

  const resolveClusterMeta = useCallback(
    async (clusterId: number, longitude: number, latitude: number): Promise<HoveredClusterState | null> => {
      const source = getClusterSource();
      if (!source) return null;

      let leaves: maplibregl.MapboxGeoJSONFeature[] = [];
      try {
        // IMPORTANT: getClusterLeaves returns a Promise!
        leaves = await source.getClusterLeaves(clusterId, 25, 0);
      } catch (error) {
        console.warn('[NoticesMapView] failed to inspect cluster leaves', error);
      }

      const councilCounts = new Map<string, number>();
      for (const leaf of leaves) {
        const noticeId = leaf.properties?.noticeId;
        if (typeof noticeId !== 'string') continue;
        const notice = noticeLookup.get(noticeId);
        if (!notice?.councilName) continue;
        councilCounts.set(notice.councilName, (councilCounts.get(notice.councilName) ?? 0) + 1);
      }

      let councilName = 'Notices';
      if (councilCounts.size === 1) {
        councilName = councilCounts.keys().next().value ?? 'Notices';
      } else if (councilCounts.size > 1) {
        const [topCouncil] = [...councilCounts.entries()].sort((a, b) => b[1] - a[1]);
        councilName = topCouncil ? `${topCouncil[0]} + more` : 'Multiple councils';
      } else if (leaves.length) {
        const sampleId = leaves[0].properties?.noticeId;
        const sample = sampleId ? noticeLookup.get(sampleId) : null;
        if (sample?.councilName) councilName = sample.councilName;
      }

      return {
        id: clusterId,
        longitude,
        latitude,
        count: leaves.length,
        councilName,
      };
    },
    [getClusterSource, noticeLookup]
  );

  const handleClick = useCallback(
    async (event: MapLayerMouseEvent) => {
      console.log('[NoticesMapView] Click event triggered', {
        featuresCount: event.features?.length,
        lngLat: event.lngLat
      });

      const features = event.features ?? [];
      if (!mapRef.current) {
        console.warn('[NoticesMapView] No map ref');
        return;
      }

      // Check for notice pin clicks first (higher priority)
      const clickedNoticeFeature = features.find((feature) => feature.layer.id === NOTICE_POINTS_LAYER_ID);
      if (clickedNoticeFeature) {
        const noticeId = clickedNoticeFeature.properties?.noticeId;
        if (typeof noticeId === 'string') {
          console.log('[NoticesMapView] 🎯🎯🎯 PIN CLICKED ON MAP:', noticeId);

          // Just set the active notice - the useEffect will handle the zoom
          setActiveNotice(noticeId);
          return;
        }
      }

      const clusterFeature = features.find((feature) => feature.layer.id === CLUSTER_LAYER_ID);
      console.log('[NoticesMapView] Cluster feature found:', !!clusterFeature);

      if (clusterFeature) {
        console.log('[NoticesMapView] Cluster feature details:', {
          layerId: clusterFeature.layer.id,
          properties: clusterFeature.properties,
          geometry: clusterFeature.geometry
        });

        const source = getClusterSource();
        if (!source) {
          console.error('[NoticesMapView] ❌ Cluster source not found');
          return;
        }
        console.log('[NoticesMapView] ✓ Cluster source found');

        const clusterId = clusterFeature.properties?.cluster_id;
        if (typeof clusterId !== 'number') {
          console.error('[NoticesMapView] ❌ Invalid cluster ID', clusterFeature.properties);
          return;
        }
        console.log('[NoticesMapView] ✓ Valid cluster ID:', clusterId);

        // Validate coordinates before using them
        const rawCoords = clusterFeature.geometry?.coordinates;
        if (!Array.isArray(rawCoords) || rawCoords.length < 2) {
          console.error('[NoticesMapView] ❌ Invalid cluster coordinates:', rawCoords);
          return;
        }

        const [lng, lat] = rawCoords;
        if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat)) {
          console.error('[NoticesMapView] ❌ Cluster has NaN coordinates:', { lng, lat });
          return;
        }

        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          console.error('[NoticesMapView] ❌ Cluster coordinates out of bounds:', { lng, lat });
          return;
        }
        console.log('[NoticesMapView] ✓ Valid coordinates:', { lng, lat });

        try {
          // IMPORTANT: getClusterExpansionZoom returns a Promise!
          const expansionZoom = await source.getClusterExpansionZoom(clusterId);
          const currentZoom = mapRef.current.getZoom();
          const targetZoom = Math.min(Math.max(expansionZoom, currentZoom + 2), 18);

          console.log('[NoticesMapView] 🎯 Cluster clicked - zooming in:', {
            clusterId,
            coordinates: [lng, lat],
            currentZoom,
            expansionZoom,
            targetZoom,
          });

          // CRITICAL: Clear any pending bounds change callbacks
          if (moveEndTimeoutRef.current) {
            window.clearTimeout(moveEndTimeoutRef.current);
            moveEndTimeoutRef.current = null;
            console.log('[NoticesMapView] Cleared pending bounds change callback');
          }

          // CRITICAL: Clear any existing animation timeout to prevent premature clearing
          if (animationTimeoutRef.current) {
            window.clearTimeout(animationTimeoutRef.current);
            animationTimeoutRef.current = null;
            console.log('[NoticesMapView] Cleared previous animation timeout');
          }

          // Set animation flag to prevent bounds change during zoom
          isAnimatingRef.current = true;
          console.log('[NoticesMapView] 🔒 Animation flag SET (cluster)');

          // Use flyTo with validated coordinates
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: targetZoom,
            duration: 1000,
            essential: true,
          });

          // Clear animation flag after EXTENDED duration (10 seconds total)
          animationTimeoutRef.current = window.setTimeout(() => {
            isAnimatingRef.current = false;
            animationTimeoutRef.current = null;
            lastAnimatedNoticeRef.current = null; // Clear for consistency
            console.log('[NoticesMapView] 🔓 Animation flag CLEARED (cluster)');
          }, 10000);

          console.log('[NoticesMapView] ✅ flyTo called successfully');
        } catch (error) {
          console.error('[NoticesMapView] ❌ Error during zoom:', error);
          isAnimatingRef.current = false;
        }
        return;
      }
    },
    [getClusterSource, setActiveNotice]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      // BLOCK all hover interactions during animations
      if (isAnimatingRef.current) {
        console.log('[NoticesMapView] ⛔ Hover blocked during animation');
        return;
      }

      const features = event.features ?? [];
      if (!mapRef.current) return;
      const canvas = mapRef.current.getCanvas?.();
      const clusterFeature = features.find((feature) => feature.layer.id === CLUSTER_LAYER_ID);
      const hoveredNoticeFeature = features.find((feature) => feature.layer.id === NOTICE_POINTS_LAYER_ID);

      if (clusterFeature) {
        const clusterId = clusterFeature.properties?.cluster_id;
        if (typeof clusterId === 'number') {
          const rawCoords = clusterFeature.geometry?.coordinates;
          if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
            const [longitude, latitude] = rawCoords as [number, number];
            // Validate coordinates before using them
            if (
              typeof longitude === 'number' &&
              typeof latitude === 'number' &&
              Number.isFinite(longitude) &&
              Number.isFinite(latitude) &&
              longitude >= -180 &&
              longitude <= 180 &&
              latitude >= -90 &&
              latitude <= 90
            ) {
              // Don't await - just let it resolve in the background
              resolveClusterMeta(clusterId, longitude, latitude).then(meta => {
                if (meta) setHoveredCluster(meta);
              }).catch(err => {
                console.warn('[NoticesMapView] Error resolving cluster meta on hover:', err);
              });
            } else {
              console.warn('[NoticesMapView] Invalid cluster coordinates on hover:', { longitude, latitude });
            }
          }
        }
        if (canvas) canvas.style.cursor = 'pointer';
        return;
      }

      if (hoveredNoticeFeature) {
        const noticeId = hoveredNoticeFeature.properties?.noticeId;
        if (typeof noticeId === 'string') {
          if (lastHoverNoticeRef.current !== noticeId) {
            onHoverNoticeChange?.(noticeId);
            lastHoverNoticeRef.current = noticeId;
          }
        }
        setHoveredCluster(null);
        if (canvas) canvas.style.cursor = 'pointer';
        return;
      }

      if (lastHoverNoticeRef.current) {
        onHoverNoticeChange?.(null);
        lastHoverNoticeRef.current = null;
      }
      setHoveredCluster(null);
      if (canvas) canvas.style.cursor = '';
    },
    [onHoverNoticeChange, resolveClusterMeta]
  );

  const handleMouseLeave = useCallback(() => {
    if (lastHoverNoticeRef.current) {
      onHoverNoticeChange?.(null);
      lastHoverNoticeRef.current = null;
    }
    setHoveredCluster(null);
    if (mapRef.current?.getCanvas()) {
      mapRef.current.getCanvas().style.cursor = '';
    }
  }, [onHoverNoticeChange]);

  useEffect(() => {
    // BLOCK hover state changes during animations
    if (isAnimatingRef.current) {
      console.log('[NoticesMapView] ⛔ Hover state change blocked during animation');
      return;
    }

    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (previousHoverRef.current && previousHoverRef.current !== hoveredNoticeId) {
      try {
        map.removeFeatureState({ source: SOURCE_ID, id: previousHoverRef.current }, 'hover');
      } catch (error) {
        console.warn('[NoticesMapView] failed clearing hover state', error);
      }
    }

    if (hoveredNoticeId) {
      try {
        map.setFeatureState({ source: SOURCE_ID, id: hoveredNoticeId }, { hover: true });
      } catch (error) {
        console.warn('[NoticesMapView] failed setting hover state', error);
      }
    }

    previousHoverRef.current = hoveredNoticeId ?? null;
  }, [hoveredNoticeId, mapReady, featureCollection]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (previousActiveRef.current && previousActiveRef.current !== mergedActiveId) {
      try {
        map.removeFeatureState({ source: SOURCE_ID, id: previousActiveRef.current }, 'active');
      } catch (error) {
        console.warn('[NoticesMapView] failed clearing active state', error);
      }
    }

    if (mergedActiveId) {
      try {
        map.setFeatureState({ source: SOURCE_ID, id: mergedActiveId }, { active: true });
      } catch (error) {
        console.warn('[NoticesMapView] failed setting active state', error);
      }
    }

    previousActiveRef.current = mergedActiveId ?? null;
  }, [mergedActiveId, mapReady, featureCollection]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (previousPingRef.current && previousPingRef.current !== pingedNoticeId) {
      try {
        map.removeFeatureState({ source: SOURCE_ID, id: previousPingRef.current }, 'ping');
      } catch (error) {
        console.warn('[NoticesMapView] failed clearing ping state', error);
      }
    }

    if (pingedNoticeId) {
      try {
        map.setFeatureState({ source: SOURCE_ID, id: pingedNoticeId }, { ping: true });
      } catch (error) {
        console.warn('[NoticesMapView] failed setting ping state', error);
      }
    }

    previousPingRef.current = pingedNoticeId ?? null;
  }, [mapReady, pingedNoticeId, featureCollection]);

  useEffect(() => {
    if (!mergedActiveId) {
      setPingedNoticeId(null);
      return;
    }

    setPingedNoticeId(mergedActiveId);
    const timeout = window.setTimeout(() => {
      setPingedNoticeId((current) => (current === mergedActiveId ? null : current));
    }, 1300);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [mergedActiveId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !mergedActiveId) return;

    // CRITICAL: Skip if we're already animating to this same notice (prevents re-render loops!)
    if (lastAnimatedNoticeRef.current === mergedActiveId && isAnimatingRef.current) {
      console.log('[NoticesMapView] ⏭️ Skipping - already animating to this notice:', mergedActiveId);
      return;
    }

    const notice = noticeLookup.get(mergedActiveId);
    if (!notice) return;
    if (typeof notice.longitude !== 'number' || typeof notice.latitude !== 'number') return;

    const currentZoom = mapRef.current.getZoom();

    // NEVER zoom out - ALWAYS either zoom in or stay at current zoom
    // Target: zoom 18 (street level detail)
    // But if already more zoomed in than 18, STAY THERE
    const targetZoom = Math.max(currentZoom, 18);

    console.log('[NoticesMapView] 🎯🎯🎯 CENTERING ON PIN:', {
      noticeId: mergedActiveId,
      premisesName: notice.premisesName,
      currentZoom: currentZoom?.toFixed(2),
      targetZoom: targetZoom.toFixed(2),
      zoomDifference: (targetZoom - currentZoom).toFixed(2),
      action: targetZoom > currentZoom ? '🔼 ZOOM IN' : '📍 CENTER ONLY',
      coords: [notice.longitude, notice.latitude],
      lastAnimated: lastAnimatedNoticeRef.current,
    });

    // Mark this notice as the one we're animating to
    lastAnimatedNoticeRef.current = mergedActiveId;

    // CRITICAL: Mark this as a user adjustment to prevent auto-fit from interfering
    userAdjustedViewportRef.current = true;
    console.log('[NoticesMapView] 📌 Marked as user-adjusted viewport');

    // CRITICAL: Set animation protection HERE so it works for BOTH map clicks AND sidebar clicks
    // Clear any pending bounds change callbacks
    if (moveEndTimeoutRef.current) {
      window.clearTimeout(moveEndTimeoutRef.current);
      moveEndTimeoutRef.current = null;
      console.log('[NoticesMapView] Cleared pending bounds change callback (from useEffect)');
    }

    // Clear any existing animation timeout to prevent premature clearing
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
      console.log('[NoticesMapView] Cleared previous animation timeout (from useEffect)');
    }

    // Set animation flag to block ALL competing updates during zoom
    isAnimatingRef.current = true;
    console.log('[NoticesMapView] 🔒 Animation flag SET (from useEffect)');

    // Do the flyTo animation
    console.log('[NoticesMapView] 🚀 Animating to pin with flyTo:', {
      center: [notice.longitude, notice.latitude],
      zoom: targetZoom,
      duration: 800,
    });

    mapRef.current.flyTo({
      center: [notice.longitude, notice.latitude],
      zoom: targetZoom,
      duration: 800,
      essential: true,
    });

    // Add a listener to track when the animation completes
    const checkFinalZoom = () => {
      setTimeout(() => {
        if (mapRef.current) {
          const finalZoom = mapRef.current.getZoom();
          console.log('[NoticesMapView] ✅ Animation completed. Final zoom:', finalZoom?.toFixed(2), 'Expected:', targetZoom.toFixed(2));
          if (Math.abs(finalZoom - targetZoom) > 0.1) {
            console.error('[NoticesMapView] ❌❌❌ ZOOM MISMATCH! Something changed the zoom after flyTo!');
          }
        }
      }, 1000); // Check 1 second after flyTo starts
    };
    checkFinalZoom();

    // Keep the flag set for EXTENDED duration (10 seconds total) to prevent ANY bouncing
    animationTimeoutRef.current = window.setTimeout(() => {
      isAnimatingRef.current = false;
      animationTimeoutRef.current = null;
      lastAnimatedNoticeRef.current = null; // Clear so we can re-animate to the same notice later
      console.log('[NoticesMapView] 🔓 Animation flag CLEARED (from useEffect)');
    }, 10000);
  }, [mapReady, mergedActiveId, noticeLookup]);

  useEffect(() => {
    // CRITICAL: BLOCK auto-fit during animations to prevent snap-back!
    if (isAnimatingRef.current) {
      console.log('[NoticesMapView] ⛔⛔⛔ AUTO-FIT BLOCKED DURING ANIMATION');
      return;
    }

    if (!mapReady || !mapRef.current) return;
    if (!initialBounds && (!autoFitToNotices || !featureCoordinates.length)) return;

    const map = mapRef.current.getMap();

    const boundsKey = initialBounds ? `bounds:${formatBoundsKey(initialBounds)}` : null;
    const pointsKey =
      !initialBounds && featureCoordinates.length
        ? `points:${featureCoordinates.map(([lng, lat]) => `${lng.toFixed(4)}:${lat.toFixed(4)}`).join('|')}`
        : null;
    const fitKey = boundsKey ?? pointsKey ?? 'empty';

    if (boundsKey && lastViewportBoundsKeyRef.current === boundsKey) {
      fitKeyRef.current = fitKey;
      return;
    }

    if (fitKeyRef.current === fitKey) return;
    fitKeyRef.current = fitKey;

    if (!initialBounds && userAdjustedViewportRef.current) {
      return;
    }

    if (initialBounds) {
      userAdjustedViewportRef.current = false;
      suppressNextMoveEndRef.current = true;
      map.fitBounds(
        [
          [initialBounds[1], initialBounds[0]],
          [initialBounds[3], initialBounds[2]],
        ],
        { padding: 80, duration: 0 }
      );
      return;
    }

    if (!featureCoordinates.length) return;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of featureCoordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    if (!Number.isFinite(minLng) || !Number.isFinite(maxLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLat)) {
      return;
    }

    if (minLng === maxLng && minLat === maxLat) {
      userAdjustedViewportRef.current = false;
      suppressNextMoveEndRef.current = true;
      map.easeTo({
        center: [minLng, minLat],
        zoom: 13,
        duration: 0,
      });
    } else {
      userAdjustedViewportRef.current = false;
      suppressNextMoveEndRef.current = true;
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 0 }
      );
    }
  }, [autoFitToNotices, featureCoordinates, initialBounds, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !initialViewState) return;

    if (typeof initialViewState.zoom === 'number') {
      const currentZoom = mapRef.current.getZoom();
      if (!Number.isFinite(currentZoom) || Math.abs(currentZoom - initialViewState.zoom) > 0.05) {
        suppressNextMoveEndRef.current = true;
        mapRef.current.setZoom(initialViewState.zoom);
      }
    }
    if (
      typeof initialViewState.longitude === 'number' &&
      typeof initialViewState.latitude === 'number'
    ) {
      const center = mapRef.current.getCenter();
      if (
        Math.abs(center.lng - initialViewState.longitude) > 0.0001 ||
        Math.abs(center.lat - initialViewState.latitude) > 0.0001
      ) {
        suppressNextMoveEndRef.current = true;
        mapRef.current.setCenter([initialViewState.longitude, initialViewState.latitude]);
      }
    }
  }, [initialViewState, mapReady]);

  // Zoom to searched location when provided
  useEffect(() => {
    // CRITICAL: BLOCK during animations to prevent interference with pin clicks
    if (isAnimatingRef.current) {
      console.log('[NoticesMapView] ⛔ Searched location zoom blocked during animation');
      return;
    }

    if (!mapReady || !mapRef.current || !searchedLocation) return;

    const { latitude, longitude } = searchedLocation;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    // Only zoom if we don't have a bbox (user-adjusted view) or if it's the initial load
    if (!initialBounds && !userAdjustedViewportRef.current) {
      suppressNextMoveEndRef.current = true;
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 14, // Close zoom to see the searched location clearly
        duration: 1000,
        essential: true,
      });
    }
  }, [searchedLocation, mapReady, initialBounds]);

  useEffect(() => {
    // BLOCK cluster updates during animations for smooth transitions
    if (isAnimatingRef.current) {
      return;
    }

    if (!hoveredCluster || !mapReady || !mapRef.current) return;
    const map = mapRef.current.getMap();
    const renderedClusters = map.queryRenderedFeatures(undefined, { layers: [CLUSTER_LAYER_ID] });
    const exists = renderedClusters.some(
      (feature) => feature.properties?.cluster_id === hoveredCluster.id
    );
    if (!exists) {
      setHoveredCluster(null);
    }
  }, [featureCollection, hoveredCluster, mapReady]);

  const activeNotice = mergedActiveId ? noticeLookup.get(mergedActiveId) : null;
  const showShimmer = mapLoading;
  const mapHasData = featureCollection.features.length > 0;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${className}`}
    >
      <MapGL
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={mapStyle}
        initialViewState={initialViewStateMemo}
        reuseMaps
        attributionControl={false}
        interactiveLayerIds={[CLUSTER_LAYER_ID, NOTICE_POINTS_LAYER_ID]}
        onLoad={handleLoad}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%' }}
      >
        <Source
          id={SOURCE_ID}
          type="geojson"
          data={featureCollection}
          cluster
          clusterRadius={60}
          clusterMaxZoom={16}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...noticeHaloLayer} />
          <Layer {...noticePointsLayer} />
        </Source>

        {hoveredCluster && (
          <Popup
            longitude={hoveredCluster.longitude}
            latitude={hoveredCluster.latitude}
            closeButton={false}
            closeOnClick={false}
            anchor="top"
            offset={18}
            maxWidth="220px"
          >
            <div className="rounded-xl bg-white/95 px-3 py-2 text-sm shadow-lg ring-1 ring-black/5">
              <p className="font-semibold text-slate-900">
                {hoveredCluster.count} notice{hoveredCluster.count === 1 ? '' : 's'}
              </p>
              <p className="text-xs text-slate-500">{hoveredCluster.councilName}</p>
            </div>
          </Popup>
        )}

        {activeNotice && typeof activeNotice.longitude === 'number' && typeof activeNotice.latitude === 'number' && (
          <Popup
            longitude={activeNotice.longitude}
            latitude={activeNotice.latitude}
            closeOnClick={false}
            closeButton
            anchor="top"
            onClose={() => setActiveNotice(null)}
            offset={18}
            maxWidth="300px"
          >
            <div className="space-y-3 rounded-xl bg-white/95 p-4 text-sm shadow-lg ring-1 ring-black/5">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                  {activeNotice.noticeType}
                </p>
                <h3 className="text-base font-semibold text-slate-900 leading-tight">
                  {activeNotice.premisesName || 'Notice'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{formatAddress(activeNotice.premisesAddress)}</p>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-500">Published:</span>
                  <span className="font-medium text-slate-700">
                    {formatShortDate(activeNotice.publicationDate) || '—'}
                  </span>
                </div>
                {activeNotice.repsDeadline && (
                  <div className="flex items-start justify-between text-xs">
                    <span className="text-slate-500">Deadline:</span>
                    <span className="font-medium text-slate-700">
                      {formatShortDate(activeNotice.repsDeadline)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <a
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                  href={`/notices/${activeNotice.id}`}
                >
                  View Notice
                  <span aria-hidden="true">→</span>
                </a>
                {activeNotice.repsDeadline && (
                  <a
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    href={`/notices/${activeNotice.id}#representations`}
                  >
                    Make Representation
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* Searched location pin marker */}
        {searchedLocation && (
          <Marker
            longitude={searchedLocation.longitude}
            latitude={searchedLocation.latitude}
            anchor="bottom"
          >
            <div className="relative">
              {/* Pin marker */}
              <svg
                width="32"
                height="40"
                viewBox="0 0 32 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                <path
                  d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z"
                  fill="#EF4444"
                />
                <circle cx="16" cy="16" r="6" fill="white" />
              </svg>
              {/* Postcode label */}
              {searchedLocation.postcode && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow-md">
                  {searchedLocation.postcode}
                </div>
              )}
            </div>
          </Marker>
        )}
      </MapGL>

      {showShimmer && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="map-shimmer h-full w-full" />
        </div>
      )}

      {!loading && !mapHasData && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
          <div className="rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow-md">
            No notices with map locations in this view yet.
          </div>
        </div>
      )}
    </div>
  );
}

function arePropsEqual(prev: NoticesMapViewProps, next: NoticesMapViewProps) {
  return (
    prev.notices === next.notices &&
    prev.loading === next.loading &&
    prev.activeNoticeId === next.activeNoticeId &&
    prev.hoveredNoticeId === next.hoveredNoticeId &&
    prev.initialBounds === next.initialBounds &&
    prev.mapStyleUrl === next.mapStyleUrl &&
    prev.initialViewState?.zoom === next.initialViewState?.zoom &&
    prev.initialViewState?.latitude === next.initialViewState?.latitude &&
    prev.initialViewState?.longitude === next.initialViewState?.longitude &&
    prev.searchedLocation?.latitude === next.searchedLocation?.latitude &&
    prev.searchedLocation?.longitude === next.searchedLocation?.longitude &&
    prev.searchedLocation?.postcode === next.searchedLocation?.postcode
  );
}

export const NoticesMapView = memo(NoticesMapViewComponent, arePropsEqual);
export default NoticesMapView;
