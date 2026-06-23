import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Link2, Palette, Zap, Lock, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linqed — one link for everything you are" },
      { name: "description", content: "Minimal, fast link-in-bio. Claim your username and share one URL." },
      { property: "og:title", content: "Linqed — one link for everything you are" },
      { property: "og:description", content: "Minimal, fast link-in-bio. Claim your username and share one URL." },
    ],
  }),
  component: Index,
});

function Index() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground noise">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-mono text-lg font-semibold tracking-tight">
          linqed<span className="text-muted-foreground">/</span>
        </Link>
        <nav className="flex items-center gap-2 font-mono text-sm">
          {authed ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-foreground px-3 py-1.5 text-background hover:opacity-90"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/auth" className="rounded-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">
                sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-sm border border-border bg-foreground px-3 py-1.5 text-background hover:opacity-90"
              >
                claim yours →
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-24 md:py-36">
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            One link. <span className="text-muted-foreground">Everything you are.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            A minimal link-in-bio for people who hate clutter. Pick a username, drop your links, customise the page, share one URL.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            {authed ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-sm font-medium text-background transition hover:opacity-90"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group inline-flex items-center justify-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-sm font-medium text-background transition hover:opacity-90"
              >
                Create your page
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            )}
            <Link
              to="/$username"
              params={{ username: "demo" }}
              className="inline-flex items-center justify-center rounded-sm border border-border px-5 py-3 font-mono text-sm text-foreground hover:bg-card"
            >
              See an example →
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
          {[
            { icon: Link2, title: "Unlimited links", text: "Add, reorder, hide — no caps, no tiers." },
            { icon: Palette, title: "Yours to style", text: "Colors, fonts, button styles. Mono by default." },
            { icon: Zap, title: "Loads instant", text: "Static-feeling pages, edge-served." },
            { icon: Lock, title: "You own it", text: "Your data, your username. Delete anytime." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-background p-6">
              <Icon className="mb-4 h-5 w-5" />
              <h3 className="font-mono text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section className="py-24">
          <div className="rounded-md border border-border bg-card p-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready in 60 seconds.
            </h2>
            <p className="mt-3 text-muted-foreground">No tutorials. No upsells. Just a page.</p>
            <Link
              to={authed ? "/dashboard" : "/auth"}
              search={authed ? undefined : { mode: "signup" }}
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-foreground px-5 py-3 font-mono text-sm text-background hover:opacity-90"
            >
              {authed ? "Open your dashboard" : "Claim your username"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-border px-6 py-8 font-mono text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Linqed</span>
          <span>Fully Vibe-Coded ⚡</span>
        </div>
      </footer>
    </div>
  );
}
