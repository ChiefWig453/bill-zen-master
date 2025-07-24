-- Step 1: Fix Critical RLS Policy Gap - Add DELETE policy for profiles table
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Step 2: Create bills table to move data from localStorage to database
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  category TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bills table
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bills table
CREATE POLICY "Users can view their own bills" 
ON public.bills 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bills" 
ON public.bills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills" 
ON public.bills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills" 
ON public.bills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on bills
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Enhanced role protection - Add constraint to prevent self-role escalation
-- Add a function to check if user is trying to update their own role to admin
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If someone is trying to set their own role to admin, block it
  IF NEW.role = 'admin' AND NEW.id = auth.uid() AND OLD.role != 'admin' THEN
    RAISE EXCEPTION 'Users cannot promote themselves to admin role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent self-role escalation
CREATE TRIGGER prevent_self_admin_promotion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();