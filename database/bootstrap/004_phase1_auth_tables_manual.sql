-- Phase 1 manual auth tables recovery
-- Built from function references in local schema

CREATE TABLE IF NOT EXISTS public.access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id
  ON public.access_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_access_tokens_active
  ON public.access_tokens(is_active);

CREATE TABLE IF NOT EXISTS public.mfa_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  totp_secret TEXT,
  backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  last_mfa_challenge_time TIMESTAMP WITH TIME ZONE,
  lockout_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_configurations_user_id
  ON public.mfa_configurations(user_id);