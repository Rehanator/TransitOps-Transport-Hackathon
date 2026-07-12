-- Enums
CREATE TYPE public.vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop');
CREATE TYPE public.fuel_log_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  max_capacity NUMERIC(10,2) NOT NULL DEFAULT 0,
  lifetime_odometer NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.vehicle_status NOT NULL DEFAULT 'Available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT ON public.vehicles TO anon;
GRANT ALL ON public.vehicles TO service_role;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vehicles"
  ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Anyone can write vehicles"
  ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Fuel logs
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_registration TEXT,
  driver_id TEXT NOT NULL,
  driver_email TEXT,
  liters NUMERIC(10,2) NOT NULL CHECK (liters > 0),
  total_cost NUMERIC(12,2) NOT NULL CHECK (total_cost >= 0),
  media_url TEXT,
  notes TEXT,
  status public.fuel_log_status NOT NULL DEFAULT 'Pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fuel_logs_driver_id_idx ON public.fuel_logs (driver_id);
CREATE INDEX fuel_logs_status_idx ON public.fuel_logs (status);
CREATE INDEX fuel_logs_created_at_idx ON public.fuel_logs (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_logs TO authenticated;
GRANT SELECT, INSERT ON public.fuel_logs TO anon;
GRANT ALL ON public.fuel_logs TO service_role;

ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

-- Clerk-based auth: RLS is permissive, app enforces role checks.
CREATE POLICY "Anyone can read fuel_logs"
  ON public.fuel_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert fuel_logs"
  ON public.fuel_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update fuel_logs"
  ON public.fuel_logs FOR UPDATE USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER fuel_logs_set_updated_at BEFORE UPDATE ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
