-- Create maintenance_tasks table
CREATE TABLE public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'seasonal')),
  season TEXT CHECK (season IN ('spring', 'summer', 'fall', 'winter')),
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reminder_days_before INTEGER NOT NULL DEFAULT 3,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance_history table
CREATE TABLE public.maintenance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_tasks
CREATE POLICY "Users can view their own tasks"
ON public.maintenance_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.maintenance_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.maintenance_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.maintenance_tasks FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for maintenance_history
CREATE POLICY "Users can view their own history"
ON public.maintenance_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own history"
ON public.maintenance_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
ON public.maintenance_history FOR DELETE
USING (auth.uid() = user_id);

-- Add home_maintenance_enabled to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN home_maintenance_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create function to calculate next due date
CREATE OR REPLACE FUNCTION public.calculate_next_maintenance_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.last_completed_at IS NOT NULL THEN
    CASE NEW.frequency
      WHEN 'weekly' THEN
        NEW.next_due_date = (NEW.last_completed_at + INTERVAL '7 days')::date;
      WHEN 'monthly' THEN
        NEW.next_due_date = (NEW.last_completed_at + INTERVAL '1 month')::date;
      WHEN 'seasonal' THEN
        NEW.next_due_date = (NEW.last_completed_at + INTERVAL '3 months')::date;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-calculating next due date
CREATE TRIGGER calculate_maintenance_date
BEFORE INSERT OR UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.calculate_next_maintenance_date();

-- Create trigger for updated_at
CREATE TRIGGER update_maintenance_tasks_updated_at
BEFORE UPDATE ON public.maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for maintenance_tasks
ALTER TABLE public.maintenance_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tasks;

-- Enable realtime for maintenance_history
ALTER TABLE public.maintenance_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_history;