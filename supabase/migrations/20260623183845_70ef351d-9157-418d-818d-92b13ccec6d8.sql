
-- =========================================================================
-- LINQED — bug fixes, premium/admin upgrades, security hardening
-- =========================================================================

-- ---------- new profile columns ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aliases text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS discord_id text,
  ADD COLUMN IF NOT EXISTS username_effect text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS name_gradient text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS tab_icon_url text,
  ADD COLUMN IF NOT EXISTS cursor_effect text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS force_tag_color text,
  ADD COLUMN IF NOT EXISTS hide_views boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS freeze_video_last_frame boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_width integer NOT NULL DEFAULT 28,
  ADD COLUMN IF NOT EXISTS button_theme text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS button_layout text NOT NULL DEFAULT 'stack',
  ADD COLUMN IF NOT EXISTS music_autoplay boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS music_volume integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS uid text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- assign UID to all existing rows + uniqueness
UPDATE public.profiles SET uid = lpad(((floor(random() * 900000) + 100000))::text, 6, '0') WHERE uid IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_uid_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_uid_key UNIQUE (uid);
  END IF;
END $$;

-- ---------- tags table extension ----------
ALTER TABLE public.tags
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS event_start timestamptz,
  ADD COLUMN IF NOT EXISTS event_end timestamptz,
  ADD COLUMN IF NOT EXISTS is_event boolean NOT NULL DEFAULT false;

-- seed verified + staff + founder tags if missing
INSERT INTO public.tags (slug, name, color, description) VALUES
  ('verified', 'Verified', '#3b82f6', 'Verified account'),
  ('staff', 'Staff', '#a855f7', 'Linqed staff'),
  ('founder', 'Founder', '#facc15', 'Linqed founder')
ON CONFLICT (slug) DO NOTHING;

-- ---------- reserved usernames ----------
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  name text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reserved_usernames TO anon, authenticated;
GRANT ALL ON public.reserved_usernames TO service_role;
ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reserved public read" ON public.reserved_usernames;
CREATE POLICY "reserved public read" ON public.reserved_usernames FOR SELECT USING (true);
DROP POLICY IF EXISTS "reserved admin write" ON public.reserved_usernames;
CREATE POLICY "reserved admin write" ON public.reserved_usernames
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.reserved_usernames (name) VALUES
  ('dashboard'),('admin'),('auth'),('api'),('settings'),('login'),
  ('signup'),('linqed'),('linq'),('www'),('root'),('support'),
  ('help'),('about'),('terms'),('privacy'),('home'),('me'),('app'),('cdn')
ON CONFLICT DO NOTHING;

-- ---------- link clicks tracking ----------
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS link_clicks_profile_idx ON public.link_clicks(profile_id, created_at);
CREATE INDEX IF NOT EXISTS link_clicks_link_idx ON public.link_clicks(link_id, created_at);
GRANT SELECT, INSERT ON public.link_clicks TO authenticated;
GRANT SELECT, INSERT ON public.link_clicks TO anon;
GRANT ALL ON public.link_clicks TO service_role;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads clicks" ON public.link_clicks;
CREATE POLICY "owner reads clicks" ON public.link_clicks FOR SELECT
  USING (auth.uid() = profile_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "anyone inserts clicks" ON public.link_clicks;
CREATE POLICY "anyone inserts clicks" ON public.link_clicks FOR INSERT WITH CHECK (true);

-- ---------- premium_codes write policies (security finding) ----------
DROP POLICY IF EXISTS "Admins write codes" ON public.premium_codes;
CREATE POLICY "Admins write codes" ON public.premium_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- profiles SELECT hardening (security finding) ----------
-- Keep "everyone can read" so the /$username page works, but expose a
-- column-narrow public view, and rely on app code to use the view for
-- public reads. Base table SELECT continues to work for own + admin
-- queries from the dashboard.
DROP VIEW IF EXISTS public.profiles_public CASCADE;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT
  id, username, display_name, bio, avatar_url, aliases, location,
  theme, accent_color, background_color, text_color, font_family,
  button_style, button_theme, button_layout,
  background_image_url, background_effect, audio_url, cursor_url,
  cursor_effect, music_autoplay, music_volume,
  page_title, page_description, seo_title, seo_description, tab_icon_url,
  tagline, typewriter_enabled,
  CASE WHEN hide_views THEN 0 ELSE view_count END AS view_count,
  CASE WHEN hide_views THEN false ELSE show_views END AS show_views,
  card_opacity, card_blur, card_enabled, card_tilt, card_width,
  icon_glow_color, entrance_animation,
  banner_url, discord_id, username_effect, name_gradient,
  force_tag_color, freeze_video_last_frame,
  is_premium,
  uid,
  banned_at
FROM public.profiles
WHERE banned_at IS NULL;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ---------- view increment RPC ----------
CREATE OR REPLACE FUNCTION public.increment_view(_profile_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET view_count = view_count + 1 WHERE id = _profile_id;
$$;
REVOKE ALL ON FUNCTION public.increment_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view(uuid) TO anon, authenticated;

-- ---------- regenerate generate_premium_code with quantity ----------
DROP FUNCTION IF EXISTS public.generate_premium_code(integer);
DROP FUNCTION IF EXISTS public.generate_premium_code(integer, integer);

CREATE OR REPLACE FUNCTION public.generate_premium_code(_duration_days integer, _quantity integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  i int := 0;
  new_code text;
  codes text[] := ARRAY[]::text[];
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  IF _quantity IS NULL OR _quantity < 1 THEN _quantity := 1; END IF;
  IF _quantity > 100 THEN _quantity := 100; END IF;
  WHILE i < _quantity LOOP
    new_code := 'LINQ-' ||
      upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4)) || '-' ||
      upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4));
    INSERT INTO public.premium_codes (code, duration_days, created_by)
      VALUES (new_code, _duration_days, uid);
    codes := array_append(codes, new_code);
    i := i + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'codes', codes);
