-- Create dash_sessions table for tracking DoorDash work sessions
CREATE TABLE public.dash_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  miles_driven NUMERIC,
  gas_cost NUMERIC,
  tips_cash NUMERIC NOT NULL DEFAULT 0,
  tips_app NUMERIC NOT NULL DEFAULT 0,
  base_pay NUMERIC NOT NULL DEFAULT 0,
  promotions NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dash_expenses table for tracking DoorDash-related expenses
CREATE TABLE public.dash_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dash_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dash_sessions
CREATE POLICY "Users can view their own dash sessions" 
ON public.dash_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dash sessions" 
ON public.dash_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dash sessions" 
ON public.dash_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dash sessions" 
ON public.dash_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for dash_expenses
CREATE POLICY "Users can view their own dash expenses" 
ON public.dash_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dash expenses" 
ON public.dash_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dash expenses" 
ON public.dash_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dash expenses" 
ON public.dash_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_dash_sessions_updated_at
BEFORE UPDATE ON public.dash_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dash_expenses_updated_at
BEFORE UPDATE ON public.dash_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate total hours when ending a session
CREATE OR REPLACE FUNCTION public.calculate_session_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically calculate hours
CREATE TRIGGER calculate_dash_session_hours
BEFORE UPDATE ON public.dash_sessions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_session_hours();