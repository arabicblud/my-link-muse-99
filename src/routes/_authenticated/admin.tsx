import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Shield, Copy, Trash2, Plus } from "lucide-react";
import type { Tag } from "@/lib/link-page";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — linq" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setUserId(data.user.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin");
      setIsAdmin((roles ?? []).length > 0);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return <UnlockGate onUnlocked={() => setIsAdmin(true)} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4" />
            <h1 className="font-mono text-sm font-semibold">admin / linq</h1>
          </div>
          <Link to="/dashboard" className="font-mono text-xs text-muted-foreground hover:text-foreground">
            ← dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="users">
          <TabsList className="font-mono">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="codes">Premium codes</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersTable userId={userId!} /></TabsContent>
          <TabsContent value="codes" className="mt-4"><CodesPanel /></TabsContent>
          <TabsContent value="tags" className="mt-4"><TagsPanel /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function UnlockGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_admin_master_code", { _code: code.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast.error(res?.error ?? "Invalid code");
    toast.success("Admin unlocked");
    onUnlocked();
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-md border border-border bg-card p-6">
        <Shield className="h-5 w-5" />
        <h1 className="mt-2 text-lg font-semibold">Admin unlock</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Enter the master code to gain admin access.
        </p>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="master code"
          className="mt-4 font-mono"
          autoFocus
        />
        <Button type="submit" className="mt-3 w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlock"}
        </Button>
      </form>
    </div>
  );
}

function UsersTable({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, view_count, is_premium, premium_expires_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const tagsQ = useQuery({
    queryKey: ["all-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      return (data ?? []) as Tag[];
    },
  });

  const ptQ = useQuery({
    queryKey: ["all-profile-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("profile_tags").select("profile_id, tag_id");
      return data ?? [];
    },
  });

  async function toggleTag(profileId: string, tagId: string, has: boolean) {
    if (has) {
      const { error } = await supabase.from("profile_tags").delete().eq("profile_id", profileId).eq("tag_id", tagId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("profile_tags").insert({ profile_id: profileId, tag_id: tagId });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["all-profile-tags"] });
  }

  async function grantLifetime(uid: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: true, premium_expires_at: null })
      .eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success("Granted");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }
  async function revoke(uid: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: false, premium_expires_at: null })
      .eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (usersQ.isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  const users = usersQ.data ?? [];
  const tags = tagsQ.data ?? [];
  const pt = ptQ.data ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={users.length} accent="text-blue-400" />
        <Stat label="Premium" value={users.filter((u) => u.is_premium).length} accent="text-yellow-400" />
        <Stat label="Tags" value={tags.length} accent="text-purple-400" />
        <Stat label="You" value={`@${users.find((u) => u.id === userId)?.username ?? ""}`} accent="text-green-400" />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/30 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Views</th>
              <th className="px-4 py-2 text-left">Premium</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2 text-left">Joined</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userTags = pt.filter((r) => r.profile_id === u.id).map((r) => r.tag_id);
              return (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-mono">@{u.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.view_count}</td>
                  <td className="px-4 py-3">
                    {u.is_premium ? (
                      <span className="font-mono text-xs text-yellow-400">
                        ★ {u.premium_expires_at ? new Date(u.premium_expires_at).toLocaleDateString() : "lifetime"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => {
                        const has = userTags.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            onClick={() => toggleTag(u.id, t.id, has)}
                            className="rounded-full border px-2 py-0.5 font-mono text-[10px] transition"
                            style={{
                              color: has ? t.color : "#888",
                              borderColor: has ? t.color + "88" : "#333",
                              backgroundColor: has ? t.color + "22" : "transparent",
                            }}
                          >
                            {t.name}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {u.is_premium ? (
                        <Button size="sm" variant="outline" onClick={() => revoke(u.id)}>Revoke</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => grantLifetime(u.id)}>Grant ∞</Button>
                      )}
                      <a href={`/${u.username}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost">View</Button>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function CodesPanel() {
  const qc = useQueryClient();
  const [duration, setDuration] = useState<string>("30");
  const codesQ = useQuery({
    queryKey: ["admin-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_codes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const gen = useMutation({
    mutationFn: async () => {
      const dur = duration === "lifetime" ? null : parseInt(duration, 10);
      const { data, error } = await supabase.rpc("generate_premium_code", { _duration_days: dur as number });
      if (error) throw error;
      return data as { ok: boolean; code?: string };
    },
    onSuccess: (d) => {
      if (!d?.ok) return toast.error("Could not generate");
      toast.success(`Generated ${d.code}`);
      qc.invalidateQueries({ queryKey: ["admin-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const presets = [
    { v: "7", l: "1 week" },
    { v: "30", l: "1 month" },
    { v: "90", l: "3 months" },
    { v: "365", l: "1 year" },
    { v: "lifetime", l: "Lifetime" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <Label className="font-mono text-xs">Generate code</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.v}
              onClick={() => setDuration(p.v)}
              className={`rounded-sm border px-3 py-1.5 font-mono text-xs ${
                duration === p.v ? "border-foreground bg-foreground/10" : "border-border"
              }`}
            >
              {p.l}
            </button>
          ))}
        </div>
        <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="mt-3">
          {gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/30 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Duration</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {(codesQ.data ?? []).map((c) => (
              <tr key={c.code} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {c.duration_days ? `${c.duration_days}d` : "lifetime"}
                </td>
                <td className="px-4 py-2">
                  {c.used_by ? (
                    <span className="font-mono text-xs text-muted-foreground">used</span>
                  ) : (
                    <span className="font-mono text-xs text-green-400">available</span>
                  )}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  {!c.used_by && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(c.code);
                        toast.success("Copied");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagsPanel() {
  const qc = useQueryClient();
  const tagsQ = useQuery({
    queryKey: ["all-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("*").order("name");
      return (data ?? []) as Tag[];
    },
  });
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [icon, setIcon] = useState("");
  const [desc, setDesc] = useState("");

  async function create() {
    if (!slug || !name) return toast.error("Slug and name required");
    const { data, error } = await supabase.rpc("create_tag", {
      _slug: slug, _name: name, _color: color, _icon: icon || "", _description: desc || "",
    });
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast.error(res?.error ?? "Could not create");
    toast.success("Tag created");
    setSlug(""); setName(""); setIcon(""); setDesc("");
    qc.invalidateQueries({ queryKey: ["all-tags"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this tag?")) return;
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["all-tags"] });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4">
        <Label className="font-mono text-xs">Create tag</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 p-1" />
          <Input placeholder="icon (optional)" value={icon} onChange={(e) => setIcon(e.target.value)} />
          <Button onClick={create}><Plus className="h-4 w-4" /> Create</Button>
        </div>
        <Input placeholder="description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-2" />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {(tagsQ.data ?? []).map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
              <span className="font-mono text-sm">{t.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{t.slug}</span>
            </div>
            <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}