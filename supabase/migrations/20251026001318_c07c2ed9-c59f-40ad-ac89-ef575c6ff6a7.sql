-- Enable realtime for bills table
ALTER TABLE public.bills REPLICA IDENTITY FULL;

-- Add bills table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;