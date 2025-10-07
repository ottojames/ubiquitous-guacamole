-- Function to fetch published notices that fall within a geographic bounding box
DROP FUNCTION IF EXISTS public.get_bbox_notices(double precision, double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.get_bbox_notices(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision
)
RETURNS SETOF public.notices
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  envelope geometry;
BEGIN
  IF min_lat IS NULL OR min_lng IS NULL OR max_lat IS NULL OR max_lng IS NULL THEN
    RETURN;
  END IF;

  IF min_lat < -90 OR max_lat > 90 OR min_lng < -180 OR max_lng > 180 OR max_lat <= min_lat OR max_lng <= min_lng THEN
    RETURN;
  END IF;

  envelope := ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326);

  RETURN QUERY
  SELECT n.*
  FROM public.notices AS n
  WHERE n.status = 'published'
    AND n.location IS NOT NULL
    AND ST_Within(n.location::geometry, envelope)
  ORDER BY n.created_at DESC;
END;
$$;
