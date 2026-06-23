import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LinkPagePreview } from "@/components/link-page-preview";
import type { Profile, LinkRow, Tag } from "@/lib/link-page";

const profileQuery = (username: string) =>
  queryOptions({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { data: profile, error } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!profile || !profile.id) throw notFound();
      const profileId = profile.id as string;
      const { data: links } = await supabase
        .from("links")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_visible", true)
        .order("position", { ascending: true });
      const { data: ptags } = await supabase
        .from("profile_tags")
        .select("hidden, tag:tags(*)")
        .eq("profile_id", profileId)
        .eq("hidden", false);
      const tags: Tag[] = ((ptags ?? []) as { tag: Tag }[]).map((r) => r.tag).filter(Boolean);
      return { profile: profile as unknown as Profile, links: (links ?? []) as LinkRow[], tags };
    },
  });

export const Route = createFileRoute("/$username")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(profileQuery(params.username)),
  head: ({ params, loaderData }) => {
    const p = (loaderData as { profile?: Profile } | undefined)?.profile;
    const title = (p?.is_premium && p?.seo_title) || p?.page_title || `@${params.username}`;
    const desc = (p?.is_premium && p?.seo_description) || p?.page_description || `${params.username}'s links on Linqed.`;
    const icon = (p?.is_premium && p?.tab_icon_url) || p?.avatar_url || null;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        ...(icon ? [{ property: "og:image", content: icon }] : []),
      ],
      links: icon ? [{ rel: "icon", href: icon }] : [],
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
    if (typeof window === "undefined" || !data?.profile?.id) return;
    const key = `linq_v_${data.profile.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    supabase.rpc("increment_view", { _profile_id: data.profile.id }).then(() => {});
  }, [data?.profile?.id]);
  function onLinkClick(linkId: string) {
    supabase.from("link_clicks").insert({ link_id: linkId, profile_id: data.profile.id }).then(() => {});
  }
  return (
    <LinkPagePreview profile={data.profile} links={data.links} tags={data.tags} onLinkClick={onLinkClick} />
  );
}