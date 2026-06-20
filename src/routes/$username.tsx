import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LinkPagePreview } from "@/components/link-page-preview";
import type { Profile, LinkRow } from "@/lib/link-page";

const profileQuery = (username: string) =>
  queryOptions({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!profile) throw notFound();
      const { data: links } = await supabase
        .from("links")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("is_visible", true)
        .order("position", { ascending: true });
      return { profile: profile as Profile, links: (links ?? []) as LinkRow[] };
    },
  });

export const Route = createFileRoute("/$username")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(profileQuery(params.username)),
  head: ({ params, loaderData }) => {
    const p = (loaderData as { profile?: Profile } | undefined)?.profile;
    const title = p?.page_title || `@${params.username} — linq`;
    const desc = p?.page_description || `${params.username}'s links on linq.site.je.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  component: PublicProfile,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold">Username not found</h1>
        <a href="/" className="mt-4 inline-block font-mono text-sm text-muted-foreground hover:text-foreground">← home</a>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-muted-foreground">Could not load this page.</p>
    </div>
  ),
});

function PublicProfile() {
  const { username } = Route.useParams();
  const { data } = useSuspenseQuery(profileQuery(username));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `linq_viewed_${data.profile.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.rpc("increment" as never, {}).catch(() => {});
    // Best-effort increment via direct update (RLS allows public SELECT only; use a fire-and-forget upsert via edge would be cleaner).
    supabase
      .from("profiles")
      .update({ view_count: data.profile.view_count + 1 })
      .eq("id", data.profile.id)
      .then(() => {});
  }, [data.profile.id, data.profile.view_count]);
  return (
    <div className="min-h-screen">
      <LinkPagePreview profile={data.profile} links={data.links} />
    </div>
  );
}