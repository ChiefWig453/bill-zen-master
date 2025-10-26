-- Insert pre-populated weekly tasks
INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Check HVAC Filter',
  'Visually inspect your HVAC filter. Replace if dirty or every 1-3 months.',
  'weekly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Test Smoke and CO Detectors',
  'Press the test button on all smoke and carbon monoxide detectors.',
  'weekly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Check for Leaks',
  'Look under sinks and around toilets for any water leaks or moisture.',
  'weekly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

-- Insert pre-populated monthly tasks
INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Clean Range Hood Filter',
  'Remove and clean the range hood filter with warm soapy water.',
  'monthly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Test GFCI Outlets',
  'Press the test and reset buttons on all GFCI outlets.',
  'monthly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Clean Garbage Disposal',
  'Run ice cubes and citrus peels through the disposal to clean and freshen.',
  'monthly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Inspect Washing Machine Hoses',
  'Check hoses for bulges, cracks, or leaks. Replace if worn.',
  'monthly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, is_active, is_custom)
SELECT 
  id,
  'Clean Dryer Vent',
  'Remove lint buildup from the dryer vent and exhaust duct.',
  'monthly',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

-- Insert pre-populated seasonal tasks
INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, season, is_active, is_custom)
SELECT 
  id,
  'Service HVAC System',
  'Schedule professional HVAC maintenance before heating/cooling season.',
  'seasonal',
  'spring',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, season, is_active, is_custom)
SELECT 
  id,
  'Clean Gutters',
  'Remove leaves and debris from gutters and downspouts.',
  'seasonal',
  'fall',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, season, is_active, is_custom)
SELECT 
  id,
  'Inspect Roof',
  'Check for damaged or missing shingles, flashing issues, and roof leaks.',
  'seasonal',
  'spring',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, season, is_active, is_custom)
SELECT 
  id,
  'Seal Windows and Doors',
  'Check and replace weatherstripping and caulking around windows and doors.',
  'seasonal',
  'fall',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.maintenance_tasks (user_id, name, description, frequency, season, is_active, is_custom)
SELECT 
  id,
  'Drain Water Heater',
  'Flush the water heater tank to remove sediment buildup.',
  'seasonal',
  'spring',
  false,
  false
FROM auth.users
ON CONFLICT DO NOTHING;