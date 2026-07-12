
-- 1. user_roles: remove public SELECT policy; expose via SECURITY DEFINER RPC
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.user_roles FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_user_roles(_clerk_user_id text, _email text DEFAULT NULL)
RETURNS TABLE(role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ur.role
  FROM public.user_roles ur
  WHERE ur.clerk_user_id = _clerk_user_id
     OR (_email IS NOT NULL AND lower(ur.email) = lower(_email));
$$;

GRANT EXECUTE ON FUNCTION public.get_user_roles(text, text) TO anon, authenticated;

-- 2. fuel_logs: remove all public policies; access via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Anyone can insert fuel_logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Anyone can update fuel_logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Anyone can read fuel_logs" ON public.fuel_logs;

REVOKE ALL ON public.fuel_logs FROM anon;
REVOKE ALL ON public.fuel_logs FROM authenticated;
GRANT ALL ON public.fuel_logs TO service_role;

CREATE OR REPLACE FUNCTION public.list_fuel_logs(
  _status text DEFAULT NULL,
  _driver_id text DEFAULT NULL
)
RETURNS SETOF public.fuel_logs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.fuel_logs
  WHERE (_status IS NULL OR status::text = _status)
    AND (_driver_id IS NULL OR driver_id = _driver_id)
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_fuel_logs(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_fuel_log(
  _vehicle_id uuid,
  _vehicle_registration text,
  _driver_id text,
  _driver_email text,
  _liters numeric,
  _total_cost numeric,
  _notes text,
  _media_url text
)
RETURNS public.fuel_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.fuel_logs;
BEGIN
  IF _driver_id IS NULL OR length(trim(_driver_id)) = 0 THEN
    RAISE EXCEPTION 'driver_id required';
  END IF;
  IF _liters IS NULL OR _liters <= 0 THEN
    RAISE EXCEPTION 'liters must be positive';
  END IF;
  IF _total_cost IS NULL OR _total_cost < 0 THEN
    RAISE EXCEPTION 'total_cost must be non-negative';
  END IF;

  INSERT INTO public.fuel_logs(
    vehicle_id, vehicle_registration, driver_id, driver_email,
    liters, total_cost, notes, media_url, status
  )
  VALUES (
    _vehicle_id, _vehicle_registration, _driver_id, _driver_email,
    _liters, _total_cost, _notes, _media_url, 'Pending'
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_fuel_log(uuid, text, text, text, numeric, numeric, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.review_fuel_log(
  _id uuid,
  _approve boolean,
  _reviewer_id text,
  _note text DEFAULT NULL
)
RETURNS public.fuel_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.fuel_logs;
BEGIN
  UPDATE public.fuel_logs SET
    status = CASE WHEN _approve THEN 'Approved'::public.fuel_log_status ELSE 'Rejected'::public.fuel_log_status END,
    reviewed_by = _reviewer_id,
    reviewed_at = now(),
    reviewer_note = _note
  WHERE id = _id
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_fuel_log(uuid, boolean, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sum_approved_fuel_cost(_vehicle_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(total_cost), 0)
  FROM public.fuel_logs
  WHERE vehicle_id = _vehicle_id AND status = 'Approved';
$$;

GRANT EXECUTE ON FUNCTION public.sum_approved_fuel_cost(uuid) TO anon, authenticated;

-- 3. vehicles: replace always-true ALL policy with narrower per-operation policies
DROP POLICY IF EXISTS "Anyone can write vehicles" ON public.vehicles;

CREATE POLICY "Insert vehicles with valid identifiers"
  ON public.vehicles
  FOR INSERT
  WITH CHECK (
    char_length(trim(registration_number)) > 0
    AND char_length(trim(model)) > 0
  );

CREATE POLICY "Update vehicles with valid identifiers"
  ON public.vehicles
  FOR UPDATE
  USING (char_length(trim(registration_number)) > 0)
  WITH CHECK (char_length(trim(registration_number)) > 0);

CREATE POLICY "Delete only available vehicles"
  ON public.vehicles
  FOR DELETE
  USING (status = 'Available'::public.vehicle_status);
