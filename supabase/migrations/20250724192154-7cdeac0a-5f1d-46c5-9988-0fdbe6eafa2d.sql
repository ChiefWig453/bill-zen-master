-- Fix 1: Add missing authentication trigger for profile creation
-- This ensures profiles are automatically created when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'user'  -- Default role
  );
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix 2: Enhanced role escalation prevention
-- Prevent unauthorized role changes and ensure only admins can promote users
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE id = auth.uid();

  -- Prevent users from changing their own role to admin
  IF NEW.role = 'admin' AND NEW.id = auth.uid() AND OLD.role != 'admin' THEN
    RAISE EXCEPTION 'Users cannot promote themselves to admin role';
  END IF;

  -- Only admins can change roles (except for self-demotion from admin)
  IF OLD.role != NEW.role AND current_user_role != 'admin' THEN
    -- Allow users to demote themselves from admin
    IF NOT (NEW.id = auth.uid() AND OLD.role = 'admin' AND NEW.role != 'admin') THEN
      RAISE EXCEPTION 'Only administrators can modify user roles';
    END IF;
  END IF;

  -- Prevent setting invalid roles
  IF NEW.role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified. Must be either "user" or "admin"';
  END IF;

  RETURN NEW;
END;
$$;

-- Update the trigger name and replace the old one
DROP TRIGGER IF EXISTS prevent_self_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_unauthorized_role_changes_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.prevent_unauthorized_role_changes();

-- Fix 3: Create secure bill templates table to replace localStorage storage
CREATE TABLE IF NOT EXISTS public.bill_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC,
  category TEXT NOT NULL,
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bill templates
ALTER TABLE public.bill_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bill templates
CREATE POLICY "Users can view their own bill templates" 
ON public.bill_templates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bill templates" 
ON public.bill_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bill templates" 
ON public.bill_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bill templates" 
ON public.bill_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_bill_templates_updated_at
  BEFORE UPDATE ON public.bill_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix 4: Add input validation function for enhanced security
CREATE OR REPLACE FUNCTION public.validate_bill_input(
  p_name TEXT,
  p_amount NUMERIC,
  p_category TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 OR LENGTH(p_name) > 255 THEN
    RAISE EXCEPTION 'Bill name must be between 1 and 255 characters';
  END IF;
  
  -- Validate amount (if provided)
  IF p_amount IS NOT NULL AND (p_amount < 0 OR p_amount > 999999.99) THEN
    RAISE EXCEPTION 'Bill amount must be between 0 and 999,999.99';
  END IF;
  
  -- Validate category
  IF p_category IS NULL OR LENGTH(TRIM(p_category)) = 0 OR LENGTH(p_category) > 100 THEN
    RAISE EXCEPTION 'Category must be between 1 and 100 characters';
  END IF;
  
  RETURN TRUE;
END;
$$;