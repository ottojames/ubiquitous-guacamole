import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from './supabase';

const POSTCODE_REGEX = /([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})/i;
const POSTCODES_IO_URL = (process.env.POSTCODES_IO_URL || 'https://api.postcodes.io').replace(/\/+$/, '');

export type GeocodeSource = 'cache' | 'postcodes.io' | 'provided';

export type GeocodeResult = {
  postcode: string;
  latitude: number;
  longitude: number;
  source: GeocodeSource;
};

export type GeocodeOptions = {
  skipCache?: boolean;
  signal?: AbortSignal;
};

function getClient(): SupabaseClient {
  return getServiceSupabaseClient();
}

export function normalisePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(POSTCODE_REGEX);
  if (!match) return null;
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
}

export function compressPostcode(raw: string | null | undefined): string | null {
  const value = normalisePostcode(raw);
  return value ? value.replace(/\s+/g, '') : null;
}

export function detectPostcode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(POSTCODE_REGEX);
  return match ? normalisePostcode(match[0]) : null;
}

export async function lookupCachedPostcode(rawPostcode: string): Promise<GeocodeResult | null> {
  const compact = compressPostcode(rawPostcode);
  if (!compact) return null;

  try {
    const client = getClient();
    const { data, error } = await client
      .from('postcode_cache')
      .select('postcode, latitude, longitude')
      .eq('postcode', compact)
      .maybeSingle();

    if (error || !data) return null;

    const now = new Date().toISOString();
    void client
      .from('postcode_cache')
      .update({ last_used_at: now })
      .eq('postcode', compact);

    return {
      postcode: normalisePostcode(compact) ?? compact,
      latitude: data.latitude,
      longitude: data.longitude,
      source: 'cache',
    };
  } catch (error) {
    console.warn('[geocode] cache lookup failed', error);
    return null;
  }
}

export async function cachePostcodeCoordinates(postcode: string, latitude: number, longitude: number) {
  const compact = compressPostcode(postcode);
  if (!compact) return;

  try {
    const client = getClient();
    const now = new Date().toISOString();
    await client
      .from('postcode_cache')
      .upsert(
        {
          postcode: compact,
          latitude,
          longitude,
          last_used_at: now,
        },
        { onConflict: 'postcode' }
      );
  } catch (error) {
    console.warn('[geocode] cache upsert failed', error);
  }
}

export async function geocodePostcode(postcode: string, options: GeocodeOptions = {}): Promise<GeocodeResult | null> {
  const compact = compressPostcode(postcode);
  if (!compact) return null;

  if (!options.skipCache) {
    const cached = await lookupCachedPostcode(compact);
    if (cached) return cached;
  }

  const normalised = normalisePostcode(compact) ?? compact;
  const url = `${POSTCODES_IO_URL}/postcodes/${encodeURIComponent(normalised)}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`postcodes.io lookup failed with status ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.result;

  const latitude = Number(result?.latitude);
  const longitude = Number(result?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  await cachePostcodeCoordinates(compact, latitude, longitude);

  return {
    postcode: normalised,
    latitude,
    longitude,
    source: 'postcodes.io',
  };
}

export async function ensurePostcodeCoordinates(postcode: string, latitude?: number | null, longitude?: number | null) {
  if (typeof latitude === 'number' && Number.isFinite(latitude) && typeof longitude === 'number' && Number.isFinite(longitude)) {
    await cachePostcodeCoordinates(postcode, latitude, longitude);
    return { postcode: normalisePostcode(postcode) ?? postcode, latitude, longitude, source: 'provided' as GeocodeSource };
  }

  return geocodePostcode(postcode);
}
