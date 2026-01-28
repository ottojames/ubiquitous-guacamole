import { useState, useCallback } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export interface GeolocationState {
  position: GeolocationPosition | null;
  loading: boolean;
  error: string | null;
}

export interface UseGeolocationReturn extends GeolocationState {
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
  clearError: () => void;
}

/**
 * Hook for accessing browser geolocation API
 * Returns user's current location when requested
 */
export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setState({ position: coords, loading: false, error: null });
          resolve(coords);
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'Unable to get your location.';
          }
          setState({ position: null, loading: false, error: errorMessage });
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearError,
  };
}

/**
 * Convert lat/lng to a UK postcode using postcodes.io reverse geocoding
 */
export async function reverseGeocodeToPostcode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1`
    );

    if (!response.ok) {
      console.warn('[geolocation] Reverse geocode failed:', response.status);
      return null;
    }

    const data = await response.json();
    const result = data?.result?.[0];

    if (result?.postcode) {
      return result.postcode;
    }

    return null;
  } catch (error) {
    console.warn('[geolocation] Reverse geocode error:', error);
    return null;
  }
}

export default useGeolocation;
