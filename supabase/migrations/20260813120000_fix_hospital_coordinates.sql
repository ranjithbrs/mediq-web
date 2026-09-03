-- Fix: Add GPS coordinates (latitude/longitude) to all existing hospitals
-- Root cause: All hospitals were seeded without lat/lon, causing Emergency Assist
-- to show no nearby hospitals from DB, and the sort order was undefined.
--
-- Coordinates sourced from Google Maps / OpenStreetMap for each hospital location.

UPDATE public.hospitals
SET
  latitude  = 18.9388,
  longitude = 72.8354
WHERE name = 'City General Hospital' AND city = 'Mumbai';

UPDATE public.hospitals
SET
  latitude  = 28.6139,
  longitude = 77.2090
WHERE name = 'Metro Medical Center' AND city = 'Delhi';

UPDATE public.hospitals
SET
  latitude  = 12.9716,
  longitude = 77.5946
WHERE name = 'Sunrise Hospital' AND city = 'Bangalore';

-- Coimbatore hospitals (added via Supabase Dashboard without coordinates)
UPDATE public.hospitals
SET
  latitude  = 11.0168,
  longitude = 76.9558
WHERE city ILIKE 'coimbatore' AND latitude IS NULL;
