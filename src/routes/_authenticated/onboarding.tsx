import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useProfile } from "@/hooks/useAuth";
import { GOALS } from "@/lib/cefr";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set your goal — FluentRise" },
      { name: "description", content: "Choose your English learning goal and daily study commitment." },
      { property: "og:title", content: "Set your goal — FluentRise" },
      { property: "og:description", content: "Choose a goal and daily study commitment before the placement test." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>(profile?.goal ?? "c2");
  const [minutes, setMinutes] = useState(profile?.daily_goal_minutes ?? 20);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ goal, daily_goal_minutes: minutes, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save your goal");
      return;
    }
    navigate({ to: "/placement" });
  }

  return (
    <AppShell>
      <section className="anim-fade pt-6">
        <p className="label-mono">Step {step + 1} of 3</p>

        {step === 0 ? (
          <>
            <h1 className="mt-2 max-w-xl font-serif text-[30px] leading-tight">
              Welcome. This is a platform for the last stretch of English.
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
              FluentRise is built around three things: an honest estimate of where you are, structured
              courses that go deepest at C1 and C2, and feedback that explains why an answer is the
              natural one. Your placement result is an educational estimate — never a CEFR
              certificate.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
            >
              Choose my goal
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="mt-2 font-serif text-[30px] leading-tight">What are you working towards?</h1>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {GOALS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setGoal(option.id)}
                  className={`panel p-4 text-left transition-shadow ${
                    goal === option.id ? "ring-1 ring-accent/40" : ""
                  }`}
                >
                  <p className="font-serif text-[16px]">{option.label}</p>
                  <p className="mt-1 text-[13px] text-ink-soft">{option.blurb}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
            >
              Continue
            </button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="mt-2 font-serif text-[30px] leading-tight">How much study per day?</h1>
            <p className="mt-3 max-w-lg text-[14px] text-ink-soft">
              A recommendation, not a rule. Short, regular sessions outperform long, rare ones — but
              nothing here punishes a missed day.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[10, 20, 30, 45].map((option) => (
                <button
                  key={option}
                  onClick={() => setMinutes(option)}
                  className={`rounded-full px-4 py-2 text-[14px] font-medium ${
                    minutes === option ? "bg-ink text-paper" : "text-ink-soft ring-1 ring-ink/10"
                  }`}
                >
                  {option} min
                </button>
              ))}
            </div>
            <button
              onClick={save}
              disabled={busy}
              className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground disabled:opacity-50"
            >
              Start the placement test
            </button>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
