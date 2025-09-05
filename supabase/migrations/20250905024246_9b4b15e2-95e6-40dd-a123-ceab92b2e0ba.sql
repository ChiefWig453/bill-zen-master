-- Create income table for tracking user income
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('one-time', 'weekly', 'bi-weekly', 'monthly', 'annually')),
  date_received DATE,
  next_date DATE,
  category TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_received BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own incomes" 
ON public.incomes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incomes" 
ON public.incomes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes" 
ON public.incomes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes" 
ON public.incomes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_incomes_updated_at
BEFORE UPDATE ON public.incomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate next income date for recurring incomes
CREATE OR REPLACE FUNCTION public.calculate_next_income_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_recurring AND NEW.date_received IS NOT NULL THEN
    CASE NEW.frequency
      WHEN 'weekly' THEN
        NEW.next_date = NEW.date_received + INTERVAL '7 days';
      WHEN 'bi-weekly' THEN
        NEW.next_date = NEW.date_received + INTERVAL '14 days';
      WHEN 'monthly' THEN
        NEW.next_date = NEW.date_received + INTERVAL '1 month';
      WHEN 'annually' THEN
        NEW.next_date = NEW.date_received + INTERVAL '1 year';
      ELSE
        NEW.next_date = NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic next date calculation
CREATE TRIGGER calculate_income_next_date
BEFORE INSERT OR UPDATE ON public.incomes
FOR EACH ROW
EXECUTE FUNCTION public.calculate_next_income_date();