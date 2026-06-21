
-- =========================================================
-- ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- =========================================================
-- MASTER ADMIN CODE
-- =========================================================
CREATE OR REPLACE FUNCTION public.redeem_admin_master_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;
  IF upper(trim(_code)) <> 'LLLOOOUUUIIISSSEEE030303' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- =========================================================
-- TAGS
-- =========================================================
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#ffffff',
  icon text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are public" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.profile_tags (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  hidden boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, tag_id)
);

GRANT SELECT ON public.profile_tags TO anon, authenticated;
GRANT UPDATE (hidden) ON public.profile_tags TO authenticated;
GRANT ALL ON public.profile_tags TO service_role;

ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile tags public read" ON public.profile_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users toggle own tag visibility" ON public.profile_tags FOR UPDATE TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admins assign tags" ON public.profile_tags FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins remove tags" ON public.profile_tags FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed some default tags
INSERT INTO public.tags (slug, name, color, icon, description) VALUES
  ('staff',    'Staff',    '#ef4444', 'shield',  'Linq staff member'),
  ('founder',  'Founder',  '#f59e0b', 'crown',   'Founder'),
  ('og',       'OG',       '#a855f7', 'star',    'Early supporter'),
  ('verified', 'Verified', '#3b82f6', 'check',   'Verified user'),
  ('premium',  'Premium',  '#eab308', 'sparkles','Premium member'),
  ('beta',     'Beta',     '#10b981', 'flask',   'Beta tester');

-- =========================================================
-- PREMIUM CODES — add duration + admin generator
-- =========================================================
ALTER TABLE public.premium_codes
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- Lift existing too-restrictive read policy
DROP POLICY IF EXISTS "Authenticated can read codes (for own verification)" ON public.premium_codes;
CREATE POLICY "Admins read codes" ON public.premium_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profile additions for premium duration + new options
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS card_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_tilt    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location     text;

-- Redeem premium with duration support
CREATE OR REPLACE FUNCTION public.redeem_premium_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.premium_codes%ROWTYPE;
  new_expiry timestamptz;
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

  IF rec.duration_days IS NULL THEN
    new_expiry := NULL;
    UPDATE public.profiles
      SET is_premium = true, premium_expires_at = NULL
      WHERE id = uid;
  ELSE
    SELECT GREATEST(COALESCE(premium_expires_at, now()), now()) + (rec.duration_days || ' days')::interval
      INTO new_expiry FROM public.profiles WHERE id = uid;
    UPDATE public.profiles
      SET is_premium = true, premium_expires_at = new_expiry
      WHERE id = uid;
  END IF;

  RETURN jsonb_build_object('ok', true, 'duration_days', rec.duration_days, 'expires_at', new_expiry);
END;
$$;

-- Admin: generate one premium code
CREATE OR REPLACE FUNCTION public.generate_premium_code(_duration_days integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_code text;
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  new_code := 'LINQ-' ||
    upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4)) || '-' ||
    upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4));
  INSERT INTO public.premium_codes (code, duration_days, created_by)
    VALUES (new_code, _duration_days, uid);
  RETURN jsonb_build_object('ok', true, 'code', new_code);
END;
$$;

-- Admin: assign / remove tags by user_id (uses RLS)
-- (handled by RLS-enabled direct inserts/deletes from admin client)

-- Admin: create tag
CREATE OR REPLACE FUNCTION public.create_tag(_slug text, _name text, _color text, _icon text, _description text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  new_id uuid;
BEGIN
  IF NOT public.has_role(uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_admin');
  END IF;
  INSERT INTO public.tags (slug, name, color, icon, description)
    VALUES (lower(trim(_slug)), _name, COALESCE(_color, '#ffffff'), _icon, _description)
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok', true, 'id', new_id);
END;
$$;

-- =========================================================
-- STORAGE policies for user-assets bucket
-- Path convention: <user_id>/<filename>
-- =========================================================
CREATE POLICY "user-assets owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-assets owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-assets owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-assets owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
