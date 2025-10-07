-- Function to find published notices near a coordinate that PostgREST can expose via RPC
DROP FUNCTION IF EXISTS public.get_nearby_notices(double precision, double precision, integer);

CREATE OR REPLACE FUNCTION public.get_nearby_notices(
  lng double precision,
  lat double precision,
  radius_meters integer DEFAULT 5000
)
RETURNS SETOF public.notices
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  search_radius integer := GREATEST(COALESCE(radius_meters, 5000), 1);
  origin geography(Point, 4326);
BEGIN
  IF lng IS NULL OR lat IS NULL THEN
    RETURN;
  END IF;

  origin := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;

  -- Encourage the planner to use the spatial index if available
  PERFORM set_config('enable_seqscan', 'off', true);

  RETURN QUERY
  SELECT n.*
  FROM public.notices AS n
  WHERE n.status = 'published'
    AND n.location IS NOT NULL
    AND ST_DWithin(n.location, origin, search_radius)
  ORDER BY n.created_at DESC;
END;
$$;
