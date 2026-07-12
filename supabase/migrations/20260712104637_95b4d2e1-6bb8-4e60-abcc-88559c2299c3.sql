CREATE TYPE public.app_role AS ENUM ('Fleet Manager', 'Driver');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  email TEXT,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clerk_user_id, role)
);

CREATE INDEX user_roles_clerk_user_id_idx ON public.user_roles (clerk_user_id);
CREATE INDEX user_roles_email_idx ON public.user_roles (email);

GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auth is handled by Clerk (not Supabase auth.uid()), so RLS is permissive.
-- Role assignment is admin-only, performed via SQL / the backend console.
CREATE POLICY "Anyone can read user_roles"
  ON public.user_roles FOR SELECT
  USING (true);
