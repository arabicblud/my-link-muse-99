
-- Allow anyone to read objects in user-assets bucket (assets are profile pictures/backgrounds, meant to be public)
DROP POLICY IF EXISTS "Public read user-assets" ON storage.objects;
CREATE POLICY "Public read user-assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'user-assets');

-- Revoke EXECUTE on admin-only SECURITY DEFINER functions from public/anon/authenticated.
-- Admins call them via service_role-equivalent paths or with explicit role grants.
REVOKE EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_add_views(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_grant_premium(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_premium(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_tag(text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_premium_code(integer, integer) FROM PUBLIC, anon, authenticated;

-- These admin functions still need to be callable by signed-in admins. Grant to service_role only;
-- the app invokes them through createServerFn handlers running with the service role client.
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_add_views(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_grant_premium(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_premium(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_tag(text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_premium_code(integer, integer) TO service_role;

-- Also revoke from touch_updated_at (trigger only) and tighten redeem_admin_master_code to authenticated only.
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_admin_master_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_premium_code(text) FROM PUBLIC, anon;
-- These need authenticated access for users to redeem codes.
GRANT EXECUTE ON FUNCTION public.redeem_admin_master_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_premium_code(text) TO authenticated;
