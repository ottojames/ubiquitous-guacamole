import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NoticeSearchItem } from '@/lib/notices';
import NoticesMapView from '../NoticesMapView';

vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('maplibre-gl', () => {
  class NavigationControl {}
  class AttributionControl {
    constructor(_: any) {}
  }
  const defaultExport = {
    NavigationControl,
    AttributionControl,
  };
  return {
    __esModule: true,
    default: defaultExport,
    NavigationControl,
    AttributionControl,
  };
});

type HandlerBag = {
  onMoveEnd?: (event: { viewState: { zoom: number } }) => void;
};

const mockHandlers: HandlerBag = {};
const idleHandlers: Array<() => void> = [];

const mockMapApi = {
  getSource: vi.fn(() => ({
    getClusterLeaves: vi.fn(() => []),
    getClusterExpansionZoom: vi.fn(() => 12),
  })),
  on: vi.fn((event: string, handler: () => void) => {
    if (event === 'idle') idleHandlers.push(handler);
  }),
  off: vi.fn(),
  addControl: vi.fn(),
  fitBounds: vi.fn(),
  easeTo: vi.fn(),
  flyTo: vi.fn(),
  queryRenderedFeatures: vi.fn(() => []),
  getCenter: vi.fn(() => ({ lng: -0.1, lat: 51.5 })),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn(() => 10),
  getBounds: vi.fn(() => ({
    getSouth: () => 51.3,
    getWest: () => -0.5,
    getNorth: () => 51.7,
    getEast: () => 0.4,
  })),
  getCanvas: vi.fn(() => ({ style: {} } as HTMLCanvasElement)),
};

const mockMapRef = {
  getMap: () => mockMapApi,
  setFeatureState: vi.fn(),
  removeFeatureState: vi.fn(),
  flyTo: vi.fn(),
  easeTo: vi.fn(),
  fitBounds: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  getZoom: vi.fn(() => 10),
  getBounds: mockMapApi.getBounds,
  getCenter: mockMapApi.getCenter,
  getCanvas: mockMapApi.getCanvas,
};

vi.mock('react-map-gl/maplibre', () => {
  const React = require('react');
  const { useEffect } = React;
  const MockMap = React.forwardRef((props: any, ref: any) => {
    const { children, onLoad, onMoveEnd } = props;
    useEffect(() => {
      if (typeof ref === 'function') ref(mockMapRef);
      else if (ref) (ref as any).current = mockMapRef;
      onLoad?.({ target: mockMapApi });
      idleHandlers.forEach((handler) => handler());
    }, [ref, onLoad]);

    mockHandlers.onMoveEnd = onMoveEnd;
    return <div data-testid="mock-map">{children}</div>;
  });
  const Source = ({ children }: any) => <div data-testid="mock-source">{children}</div>;
  const Layer = () => null;
  const Popup = ({ children }: any) => <div data-testid="mock-popup">{children}</div>;
  return {
    __esModule: true,
    default: MockMap,
    Source,
    Layer,
    Popup,
  };
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  mockHandlers.onMoveEnd = undefined;
  mockMapApi.getBounds.mockClear();
  mockMapApi.getSource.mockClear();
});

beforeEach(() => {
  vi.useFakeTimers();
  idleHandlers.length = 0;
});

describe('NoticesMapView', () => {
  const notices: NoticeSearchItem[] = [
    {
      id: 'notice-1',
      noticeType: 'Licensing',
      status: 'published',
      premisesName: 'The Test Arms',
      premisesAddress: '9 Lower Park Road',
      latitude: 51.502,
      longitude: -0.12,
    },
    {
      id: 'notice-2',
      noticeType: 'Planning',
      status: 'published',
      premisesName: 'Mill House',
      premisesAddress: '14 Mill Street',
      latitude: 51.503,
      longitude: -0.08,
    },
  ];

  it('renders the map source with notice data', () => {
    render(<NoticesMapView notices={notices} />);
    expect(screen.getByTestId('mock-source')).toBeInTheDocument();
  });

  it('calls onBoundsChange when map movement ends', () => {
    const onBoundsChange = vi.fn();
    render(<NoticesMapView notices={notices} onBoundsChange={onBoundsChange} />);
    // first move end may be triggered by programmatic fit, should be ignored
    mockHandlers.onMoveEnd?.({ viewState: { zoom: 5 } });
    vi.runAllTimers();
    expect(onBoundsChange).not.toHaveBeenCalled();

    mockMapRef.getZoom.mockReturnValue(11);
    mockHandlers.onMoveEnd?.({ viewState: { zoom: 11 } });
    vi.runAllTimers();
    expect(onBoundsChange).toHaveBeenCalledWith([51.3, -0.5, 51.7, 0.4], 11);
  });

  it('shows a popup when an active notice is set', () => {
    render(<NoticesMapView notices={notices} activeNoticeId="notice-1" />);
    expect(screen.getByTestId('mock-popup')).toBeInTheDocument();
    expect(mockMapRef.setFeatureState).toHaveBeenCalled();
  });
});
