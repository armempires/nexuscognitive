CREATE TABLE IF NOT EXISTS public.email_confirmations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_confirmations_email ON public.email_confirmations (email);
CREATE INDEX IF NOT EXISTS idx_email_confirmations_expires_at ON public.email_confirmations (expires_at);

ALTER TABLE public.email_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_confirmations_service_role_full" ON public.email_confirmations;
CREATE POLICY "email_confirmations_service_role_full"
  ON public.email_confirmations
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "email_confirmations_anon_none" ON public.email_confirmations;
CREATE POLICY "email_confirmations_anon_none"
  ON public.email_confirmations
  TO anon
  USING (false);
