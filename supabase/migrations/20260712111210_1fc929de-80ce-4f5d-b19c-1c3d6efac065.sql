ALTER PUBLICATION supabase_realtime ADD TABLE public.fuel_logs;
ALTER TABLE public.fuel_logs REPLICA IDENTITY FULL;