END;
$$;
REVOKE ALL ON FUNCTION public.generate_premium_code(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_premium_code(integer, integer) TO authenticated;

-- ---------- grant premium directly (admin) ----------
CREATE OR REPLACE FUNCTION public.admin_grant_premium(_user_id uuid, _duration_days integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_expiry timestamptz;
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  IF _duration_days IS NULL THEN
    UPDATE public.profiles SET is_premium = true, premium_expires_at = NULL WHERE id = _user_id;
    RETURN jsonb_build_object('ok', true, 'expires_at', NULL);
  END IF;
  SELECT GREATEST(COALESCE(premium_expires_at, now()), now()) + (_duration_days || ' days')::interval
    INTO new_expiry FROM public.profiles WHERE id = _user_id;
  UPDATE public.profiles SET is_premium = true, premium_expires_at = new_expiry WHERE id = _user_id;
  RETURN jsonb_build_object('ok', true, 'expires_at', new_expiry);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_grant_premium(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_premium(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_premium(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  UPDATE public.profiles SET is_premium = false, premium_expires_at = NULL WHERE id = _user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_revoke_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_premium(uuid) TO authenticated;

-- ---------- ban / unban / add views ----------
CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _ban boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  UPDATE public.profiles SET banned_at = CASE WHEN _ban THEN now() ELSE NULL END WHERE id = _user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_ban_user(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_add_views(_user_id uuid, _count integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  UPDATE public.profiles SET view_count = GREATEST(0, view_count + _count) WHERE id = _user_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_add_views(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_views(uuid, integer) TO authenticated;

-- ---------- analytics aggregates ----------
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  RETURN jsonb_build_object(
    'ok', true,
    'users', (SELECT count(*) FROM public.profiles WHERE banned_at IS NULL),
    'banned', (SELECT count(*) FROM public.profiles WHERE banned_at IS NOT NULL),
    'premium', (SELECT count(*) FROM public.profiles WHERE is_premium),
    'views', (SELECT COALESCE(sum(view_count),0) FROM public.profiles),
    'clicks', (SELECT count(*) FROM public.link_clicks),
    'codes_used', (SELECT count(*) FROM public.premium_codes WHERE used_by IS NOT NULL),
    'codes_available', (SELECT count(*) FROM public.premium_codes WHERE used_by IS NULL),
    'signups_30d', (
      SELECT jsonb_agg(jsonb_build_object('day', day, 'n', n) ORDER BY day)
      FROM (
        SELECT to_char(created_at::date,'YYYY-MM-DD') AS day, count(*)::int AS n
        FROM public.profiles
        WHERE created_at > now() - interval '30 days'
        GROUP BY 1
      ) s
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;

-- ---------- revoke the existing security-definer admin helpers from anon ----------
REVOKE ALL ON FUNCTION public.create_tag(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_tag(text,text,text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_admin_master_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_admin_master_code(text) TO authenticated;

REVOKE ALL ON FUNCTION public.redeem_premium_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_premium_code(text) TO authenticated;
