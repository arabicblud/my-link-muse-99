
-- 1. Premium code generator without gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_premium_code(_duration_days integer, _quantity integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  i int := 0;
  new_code text;
  codes text[] := ARRAY[]::text[];
  rand_part text;
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  IF _quantity IS NULL OR _quantity < 1 THEN _quantity := 1; END IF;
  IF _quantity > 100 THEN _quantity := 100; END IF;
  WHILE i < _quantity LOOP
    rand_part := upper(replace(gen_random_uuid()::text, '-', ''));
    new_code := 'LINQ-' || substr(rand_part, 1, 4) || '-' || substr(rand_part, 5, 4);
    INSERT INTO public.premium_codes (code, duration_days, created_by)
      VALUES (new_code, _duration_days, uid);
    codes := array_append(codes, new_code);
    i := i + 1;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'codes', codes);
END;
$function$;

-- 2. profiles_public: drop uid from the public projection
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT id, username, display_name, bio, avatar_url, aliases, location, theme,
  accent_color, background_color, text_color, font_family, button_style, button_theme,
  button_layout, background_image_url, background_effect, audio_url, cursor_url,
  cursor_effect, music_autoplay, music_volume, page_title, page_description,
  seo_title, seo_description, tab_icon_url, tagline, typewriter_enabled,
  CASE WHEN hide_views THEN 0 ELSE view_count END AS view_count,
  CASE WHEN hide_views THEN false ELSE show_views END AS show_views,
  card_opacity, card_blur, card_enabled, card_tilt, card_width, icon_glow_color,
  entrance_animation, banner_url, discord_id, username_effect, name_gradient,
  force_tag_color, freeze_video_last_frame, is_premium
FROM public.profiles
WHERE banned_at IS NULL;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- 3. Lock profiles table SELECT to owners + admins; the public uses profiles_public.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Owners and admins read profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 4. link_clicks insert: validate the link exists, is visible, and matches the profile_id.
DROP POLICY IF EXISTS "anyone inserts clicks" ON public.link_clicks;
CREATE POLICY "validated link click insert"
  ON public.link_clicks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = link_clicks.link_id
        AND l.profile_id = link_clicks.profile_id
        AND l.is_visible = true
    )
  );
