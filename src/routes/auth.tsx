import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — linq" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!/^[a-z0-9_-]{2,32}$/.test(username)) {
          toast.error("Username must be 2–32 chars, lowercase letters, numbers, _ or -");
          setLoading(false);
          return;
        }
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();
        if (existing) {
          toast.error("That username is taken.");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { username, display_name: username },
          },
        });
        if (error) throw error;
        if (data.session && data.user) {
          const { error: pErr } = await supabase.from("profiles").insert({
            id: data.user.id,
            username,
            display_name: username,
          });
          if (pErr) throw pErr;
          toast.success("Account created. Welcome.");
          router.invalidate();
          navigate({ to: "/dashboard", replace: true });
        } else {
          window.localStorage.setItem("linq_pending_username", username);
          toast.success("Account created. Check your email, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        router.invalidate();
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (res.error) {
      toast.error("Google sign-in failed.");
      setOauthLoading(false);
      return;
    }
    if (res.redirected) return;
    router.invalidate();
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 noise">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-10 block text-center font-mono text-lg font-semibold">
          linq<span className="text-muted-foreground">/</span>
        </Link>

        <div className="rounded-md border border-border bg-card p-6">
          <h1 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
            {mode === "signin" ? "sign in" : "create account"}
          </h1>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Claim your username"}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={handleGoogle}
            disabled={oauthLoading}
          >
            {oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="username" className="font-mono text-xs">username</Label>
                <div className="mt-1 flex items-center rounded-sm border border-input bg-background">
                  <span className="pl-3 font-mono text-sm text-muted-foreground">linq.lol/</span>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="yourname"
                    required
                    className="w-full bg-transparent px-1 py-2 font-mono text-sm outline-none"
                  />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email" className="font-mono text-xs">email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-mono text-xs">password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "No account? Create one →" : "Already have one? Sign in →"}
          </button>
        </div>

        <Link to="/" className="mt-6 block text-center font-mono text-xs text-muted-foreground hover:text-foreground">
          ← back home
        </Link>
      </div>
    </div>
  );
}