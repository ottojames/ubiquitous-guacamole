import 'maplibre-gl/dist/maplibre-gl.css';
import "../../styles/map.css";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import MapGL, {Layer, Popup, Source,
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
      onBoundsChange(bbox, zoom);
    }, 220);
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
    (clusterId: number, longitude: number, latitude: number): HoveredClusterState | null => {
      const source = getClusterSource();
      if (!source) return null;

      let leaves: maplibregl.MapboxGeoJSONFeature[] = [];
      try {
        leaves = source.getClusterLeaves(clusterId, 25, 0);
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
    (event: MapLayerMouseEvent) => {
      const features = event.features ?? [];
      if (!mapRef.current) return;

      const clusterFeature = features.find((feature) => feature.layer.id === CLUSTER_LAYER_ID);
      if (clusterFeature) {
        const source = getClusterSource();
        if (!source) return;
        const clusterId = clusterFeature.properties?.cluster_id;
        if (typeof clusterId !== 'number') return;
        try {
          const expansionZoom = Math.min(source.getClusterExpansionZoom(clusterId), 18);
          mapRef.current.flyTo({
            center: clusterFeature.geometry.coordinates as [number, number],
            zoom: expansionZoom,
            duration: 600,
          });
        } catch (error) {
          console.warn('[NoticesMapView] unable to expand cluster', error);
        }
        return;
      }

      const noticeFeature = features.find((feature) => feature.layer.id === NOTICE_POINTS_LAYER_ID);
      if (!noticeFeature) return;
      const noticeId = noticeFeature.properties?.noticeId;
      if (typeof noticeId !== 'string') return;
      setActiveNotice(noticeId);
    },
    [getClusterSource, setActiveNotice]
  );

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      const features = event.features ?? [];
      if (!mapRef.current) return;
      const canvas = mapRef.current.getCanvas?.();
      const clusterFeature = features.find((feature) => feature.layer.id === CLUSTER_LAYER_ID);
      const noticeFeature = features.find((feature) => feature.layer.id === NOTICE_POINTS_LAYER_ID);

      if (clusterFeature) {
        const clusterId = clusterFeature.properties?.cluster_id;
        if (typeof clusterId === 'number') {
          const [longitude, latitude] = clusterFeature.geometry.coordinates as [number, number];
          const meta = resolveClusterMeta(clusterId, longitude, latitude);
          setHoveredCluster(meta);
        }
        if (canvas) canvas.style.cursor = 'pointer';
        return;
      }

      if (noticeFeature) {
        const noticeId = noticeFeature.properties?.noticeId;
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
    const notice = noticeLookup.get(mergedActiveId);
    if (!notice) return;
    if (typeof notice.longitude !== 'number' || typeof notice.latitude !== 'number') return;

    const currentZoom = mapRef.current.getZoom();
    const targetZoom = Math.max(currentZoom ?? DEFAULT_VIEW_STATE.zoom, 13);
    suppressNextMoveEndRef.current = true;
    mapRef.current.flyTo({
      center: [notice.longitude, notice.latitude],
      zoom: targetZoom,
      duration: 600,
    });
  }, [mapReady, mergedActiveId, noticeLookup]);

  useEffect(() => {
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

  useEffect(() => {
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
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {activeNotice.noticeType}
                </p>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeNotice.premisesName || activeNotice.noticeType}
                </h3>
                <p className="text-xs text-slate-500">{formatAddress(activeNotice.premisesAddress)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {formatShortDate(activeNotice.publicationDate) ? (
                    <>
                      <span className="font-medium text-slate-600">Published </span>
                      {formatShortDate(activeNotice.publicationDate)}
                    </>
                  ) : (
                    <span className="font-medium text-slate-600">Publication date</span>
                  )}
                </div>
                <a
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
                  href={`/notices/${activeNotice.id}`}
                >
                  View notice
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </Popup>
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
    prev.initialViewState?.longitude === next.initialViewState?.longitude
  );
}

export const NoticesMapView = memo(NoticesMapViewComponent, arePropsEqual);
export default NoticesMapView;
