import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { LinkPagePreview } from "@/components/link-page-preview";
import { AssetUpload } from "@/components/asset-upload";
import {
  FONT_OPTIONS,
  BUTTON_STYLES,
  THEME_PRESETS,
  BACKGROUND_EFFECTS,
  ENTRANCE_ANIMATIONS,
  type Profile,
  type LinkRow,
  type Tag,
} from "@/lib/link-page";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, LogOut, Copy, Sparkles, Lock, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — linq" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
      if (!data.user) navigate({ to: "/auth", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const profileQ = useQuery({
    enabled: !!userId,
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const linksQ = useQuery({
    enabled: !!userId,
    queryKey: ["my-links", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("profile_id", userId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const adminQ = useQuery({
    enabled: !!userId,
    queryKey: ["is-admin", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin");
      return (data ?? []).length > 0;
    },
  });

  const tagsQ = useQuery({
    enabled: !!userId,
    queryKey: ["my-tags", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_tags")
        .select("hidden, tag:tags(*)")
        .eq("profile_id", userId!);
      if (error) throw error;
      return ((data ?? []) as { hidden: boolean; tag: Tag }[]).filter((r) => r.tag);
    },
  });

  if (!authReady || !userId || profileQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Onboarding: pick username if missing
  if (!profileQ.data) {
    return <UsernameSetup userId={userId} onDone={() => profileQ.refetch()} />;
  }

  const profile = profileQ.data;
  const links = linksQ.data ?? [];
  const visibleTagsForPreview = (tagsQ.data ?? []).filter((r) => !r.hidden).map((r) => r.tag);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-mono text-base font-semibold">
              linq<span className="text-muted-foreground">/</span>
            </Link>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              linq.site.je/{profile.username}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            {adminQ.data && (
              <Link to="/admin">
                <Button size="sm" variant="outline">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + "/" + profile.username);
                toast.success("Link copied");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_400px]">
        <div>
          <Tabs defaultValue="links">
            <TabsList className="font-mono">
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="customize">Customize</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="premium">
                <Sparkles className="mr-1 h-3 w-3" /> Premium
              </TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="mt-4">
              <LinksEditor profileId={userId} links={links} onChange={() => linksQ.refetch()} />
            </TabsContent>
            <TabsContent value="profile" className="mt-4">
              <ProfileEditor profile={profile} onSaved={() => profileQ.refetch()} userId={userId} />
            </TabsContent>
            <TabsContent value="theme" className="mt-4">
              <ThemeEditor profile={profile} onSaved={() => profileQ.refetch()} />
            </TabsContent>
            <TabsContent value="customize" className="mt-4">
              <CustomizeEditor profile={profile} onSaved={() => profileQ.refetch()} userId={userId} />
            </TabsContent>
            <TabsContent value="tags" className="mt-4">
              <TagsToggle profileTags={tagsQ.data ?? []} onChange={() => tagsQ.refetch()} userId={userId} />
            </TabsContent>
            <TabsContent value="premium" className="mt-4">
              <PremiumPanel profile={profile} onChange={() => profileQ.refetch()} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">Live preview</div>
          <div className="overflow-hidden rounded-md border border-border" style={{ aspectRatio: "9/16" }}>
            <div className="h-full overflow-auto">
              <LinkPagePreview profile={profile} links={links.filter((l) => l.is_visible)} tags={visibleTagsForPreview} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UsernameSetup({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [username, setUsername] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("linq_pending_username") ?? "";
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9_-]{2,32}$/.test(username)) {
      toast.error("Username: 2–32 chars, lowercase, numbers, _ or -");
      return;
    }
    setLoading(true);
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existing) {
      toast.error("Taken.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.from("profiles").insert({ id: userId, username, display_name: username });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Username claimed.");
    window.localStorage.removeItem("linq_pending_username");
    onDone();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-md border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Pick a username</h1>
        <p className="mt-1 text-sm text-muted-foreground">This will be your public URL.</p>
        <div className="mt-5 flex items-center rounded-sm border border-input bg-background">
          <span className="pl-3 font-mono text-sm text-muted-foreground">linq.site.je/</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="yourname"
            className="w-full bg-transparent px-1 py-2 font-mono text-sm outline-none"
            required
          />
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
}

function ProfileEditor({ profile, onSaved, userId }: { profile: Profile; onSaved: () => void; userId: string }) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [location, setLocation] = useState(profile.location ?? "");

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, bio, avatar_url: avatar || null, location: location || null })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-md border border-border bg-card p-6">
      <div className="space-y-4">
        <div>
          <Label className="font-mono text-xs">Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="font-mono text-xs">Avatar</Label>
          <div className="mt-1">
            <AssetUpload
              userId={userId} kind="avatar" value={avatar || null}
              onChange={(u) => setAvatar(u ?? "")}
              accept="image/*,.gif" label="Profile picture (image / gif)"
            />
          </div>
        </div>
        <div>
          <Label className="font-mono text-xs">Location (optional)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Paris, FR" className="mt-1" />
        </div>
        <div>
          <Label className="font-mono text-xs">Bio</Label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1" />
        </div>
        <Button onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

function ThemeEditor({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [bg, setBg] = useState(profile.background_color);
  const [text, setText] = useState(profile.text_color);
  const [accent, setAccent] = useState(profile.accent_color);
  const [font, setFont] = useState(profile.font_family);
  const [btn, setBtn] = useState(profile.button_style);

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          background_color: bg,
          text_color: text,
          accent_color: accent,
          font_family: font,
          button_style: btn,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Theme saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function applyPreset(p: (typeof THEME_PRESETS)[number]) {
    setBg(p.bg);
    setText(p.text);
    setAccent(p.accent);
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-6">
      <div>
        <Label className="font-mono text-xs">Presets</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 font-mono text-xs hover:bg-accent"
            >
              <span className="h-3 w-3 rounded-full border border-border" style={{ background: p.bg }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ColorPicker label="Background" value={bg} onChange={setBg} />
        <ColorPicker label="Text" value={text} onChange={setText} />
        <ColorPicker label="Accent" value={accent} onChange={setAccent} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="font-mono text-xs">Font</Label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value)}
            className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="font-mono text-xs">Button style</Label>
          <select
            value={btn}
            onChange={(e) => setBtn(e.target.value)}
            className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
          >
            {BUTTON_STYLES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save theme"}
      </Button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="font-mono text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-2 rounded-sm border border-input bg-background p-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-sm border-0 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-xs outline-none"
        />
      </div>
    </div>
  );
}

function CustomizeEditor({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [typewriter, setTypewriter] = useState(profile.typewriter_enabled);
  const [pageTitle, setPageTitle] = useState(profile.page_title ?? "");
  const [pageDesc, setPageDesc] = useState(profile.page_description ?? "");
  const [bgImage, setBgImage] = useState(profile.background_image_url ?? "");
  const [audio, setAudio] = useState(profile.audio_url ?? "");
  const [cursor, setCursor] = useState(profile.cursor_url ?? "");
  const [effect, setEffect] = useState(profile.background_effect);
  const [anim, setAnim] = useState(profile.entrance_animation);
  const [opacity, setOpacity] = useState(profile.card_opacity);
  const [blur, setBlur] = useState(profile.card_blur);
  const [glow, setGlow] = useState(profile.icon_glow_color ?? "");
  const [showViews, setShowViews] = useState(profile.show_views);

  const premium = profile.is_premium;

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          tagline: tagline || null,
          typewriter_enabled: typewriter,
          page_title: pageTitle || null,
          page_description: pageDesc || null,
          background_image_url: premium ? bgImage || null : null,
          audio_url: premium ? audio || null : null,
          cursor_url: premium ? cursor || null : null,
          background_effect: effect,
          entrance_animation: anim,
          card_opacity: opacity,
          card_blur: premium ? blur : 0,
          icon_glow_color: premium ? glow || null : null,
          show_views: showViews,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 rounded-md border border-border bg-card p-6">
      <Section title="Page metadata">
        <Field label="Page title (browser tab)">
          <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="@yourname — links" />
        </Field>
        <Field label="Page description (SEO)">
          <Input value={pageDesc} onChange={(e) => setPageDesc(e.target.value)} />
        </Field>
      </Section>

      <Section title="Tagline">
        <Field label="Tagline (under your name)">
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="building things" />
        </Field>
        <label className="flex items-center gap-2 font-mono text-xs">
          <Switch checked={typewriter} onCheckedChange={setTypewriter} /> Typewriter effect
        </label>
      </Section>

      <Section title="Effects">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Background effect">
            <select value={effect} onChange={(e) => setEffect(e.target.value)} className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
              {BACKGROUND_EFFECTS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Entrance animation">
            <select value={anim} onChange={(e) => setAnim(e.target.value)} className="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm">
              {ENTRANCE_ANIMATIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label={`Card opacity — ${opacity}%`}>
          <input type="range" min={20} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full" />
        </Field>
        <label className="flex items-center gap-2 font-mono text-xs">
          <Switch checked={showViews} onCheckedChange={setShowViews} /> Show view counter
        </label>
      </Section>

      <Section title={<span className="flex items-center gap-2">Premium customization {!premium && <Lock className="h-3 w-3" />}</span>}>
        {!premium && (
          <p className="rounded-sm border border-dashed border-border p-3 font-mono text-xs text-muted-foreground">
            Unlock with a premium code in the Premium tab.
          </p>
        )}
        <Field label="Background image URL">
          <Input disabled={!premium} value={bgImage} onChange={(e) => setBgImage(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Profile audio URL (mp3)">
          <Input disabled={!premium} value={audio} onChange={(e) => setAudio(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Custom cursor URL (png 32×32)">
          <Input disabled={!premium} value={cursor} onChange={(e) => setCursor(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label={`Card blur — ${blur}px`}>
          <input disabled={!premium} type="range" min={0} max={20} value={blur} onChange={(e) => setBlur(+e.target.value)} className="w-full" />
        </Field>
        <Field label="Avatar glow color">
          <Input disabled={!premium} value={glow} onChange={(e) => setGlow(e.target.value)} placeholder="#ff00aa" />
        </Field>
      </Section>

      <Button onClick={() => m.mutate()} disabled={m.isPending}>
        {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save customization"}
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="font-mono text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PremiumPanel({ profile, onChange }: { profile: Profile; onChange: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function redeem() {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_premium_code", { _code: code.trim() });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { ok: boolean; error?: string };
    if (!result?.ok) {
      const map: Record<string, string> = {
        invalid_code: "Invalid code.",
        already_used: "This code has already been redeemed.",
        not_authenticated: "Sign in required.",
      };
      toast.error(map[result?.error ?? ""] ?? "Could not redeem code.");
      return;
    }
    toast.success("Premium unlocked ✨");
    setCode("");
    onChange();
  }

  if (profile.is_premium) {
    return (
      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold">You're Premium</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          All premium customization options are unlocked. Open the Customize tab to use them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Unlock Premium</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Background images, profile audio, custom cursors, card blur, avatar glow.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          placeholder="LINQ-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono"
        />
        <Button onClick={redeem} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
        </Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        Codes are single-use. Once redeemed they can't be used again.
      </p>
    </div>
  );
}

function LinksEditor({
  profileId,
  links,
  onChange,
}: {
  profileId: string;
  links: LinkRow[];
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  async function add() {
    if (!title || !url) {
      toast.error("Title and URL required");
      return;
    }
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
    const { error } = await supabase
      .from("links")
      .insert({ profile_id: profileId, title, url: finalUrl, position: links.length });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setUrl("");
    onChange();
  }

  async function update(id: string, patch: Partial<LinkRow>) {
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else onChange();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) toast.error(error.message);
    else onChange();
  }

  async function move(idx: number, dir: -1 | 1) {
    const other = idx + dir;
    if (other < 0 || other >= links.length) return;
    const a = links[idx];
    const b = links[other];
    await Promise.all([
      supabase.from("links").update({ position: b.position }).eq("id", a.id),
      supabase.from("links").update({ position: a.position }).eq("id", b.id),
    ]);
    onChange();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Title (e.g. Twitter)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={add}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="space-y-2">
        {links.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-8 text-center font-mono text-sm text-muted-foreground">
            No links yet. Add your first one above.
          </p>
        )}
        {links.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2 rounded-md border border-border bg-card p-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground" disabled={i === 0}>
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground" disabled={i === links.length - 1}>
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid flex-1 gap-1 sm:grid-cols-2">
              <Input
                value={l.title}
                onChange={(e) => update(l.id, { title: e.target.value })}
                onBlur={(e) => update(l.id, { title: e.target.value })}
                className="h-8"
              />
              <Input
                value={l.url}
                onChange={(e) => update(l.id, { url: e.target.value })}
                onBlur={(e) => update(l.id, { url: e.target.value })}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={l.is_visible} onCheckedChange={(v) => update(l.id, { is_visible: v })} />
              <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}