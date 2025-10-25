-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::public.app_role
FROM public.profiles
WHERE role IS NOT NULL;

-- Drop old trigger functions and triggers CASCADE (this removes dependencies on role column)
DROP TRIGGER IF EXISTS prevent_unauthorized_role_changes_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_self_role_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_unauthorized_role_changes() CASCADE;

-- Drop old RLS policies on profiles that check role
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Now we can safely drop the role column
ALTER TABLE public.profiles DROP COLUMN role;

-- Create new RLS policies using has_role function
CREATE POLICY "Admins can create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop old security definer function that's no longer needed
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Update handle_new_user function to set default user role in user_roles table
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
  
  -- Insert sanitized profile data (no role column anymore)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, _email, _first_name, _last_name);
  
  -- Insert default 'user' role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;