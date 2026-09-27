import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useIsAdmin, useProfile } from "@/hooks/useAuth";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", label: "Console" },
  { to: "/path", label: "Path" },
  { to: "/review", label: "Review" },
  { to: "/notebook", label: "Notebook" },
  { to: "/tutor", label: "Tutor" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initial = (profile?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-baseline gap-2">
              <span className="font-serif text-[19px] font-semibold tracking-tight">FluentRise</span>
              <span className="label-mono">Advanced</span>
            </Link>
            <div className="flex items-center gap-2">
              {profile?.estimated_level ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
                  {profile.estimated_level}
                </span>
              ) : null}
              <span className="grid size-7 place-items-center rounded-full bg-ink font-mono text-[11px] text-paper">
                {initial}
              </span>
              <button
                onClick={signOut}
                className="rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="mt-4 -mx-1 flex gap-1 overflow-x-auto px-1 text-[13px] font-medium">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="shrink-0 rounded-full px-3 py-1.5 text-ink-soft transition-colors hover:text-ink"
                activeProps={{ className: "shrink-0 rounded-full px-3 py-1.5 bg-ink text-paper" }}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                to="/admin"
                className="shrink-0 rounded-full px-3 py-1.5 text-ink-soft transition-colors hover:text-ink"
                activeProps={{ className: "shrink-0 rounded-full px-3 py-1.5 bg-ink text-paper" }}
              >
                Content
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-24">{children}</main>
    </div>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="label-mono">{children}</p>
      {right ? <span className="font-mono text-[11px] text-ink-soft">{right}</span> : null}
    </div>
  );
}

export function LevelChip({ level, tone = "line" }: { level: string; tone?: "line" | "accent" | "correct" }) {
  const tones: Record<string, string> = {
    line: "bg-line text-ink-soft",
    accent: "bg-accent-soft text-accent",
    correct: "bg-correct-soft text-correct",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${tones[tone]}`}>{level}</span>
  );
}
