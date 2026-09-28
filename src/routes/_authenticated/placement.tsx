import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, SectionLabel } from "@/components/AppShell";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { estimatePlacement, type Exercise, type PlacementAttempt } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/placement")({
  head: () => ({
    meta: [
      { title: "Placement test — FluentRise" },
      {
        name: "description",
        content: "A multi-skill English placement test estimating your CEFR band from A1 to C2.",
      },
      { property: "og:title", content: "Placement test — FluentRise" },
      { property: "og:description", content: "Estimate your level across grammar, vocabulary, reading and use of English." },
    ],
  }),
  component: Placement,
});

function Placement() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<PlacementAttempt[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["placement-bank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_placement", true)
        .eq("status", "published")
        .order("position");
      if (error) throw error;
      return data as Exercise[];
    },
  });

  async function finish(finalAttempts: PlacementAttempt[]) {
    if (!user) return;
    setSaving(true);
    const estimate = estimatePlacement(finalAttempts);
    const { error } = await supabase.from("placement_results").insert({
      user_id: user.id,
      overall: estimate.overall,
      confidence: estimate.confidence,
      per_skill: estimate.perSkill,
      strengths: estimate.strengths,
      weaknesses: estimate.weaknesses,
    });
    if (error) {
      setSaving(false);
      toast.error("Could not save your result");
      return;
    }
    await supabase
      .from("profiles")
      .update({
        estimated_level: estimate.overall,
        confidence: estimate.confidence,
        onboarded: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    navigate({ to: "/results" });
  }

  if (isLoading || !exercises) {
    return (
      <AppShell>
        <p className="label-mono pt-8">Loading the test…</p>
      </AppShell>
    );
  }

  const exercise = exercises[index];
  const progress = Math.round((index / exercises.length) * 100);

  return (
    <AppShell>
      <section className="pt-6">
        <SectionLabel right={`${progress}%`}>Placement · adaptive bands A1–C2</SectionLabel>
        <div className="mt-3 h-1.5 rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>

        {saving ? (
          <p className="label-mono mt-8">Estimating your level…</p>
        ) : exercise ? (
          <div className="mt-6">
            <ExercisePlayer
              key={exercise.id}
              exercise={exercise}
              index={index}
              total={exercises.length}
              hideFeedback
              nextLabel={index + 1 === exercises.length ? "See my estimate" : "Next question"}
              onAnswered={async (correct, response) => {
                const attempt: PlacementAttempt = {
                  level: exercise.level,
                  skill: exercise.skill,
                  correct,
                };
                setAttempts((previous) => [...previous, attempt]);
                if (user) {
                  await supabase.from("attempts").insert({
                    user_id: user.id,
                    exercise_id: exercise.id,
                    correct,
                    response,
                    skill: exercise.skill,
                    level: exercise.level,
                    context: "placement",
                  });
                }
              }}
              onNext={() => {
                if (index + 1 === exercises.length) {
                  void finish(attempts);
                } else {
                  setIndex(index + 1);
                }
              }}
            />
          </div>
        ) : null}

        <p className="mt-8 max-w-xl text-[12px] leading-relaxed text-ink-faint">
          The test mixes grammar, vocabulary, use of English, reading inference and register judgement
          across six difficulty bands. The result is an educational estimate of your level, not an
          official CEFR qualification.
        </p>
      </section>
    </AppShell>
  );
}
