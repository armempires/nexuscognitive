CREATE TABLE IF NOT EXISTS public.app_secrets (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_secrets_service_role_full" ON public.app_secrets;
CREATE POLICY "app_secrets_service_role_full"
  ON public.app_secrets
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "app_secrets_anon_none" ON public.app_secrets;
CREATE POLICY "app_secrets_anon_none"
  ON public.app_secrets
  TO anon
  USING (false)
  WITH CHECK (false);
