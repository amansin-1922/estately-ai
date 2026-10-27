-- Estately AI Phase 7: shared atomic rate limits for the public buyer chatbot.
-- Run this migration in the same Supabase project BEFORE deploying the updated API.
-- No changes to leads, properties, conversations, visits, or chat sessions.
BEGIN;

CREATE TABLE IF NOT EXISTS public.public_chat_rate_limits (
  scope text NOT NULL,
  subject_hash text NOT NULL CHECK (subject_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 1 CHECK (hits >= 1),
  PRIMARY KEY (scope, subject_hash, window_start)
);

CREATE INDEX IF NOT EXISTS public_chat_rate_limits_expiry_idx
  ON public.public_chat_rate_limits (window_start);

ALTER TABLE public.public_chat_rate_limits ENABLE ROW LEVEL SECURITY;
-- No RLS policies: direct table access is denied to normal API users.
REVOKE ALL ON TABLE public.public_chat_rate_limits FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_public_chat_rate_limit(
  p_scope text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hits integer;
  v_bucket timestamptz;
BEGIN
  IF p_scope IS NULL OR p_scope NOT IN (
    'get_ip_min','post_ip_min','start_ip_min','start_site_hour',
    'message_session_min','message_site_hour','message_site_day','visit_session_min'
  ) OR p_subject_hash IS NULL OR p_subject_hash !~ '^[0-9a-f]{64}$'
    OR p_limit IS NULL OR p_limit < 1 OR p_limit > 10000
    OR p_window_seconds IS NULL OR p_window_seconds NOT IN (60, 3600, 86400)
  THEN
    RAISE EXCEPTION 'Invalid rate-limit request';
  END IF;

  v_bucket := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.public_chat_rate_limits(scope, subject_hash, window_start, hits)
  VALUES (p_scope, p_subject_hash, v_bucket, 1)
  ON CONFLICT (scope, subject_hash, window_start)
  DO UPDATE SET hits = public.public_chat_rate_limits.hits + 1
    WHERE public.public_chat_rate_limits.hits < p_limit
  RETURNING hits INTO v_hits;

  RETURN v_hits IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_chat_rate_limit(text,text,integer,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_chat_rate_limit(text,text,integer,integer)
  TO service_role;

COMMIT;
