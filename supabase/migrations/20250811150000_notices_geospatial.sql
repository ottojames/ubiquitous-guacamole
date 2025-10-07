-- Enable spatial extension for geospatial features
CREATE EXTENSION IF NOT EXISTS "postgis";

-- New lookup cache for postcode geocoding results
CREATE TABLE IF NOT EXISTS public.postcode_cache (
  postcode TEXT PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- When premises include a postcode that is already cached, hydrate coordinates automatically
CREATE OR REPLACE FUNCTION public.populate_notice_coordinates()
RETURNS TRIGGER AS $$
DECLARE
  compact_postcode TEXT;
  cached RECORD;
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.premises IS NULL THEN
    RETURN NEW;
  END IF;

  compact_postcode := REPLACE(UPPER(COALESCE(NEW.premises->>'postcode', '')), ' ', '');
  IF compact_postcode IS NULL OR compact_postcode = '' THEN
    RETURN NEW;
  END IF;

  SELECT latitude, longitude
  INTO cached
  FROM public.postcode_cache
  WHERE postcode = compact_postcode
  LIMIT 1;

  IF FOUND THEN
    NEW.latitude := cached.latitude;
    NEW.longitude := cached.longitude;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS populate_notice_coordinates ON public.notices;
CREATE TRIGGER populate_notice_coordinates
BEFORE INSERT OR UPDATE OF premises
ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.populate_notice_coordinates();

-- Add coordinate columns to notices and derived geography point
ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Trigger to keep geography point in sync with numeric coordinates
CREATE OR REPLACE FUNCTION public.set_notice_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::GEOGRAPHY;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notice_location ON public.notices;
CREATE TRIGGER set_notice_location
BEFORE INSERT OR UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.set_notice_location();

-- Spatial index for map queries
CREATE INDEX IF NOT EXISTS idx_notices_location
  ON public.notices
  USING GIST (location);
