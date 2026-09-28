import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useProfile } from "@/hooks/useAuth";
import { AppShell, LevelChip, SectionLabel } from "@/components/AppShell";
import { LevelRing } from "@/components/LevelRing";
import { accuracy, SKILL_LABEL, SKILLS, type CefrLevel, type SkillArea } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Console — FluentRise" },
      { name: "description", content: "Your progress console: estimated level, skill accuracy, review queue and next lesson." },
      { property: "og:title", content: "Console — FluentRise" },
      { property: "og:description", content: "Track accuracy by skill, due reviews and your recommended next lesson." },
    ],
  }),
  component: Dashboard,
});

type AttemptRow = {
  correct: boolean;
  skill: SkillArea;
  level: CefrLevel;
  created_at: string;
};

function Dashboard() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();

  const { data: attempts } = useQuery({
    queryKey: ["attempts", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("correct, skill, level, created_at")
        .order("created_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data as AttemptRow[];
    },
  });

  const { data: dueCount } = useQuery({
    queryKey: ["due-count", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { count, error } = await supabase
        .from("review_items")
        .select("id", { count: "exact", head: true })
        .lte("due_at", new Date().toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: nextLesson } = useQuery({
    queryKey: ["next-lesson", profile?.estimated_level],
    queryFn: async () => {
      const level = (profile?.estimated_level ?? "B2") as CefrLevel;
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, summary, est_minutes, modules!inner(title, level, position)")
        .eq("modules.level", level)
        .eq("published", true)
        .order("position")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const rows = attempts ?? [];
  const overall = accuracy(rows.filter((row) => row.correct).length, rows.length);
  const recent = rows.slice(0, 20);
  const recentAccuracy = accuracy(recent.filter((row) => row.correct).length, recent.length);

  const perSkill = SKILLS.map((skill) => {
    const subset = rows.filter((row) => row.skill === skill);
    return { skill, total: subset.length, value: accuracy(subset.filter((row) => row.correct).length, subset.length) };
  }).filter((item) => item.total > 0);

  const weakest = [...perSkill].sort((a, b) => a.value - b.value).slice(0, 3);

  return (
    <AppShell>
      <section className="anim-fade pt-6">
        <SectionLabel right={profile?.daily_goal_minutes ? `${profile.daily_goal_minutes} min/day` : undefined}>
          Console
        </SectionLabel>

        <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
          <div className="panel flex items-center gap-5 p-5">
            <LevelRing level={(profile?.estimated_level ?? "B2") as CefrLevel} />
            <div>
              <p className="label-mono">Estimated level</p>
              <p className="font-serif text-[26px] leading-tight">{profile?.estimated_level ?? "Not set"}</p>
              <p className="mt-1 text-[12px] text-ink-faint">
                {profile?.confidence
                  ? `Confidence ${Math.round(Number(profile.confidence) * 100)}%`
                  : "Take the placement test"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Accuracy, all time" value={`${overall}%`} note={`${rows.length} answers`} />
            <Stat label="Accuracy, last 20" value={`${recentAccuracy}%`} note="Recent form" />
            <Stat label="Due for review" value={String(dueCount ?? 0)} note="Spaced repetition" />
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="panel p-5">
            <p className="label-mono">Skill breakdown</p>
            {perSkill.length === 0 ? (
              <p className="mt-3 text-[13px] text-ink-soft">Answer some exercises to see this.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {perSkill.map((item) => (
                  <li key={item.skill}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-ink-soft">{SKILL_LABEL[item.skill]}</span>
                      <span className="font-mono text-[11px] text-ink-faint">{item.value}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="panel p-5">
              <p className="label-mono">Weak areas</p>
              {weakest.length === 0 ? (
                <p className="mt-3 text-[13px] text-ink-soft">Nothing flagged yet.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {weakest.map((item) => (
                    <li key={item.skill} className="flex items-center justify-between text-[14px]">
                      <span>{SKILL_LABEL[item.skill]}</span>
                      <LevelChip level={`${item.value}%`} tone={item.value < 60 ? "accent" : "line"} />
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/notebook" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                Open error notebook
              </Link>
            </div>

            <div className="panel bg-ink p-5 text-paper">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
                Recommended next
              </p>
              {nextLesson ? (
                <>
                  <h2 className="mt-2 font-serif text-[19px] leading-snug">{nextLesson.title}</h2>
                  <p className="mt-1 text-[13px] text-paper/70">{nextLesson.summary}</p>
                  <Link
                    to="/lesson/$lessonId"
                    params={{ lessonId: nextLesson.id }}
                    className="mt-4 inline-block rounded-full bg-paper px-4 py-2 text-[13px] font-medium text-ink"
                  >
                    Start · {nextLesson.est_minutes} min
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-paper/70">
                  No lesson matched your level yet — browse the full path.
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-xl text-[12px] leading-relaxed text-ink-faint">
          Accuracy figures come from your own answers only. Levels shown anywhere in FluentRise are
          estimates for study planning, not certification.
        </p>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel p-5">
      <p className="label-mono">{label}</p>
      <p className="mt-2 font-serif text-[28px] leading-none">{value}</p>
      <p className="mt-1 text-[12px] text-ink-faint">{note}</p>
    </div>
  );
}
