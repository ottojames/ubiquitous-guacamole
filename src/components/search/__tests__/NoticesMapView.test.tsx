import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NoticeSearchItem } from '@/lib/notices';
import NoticesMapView from '../NoticesMapView';

vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('maplibre-gl', () => ({
  Map: class {},
  Marker: class {},
  NavigationControl: class {},
}));
vi.mock('supercluster', () => {
  return class MockCluster {
    load(points: any[]) {
      this.points = points;
      return this;
    }

    getClusters() {
      return this.points.map((feature: any) => ({
        ...feature,
        properties: {
          ...feature.properties,
          cluster: false,
        },
      }));
    }

    getClusterExpansionZoom() {
      return 12;
    }
  };
});

const mockHandlers: { onMoveEnd?: (event: { viewState: { zoom: number } }) => void } = {};
const mockMapRef = {
  getBounds: vi.fn(() => ({
    getWest: () => -0.5,
    getSouth: () => 51.3,
    getEast: () => 0.4,
    getNorth: () => 51.7,
  })),
  easeTo: vi.fn(),
  fitBounds: vi.fn(),
};

vi.mock('react-map-gl', () => {
  const React = require('react');
  const MockMap = React.forwardRef<any, any>((props, ref) => {
    mockHandlers.onMoveEnd = props.onMoveEnd;
    if (typeof ref === 'function') ref(mockMapRef);
    else if (ref) (ref as any).current = mockMapRef;
    return (
      <div data-testid="mock-map" {...props}>
        {props.children}
      </div>
    );
  });
  const Marker = ({ children, longitude, latitude }: any) => (
    <div data-testid="mock-marker" data-longitude={longitude} data-latitude={latitude}>
      {children}
    </div>
  );
  const NavigationControl = () => <div data-testid="mock-nav" />;
  const Popup = ({ children }: any) => (
    <div data-testid="mock-popup">
      {children}
    </div>
  );
  return {
    __esModule: true,
    default: MockMap,
    Marker,
    NavigationControl,
    Popup,
  };
});

afterEach(() => {
  mockHandlers.onMoveEnd = undefined;
  mockMapRef.getBounds.mockClear();
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

  it('renders a marker for each notice with coordinates', () => {
    render(<NoticesMapView notices={notices} />);
    const markers = screen.getAllByTestId('mock-marker');
    expect(markers).toHaveLength(2);
  });

  it('calls onBoundsChange when map movement ends', () => {
    const onBoundsChange = vi.fn();
    render(<NoticesMapView notices={notices} onBoundsChange={onBoundsChange} />);
    mockHandlers.onMoveEnd?.({ viewState: { zoom: 11 } });
    expect(onBoundsChange).toHaveBeenCalledWith([51.3, -0.5, 51.7, 0.4], 11);
  });

  it('shows a popup when an active notice is set', () => {
    render(<NoticesMapView notices={notices} activeNoticeId="notice-1" />);
    expect(screen.getByTestId('mock-popup')).toBeInTheDocument();
  });
});
