
-- Add premium + customization columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS background_effect text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS cursor_url text,
  ADD COLUMN IF NOT EXISTS page_title text,
  ADD COLUMN IF NOT EXISTS page_description text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS typewriter_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_views boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_opacity integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS card_blur integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_glow_color text,
  ADD COLUMN IF NOT EXISTS entrance_animation text NOT NULL DEFAULT 'fade';

-- Redeem codes table
CREATE TABLE IF NOT EXISTS public.premium_codes (
  code text PRIMARY KEY,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_codes TO authenticated;
GRANT ALL ON public.premium_codes TO service_role;

ALTER TABLE public.premium_codes ENABLE ROW LEVEL SECURITY;

-- No direct insert/update from clients; redemption goes through SECURITY DEFINER function.
CREATE POLICY "Authenticated can read codes (for own verification)"
  ON public.premium_codes FOR SELECT TO authenticated
  USING (false);  -- nothing readable; redemption uses SECURITY DEFINER

-- Redemption RPC
CREATE OR REPLACE FUNCTION public.redeem_premium_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.premium_codes%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO rec FROM public.premium_codes WHERE code = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF rec.used_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  UPDATE public.premium_codes
    SET used_by = uid, used_at = now()
    WHERE code = rec.code;

  UPDATE public.profiles SET is_premium = true WHERE id = uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_premium_code(text) TO authenticated;

-- Seed one launch code
INSERT INTO public.premium_codes (code) VALUES ('LINQ-LAUNCH-7F3K9X2P')
ON CONFLICT (code) DO NOTHING;
