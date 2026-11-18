-- Migration Fase 1: Fundação Anti-Sybil & Autenticação Segura (TS1)
-- Aplicada no Supabase (projeto fivzbbqzgvvwgtlhietx)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS canonical_email text,
  ADD COLUMN IF NOT EXISTS phone_hash text,
  ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS trust_level text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS risk_cluster_id uuid,
  ADD COLUMN IF NOT EXISTS eligible_initial_bonus boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_canonical_email_unique
  ON public.profiles (canonical_email)
  WHERE canonical_email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_hash_unique
  ON public.profiles (phone_hash)
  WHERE phone_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_risk_cluster_idx
  ON public.profiles (risk_cluster_id)
  WHERE risk_cluster_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.account_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_hash text NOT NULL,
  ip_hash text NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_signals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS account_signals_device_idx
  ON public.account_signals (device_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS account_signals_ip_idx
  ON public.account_signals (ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS account_signals_user_idx
  ON public.account_signals (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.deleted_identity_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_hash text NOT NULL,
  identity_type text NOT NULL,
  season_year int NOT NULL DEFAULT 2026,
  cooldown_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deleted_identity_hashes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS deleted_identity_hashes_lookup_idx
  ON public.deleted_identity_hashes (identity_hash, identity_type, cooldown_until DESC);

CREATE OR REPLACE FUNCTION public.prevent_cluster_duplicate_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cluster uuid;
BEGIN
  SELECT risk_cluster_id INTO v_cluster
  FROM public.profiles
  WHERE id = NEW.voter_id;

  IF v_cluster IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.steward_report_votes v
      JOIN public.profiles p ON p.id = v.voter_id
      WHERE v.report_id = NEW.report_id
        AND p.risk_cluster_id = v_cluster
        AND v.voter_id <> NEW.voter_id
    ) THEN
      RAISE EXCEPTION 'Restrição de integridade: apenas um voto por dispositivo/rede é permitido por report.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_cluster_duplicate_vote ON public.steward_report_votes;
CREATE TRIGGER trg_prevent_cluster_duplicate_vote
  BEFORE INSERT ON public.steward_report_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_cluster_duplicate_vote();
