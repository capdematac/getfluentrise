import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, SectionLabel } from "@/components/AppShell";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { nextInterval, type Exercise } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [
      { title: "Review queue — FluentRise" },
      { name: "description", content: "Spaced repetition review of the items you got wrong or saved." },
      { property: "og:title", content: "Review queue — FluentRise" },
      { property: "og:description", content: "Revisit mistakes on a transparent spaced schedule." },
    ],
  }),
  component: ReviewPage,
});

type ReviewRow = {
  id: string;
  interval_days: number;
  reps: number;
  lapses: number;
  source: string;
  exercises: Exercise;
};

function ReviewPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);

  const { data: items, isLoading } = useQuery({
    queryKey: ["review-due", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_items")
        .select("id, interval_days, reps, lapses, source, exercises(*)")
        .lte("due_at", new Date().toISOString())
        .order("due_at")
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  if (isLoading || !items) {
    return (
      <AppShell>
        <p className="label-mono pt-8">Loading your queue…</p>
      </AppShell>
    );
  }

  const item = items[index];

  if (!item) {
    return (
      <AppShell>
        <section className="anim-fade pt-6">
          <SectionLabel>Review</SectionLabel>
          <div className="panel mt-3 p-6">
            <h1 className="font-serif text-[26px] leading-tight">Nothing due right now</h1>
            <p className="mt-2 max-w-lg text-[14px] text-ink-soft">
              Items arrive here when you answer something incorrectly or save it deliberately, and
              return on a widening schedule: 1 day, then roughly 2.3× longer each time you get it
              right, capped at 60 days.
            </p>
            <Link
              to="/path"
              className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
            >
              Continue my path
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="pt-6">
        <SectionLabel right={`${items.length} due`}>Review · {item.source === "mistake" ? "mistake" : "saved"}</SectionLabel>
        <div className="mt-6">
          <ExercisePlayer
            key={item.id}
            exercise={item.exercises}
            index={index}
            total={items.length}
            nextLabel={index + 1 === items.length ? "Finish review" : "Next"}
            onAnswered={async (correct, response) => {
              if (!user) return;
              const interval = nextInterval(item.interval_days, correct);
              const due = new Date(Date.now() + interval * 86_400_000).toISOString();
              await Promise.all([
                supabase.from("attempts").insert({
                  user_id: user.id,
                  exercise_id: item.exercises.id,
                  correct,
                  response,
                  skill: item.exercises.skill,
                  level: item.exercises.level,
                  context: "review",
                }),
                supabase
                  .from("review_items")
                  .update({
                    interval_days: interval,
                    due_at: due,
                    reps: item.reps + 1,
                    lapses: item.lapses + (correct ? 0 : 1),
                  })
                  .eq("id", item.id),
              ]);
              void queryClient.invalidateQueries({ queryKey: ["due-count"] });
            }}
            onNext={() => setIndex(index + 1)}
          />
        </div>
      </section>
    </AppShell>
  );
}
