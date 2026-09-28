import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, SectionLabel } from "@/components/AppShell";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { accuracy, type Exercise } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — FluentRise" },
      { name: "description", content: "Work through a FluentRise lesson with per-answer explanations and CEFR tags." },
      { property: "og:title", content: "Lesson — FluentRise" },
      { property: "og:description", content: "Interactive exercises with precise feedback and saved mistakes." },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const [lesson, exercises] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, title, summary, est_minutes, modules(title, level, objective)")
          .eq("id", lessonId)
          .maybeSingle(),
        supabase
          .from("exercises")
          .select("*")
          .eq("lesson_id", lessonId)
          .eq("status", "published")
          .order("position"),
      ]);
      if (lesson.error) throw lesson.error;
      if (exercises.error) throw exercises.error;
      return { lesson: lesson.data, exercises: (exercises.data ?? []) as Exercise[] };
    },
  });

  async function saveForReview(exercise: Exercise) {
    if (!user) return;
    const { error } = await supabase.from("review_items").insert({
      user_id: user.id,
      exercise_id: exercise.id,
      source: "saved",
      due_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Could not save this item");
      return;
    }
    setSaved((previous) => ({ ...previous, [exercise.id]: true }));
    toast.success("Saved to your review queue");
  }

  async function completeLesson(finalScore: { correct: number; total: number }) {
    if (!user) return;
    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        accuracy: accuracy(finalScore.correct, finalScore.total),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
    void queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
    setFinished(true);
  }

  if (isLoading || !data) {
    return (
      <AppShell>
        <p className="label-mono pt-8">Loading lesson…</p>
      </AppShell>
    );
  }

  const { lesson, exercises } = data;
  if (!lesson || exercises.length === 0) {
    return (
      <AppShell>
        <div className="panel mt-6 p-6">
          <p className="label-mono">Empty lesson</p>
          <h1 className="mt-2 font-serif text-2xl">No published exercises here yet</h1>
          <Link to="/path" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
            Back to the path
          </Link>
        </div>
      </AppShell>
    );
  }

  if (finished) {
    const percent = accuracy(score.correct, score.total);
    return (
      <AppShell>
        <section className="anim-fade pt-6">
          <SectionLabel>Lesson complete</SectionLabel>
          <div className="panel mt-3 p-6">
            <h1 className="font-serif text-[28px] leading-tight">{lesson.title}</h1>
            <p className="mt-3 font-serif text-[40px] leading-none">{percent}%</p>
            <p className="mt-2 text-[13px] text-ink-soft">
              {score.correct} of {score.total} correct. Items you missed are queued for spaced review.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/path"
                className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
              >
                Back to path
              </Link>
              <button
                onClick={() => navigate({ to: "/review" })}
                className="rounded-full px-5 py-2.5 text-[14px] font-medium text-ink ring-1 ring-ink/10"
              >
                Review mistakes
              </button>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  const exercise = exercises[index];

  return (
    <AppShell>
      <section className="pt-6">
        <SectionLabel right={lesson.modules?.level}>{lesson.modules?.title}</SectionLabel>
        <h1 className="mt-2 font-serif text-[24px] leading-tight">{lesson.title}</h1>
        {exercise?.objective ? (
          <p className="mt-1 text-[12px] text-ink-faint">Objective — {exercise.objective}</p>
        ) : null}

        <div className="mt-4 h-1.5 rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${Math.round((index / exercises.length) * 100)}%` }}
          />
        </div>

        {exercise ? (
          <div className="mt-6">
            <ExercisePlayer
              key={exercise.id}
              exercise={exercise}
              index={index}
              total={exercises.length}
              saved={saved[exercise.id]}
              onSave={() => void saveForReview(exercise)}
              nextLabel={index + 1 === exercises.length ? "Finish lesson" : "Next"}
              onAnswered={async (correct, response) => {
                setScore((previous) => ({
                  correct: previous.correct + (correct ? 1 : 0),
                  total: previous.total + 1,
                }));
                if (!user) return;
                await supabase.from("attempts").insert({
                  user_id: user.id,
                  exercise_id: exercise.id,
                  correct,
                  response,
                  skill: exercise.skill,
                  level: exercise.level,
                  context: "lesson",
                });
                if (!correct) {
                  await supabase.from("review_items").insert({
                    user_id: user.id,
                    exercise_id: exercise.id,
                    source: "mistake",
                    due_at: new Date().toISOString(),
                  });
                }
              }}
              onNext={() => {
                if (index + 1 === exercises.length) {
                  void completeLesson({
                    correct: score.correct,
                    total: score.total,
                  });
                } else {
                  setIndex(index + 1);
                }
              }}
            />
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
