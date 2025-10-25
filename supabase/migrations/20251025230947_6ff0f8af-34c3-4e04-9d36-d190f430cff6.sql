-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bills_enabled boolean NOT NULL DEFAULT true,
  doordash_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, bills_enabled, doordash_enabled)
  VALUES (NEW.id, true, false);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger to auto-create preferences when user signs up
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_preferences();