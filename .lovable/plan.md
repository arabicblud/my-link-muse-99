
# Linqed — Big Bug Fix, Premium, Admin & Security Pass

This is a large multi-area pass. I'll group the work into phases so it ships clean. Tell me to cut/reorder anything.

## 1. Branding
- Rename project from "linq" to **Linqed** across UI, titles, meta, footer, auth, dashboard, admin headers.

## 2. Critical Bug Fixes (visual engine)
In `src/components/link-page-preview.tsx`:
- **3D tilt**: rewrite with proper `mousemove` listener on the card element, `transform: perspective() rotateX rotateY`, reset on leave. Currently broken because handlers/refs aren't wired correctly.
- **Custom cursor**: apply via inline `style={{ cursor: \`url(${url}), auto\` }}` on the page root (not on inner card) and ensure URL is a valid PNG.
- **Card effect**: fix `card_enabled`, `card_opacity`, `card_blur`, `icon_glow_color` actually being applied to the wrapper.
- **Background effect**: rebuild the 3 effects so they're visually distinct:
  - Snow → slow large white flakes, drift sideways
  - Rain → fast thin vertical blue streaks
  - Particles → small floating glowing dots
  - Confetti → multi-color squares falling + rotating
- **Typewriter**: type → pause → delete → pause → restart loop (configurable delays).
- **Views counter**: replace direct UPDATE with a `increment_view(_profile_id)` SECURITY DEFINER RPC, called once per session per profile from `/$username`.

## 3. Admin Panel Fixes & Features
- Fix `generate_premium_code` (currently throws "function doesn't exist") → confirm signature `(_duration_days int, _quantity int)` and recreate; add **quantity** input on UI to bulk-generate.
- Fix "grant premium" button (use the same flow as code redemption with chosen duration).
- **Hard lock admin route**: anyone without `staff` or `founder` role/tag → 404 component (not unlock gate). Master code still works but only for the founder account.
- New admin features:
  - Ban account (adds `banned_at` flag → profile returns 404)
  - Delete account (cascades profile + auth user via admin API server fn)
  - Add views (manual increment)
  - **Reserved usernames** list (table `reserved_usernames`, editable)
  - **Analytics tab** (totals: users, premium, views; chart of signups & views over 30 days)
  - Tag icons via image upload instead of text icon field

## 4. Customization Features (free)
- **Aliases** (small "aka: …" line under description)
- **Discord bot integration** — actual bot showing activity/presence (requires bot token; see Open Questions)
- **Music autoplay unmuted** + on-page **volume slider**
- **Verified tag as inline icon** next to username (TikTok style) — special handling for `verified` slug
- **Button icons** — picker (lucide icon name or uploaded image)
- Background image/gif/video, audio mp3/ogg, custom cursor PNG → **moved out of premium** (free)

## 5. Premium Features (gated)
- Custom SEO title (fallback `@username`)
- Custom SEO description
- Custom tab image (favicon)
- Username effects (rainbow, glitch, glow)
- Gradient name (2-color picker)
- Profile **banner** (card-only)
- **Hide views** toggle
- **Cursor effects** (trail, sparkle)
- Force all tags to same color
- Video background → freeze on last frame instead of looping
- More button themes + layout styles (grid/2-col/pill)
- Entrance animation → premium only
- Typewriter → premium only
- Resizable card (width slider)
- **Premium Perks** section in Premium tab listing everything above

## 6. Auth & Home
- Enable persistent session (`persistSession: true`, `autoRefreshToken: true`) in the client — already on by default; verify and ensure no manual sign-out on tab close.
- Home page: when logged in, swap "Claim your linqed" CTA for **"Dashboard"** button.
- Add **"Fully Vibe-Coded"** line at the very bottom of the home page.

## 7. Overview / Analytics / UID
- Add `uid` (short numeric, e.g. 6-digit) to profiles, shown on dashboard.
- New **Overview** dashboard tab: UID, total views, link clicks, top referrers, signup date.
- Per-link click tracking (`link_clicks` table + RPC).
- **Limited event badges** (seeded tags with `event_start`/`event_end` dates: summer, valentine, etc.) — auto-assigned during window.

## 8. Security Findings (all five)
1. **profiles exposed columns** → drop public SELECT on full table; create `public.profiles_public` view (security_invoker on) projecting only presentation columns (no `is_premium`, `premium_expires_at`, `view_count` raw, asset URLs become public bucket URLs — see #3 below). Base table SELECT becomes `auth.uid() = id OR has_role(auth.uid(),'admin')`.
2. **premium_codes write policies** → add explicit `INSERT/UPDATE/DELETE` policies restricted to `has_role('admin')`; redemption goes through SECURITY DEFINER RPC only.
3. **Signed URLs in public table** → switch `user-assets` to a **public bucket** (these are profile assets meant to be public anyway), store public URLs. Re-issue URLs on upload.
4 & 5. **SECURITY DEFINER executable by anon/authenticated** → `REVOKE EXECUTE ... FROM PUBLIC, anon` for admin-only functions (`generate_premium_code`, `create_tag`, `redeem_admin_master_code`); keep `redeem_premium_code` and `increment_view` callable by `authenticated`/`anon` respectively since that's intentional.

## Technical notes (DB)
New migrations:
- `profiles`: add `aliases text`, `banner_url text`, `discord_id text`, `username_effect text`, `name_gradient text[]`, `seo_title text`, `seo_description text`, `tab_icon_url text`, `cursor_effect text`, `force_tag_color text`, `hide_views boolean`, `freeze_video_last_frame boolean`, `card_width int`, `button_theme text`, `button_layout text`, `uid text unique`, `banned_at timestamptz`.
- `link_clicks(id, link_id, profile_id, created_at, country)` + insert RPC.
- `reserved_usernames(name pk, created_at)` seeded with `dashboard, admin, auth, api, settings, login, signup, linqed, www, root, support, help`.
- `tags`: add `icon_url text` (upload), `event_start timestamptz`, `event_end timestamptz`.
- View `profiles_public` for anon reads.
- Fix/rewrite `generate_premium_code` with quantity param.
- New: `ban_user(uid)`, `delete_user(uid)`, `add_views(uid,count)`, `increment_view(profile_id)` RPCs.

## Open Questions

1. **Discord bot** — do you have a Discord bot token + want me to set up a bot user, or should the "activity" just be a Discord server widget embed (no bot needed)?
2. **Storage**: switching `user-assets` to a **public bucket** is the simplest fix (assets are meant to be seen by everyone anyway). OK with that, or do you want signed-URL-on-demand instead?
3. **Music autoplay unmuted**: browsers block this universally — Chrome/Safari will mute or pause it unless the user has interacted with the page first. I'll attempt autoplay unmuted, fall back to muted-autoplay with a visible unmute button. OK?
4. **Order of work** — this is ~2–3 large turns of edits. Want me to ship it in one shot, or split into (a) bugs+security, (b) admin+premium, (c) analytics+extras?
