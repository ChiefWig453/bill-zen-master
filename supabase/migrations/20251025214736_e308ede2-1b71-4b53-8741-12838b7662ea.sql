-- Add input validation and sanitization to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _first_name TEXT;
  _last_name TEXT;
  _email TEXT;
BEGIN
  -- Validate and sanitize metadata with length limits
  _first_name := substring(COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''), 1, 100);
  _last_name := substring(COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''), 1, 100);
  _email := substring(COALESCE(NEW.email, ''), 1, 255);
  
  -- Validate first name contains only allowed characters
  IF _first_name IS NOT NULL AND _first_name != '' THEN
    IF _first_name !~ '^[a-zA-Z\s''-]+$' THEN
      _first_name := NULL;
    END IF;
  ELSE
    _first_name := NULL;
  END IF;
  
  -- Validate last name contains only allowed characters
  IF _last_name IS NOT NULL AND _last_name != '' THEN
    IF _last_name !~ '^[a-zA-Z\s''-]+$' THEN
      _last_name := NULL;
    END IF;
  ELSE
    _last_name := NULL;
  END IF;
  
  -- Insert sanitized profile data
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (NEW.id, _email, _first_name, _last_name, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;