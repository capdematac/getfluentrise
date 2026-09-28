import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — FluentRise" },
      { name: "description", content: "Sign in or create a FluentRise account to track your advanced English progress." },
      { property: "og:title", content: "Sign in — FluentRise" },
      { property: "og:description", content: "Sign in to continue your B2–C2 English path." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(8, { message: "Use at least 8 characters" }).max(72),
  displayName: z.string().trim().max(60).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.displayName || parsed.data.email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-[19px] font-semibold tracking-tight">FluentRise</span>
          <span className="label-mono">Advanced</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        {checkEmail ? (
          <div className="panel anim-fade p-6">
            <p className="label-mono">Confirm your email</p>
            <h1 className="mt-2 font-serif text-2xl">Check your inbox</h1>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              We sent a confirmation link to {email}. Open it and you'll be signed in, ready for the
              placement test.
            </p>
          </div>
        ) : (
          <div className="panel anim-fade p-6">
            <p className="label-mono">{mode === "signin" ? "Welcome back" : "Create your account"}</p>
            <h1 className="mt-2 font-serif text-2xl">
              {mode === "signin" ? "Sign in to continue" : "Start at your real level"}
            </h1>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              {mode === "signup" ? (
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full rounded-md bg-paper px-4 py-3 text-[14px] ring-1 ring-ink/10 outline-none focus:ring-accent/40"
                />
              ) : null}
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                className="w-full rounded-md bg-paper px-4 py-3 text-[14px] ring-1 ring-ink/10 outline-none focus:ring-accent/40"
              />
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                maxLength={72}
                className="w-full rounded-md bg-paper px-4 py-3 text-[14px] ring-1 ring-ink/10 outline-none focus:ring-accent/40"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-accent py-2.5 text-[14px] font-medium text-accent-foreground disabled:opacity-50"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGoogle}
              className="mt-3 w-full rounded-full py-2.5 text-[14px] font-medium text-ink ring-1 ring-ink/10"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 w-full font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
            >
              {mode === "signin" ? "No account yet? Create one" : "Already registered? Sign in"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
