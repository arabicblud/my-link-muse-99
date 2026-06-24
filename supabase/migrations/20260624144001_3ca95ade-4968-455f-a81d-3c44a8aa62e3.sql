
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
SELECT id, username, display_name, bio, avatar_url, aliases, location,
  theme, accent_color, background_color, text_color, font_family,
  button_style, button_theme, button_layout,
  background_image_url, background_effect, audio_url, cursor_url, cursor_effect,
  music_autoplay, music_volume,
  page_title, page_description, seo_title, seo_description, tab_icon_url, tagline,
  typewriter_enabled,
  CASE WHEN hide_views THEN 0 ELSE view_count END AS view_count,
  CASE WHEN hide_views THEN false ELSE show_views END AS show_views,
  card_opacity, card_blur, card_enabled, card_tilt, card_width,
  icon_glow_color, entrance_animation,
  banner_url, username_effect, name_gradient, force_tag_color,
  freeze_video_last_frame, is_premium
FROM public.profiles
WHERE banned_at IS NULL;
GRANT SELECT ON public.profiles_public TO anon, authenticated;
