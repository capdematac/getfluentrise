import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, LevelChip, SectionLabel } from "@/components/AppShell";
import {
  accuracy,
  correctAnswerText,
  SKILL_LABEL,
  TYPE_LABEL,
  type Exercise,
  type SkillArea,
} from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/notebook")({
  head: () => ({
    meta: [
      { title: "Error notebook — FluentRise" },
      { name: "description", content: "Your mistakes grouped by skill, with the expected answer and the rule behind it." },
      { property: "og:title", content: "Error notebook — FluentRise" },
      { property: "og:description", content: "Recurring error categories grouped by skill area." },
    ],
  }),
  component: Notebook,
});

type Row = {
  id: string;
  correct: boolean;
  response: string | null;
  created_at: string;
  skill: SkillArea;
  exercises: Exercise;
};

function Notebook() {
  const { data: user } = useCurrentUser();

  const { data: rows, isLoading } = useQuery({
    queryKey: ["notebook", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("id, correct, response, created_at, skill, exercises(*)")
        .eq("correct", false)
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const grouped = new Map<SkillArea, Row[]>();
  for (const row of rows ?? []) {
    const bucket = grouped.get(row.skill) ?? [];
    bucket.push(row);
    grouped.set(row.skill, bucket);
  }

  return (
    <AppShell>
      <section className="anim-fade pt-6">
        <SectionLabel right={`${rows?.length ?? 0} entries`}>Error notebook</SectionLabel>
        <h1 className="mt-2 font-serif text-[28px] leading-tight">What keeps going wrong</h1>
        <p className="mt-2 max-w-xl text-[14px] text-ink-soft">
          Grouped by skill so patterns surface. Each entry keeps your answer, the expected one and the
          explanation.
        </p>

        {isLoading ? <p className="label-mono mt-8">Loading…</p> : null}

        {!isLoading && (rows ?? []).length === 0 ? (
          <div className="panel mt-6 p-6">
            <p className="font-serif text-[19px]">Nothing recorded yet.</p>
            <Link to="/path" className="mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
              Start a lesson
            </Link>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {[...grouped.entries()].map(([skill, entries]) => (
            <article key={skill} className="panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[20px]">{SKILL_LABEL[skill]}</h2>
                <LevelChip level={`${entries.length} slips`} tone="accent" />
              </div>
              <ul className="mt-3 divide-y divide-line">
                {entries.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                      {TYPE_LABEL[entry.exercises.type] ?? entry.exercises.type} · {entry.exercises.level}
                    </p>
                    <p className="mt-1 font-serif text-[15px] leading-snug">{entry.exercises.prompt}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      You wrote <span className="text-incorrect">{entry.response || "—"}</span> · expected{" "}
                      <span className="text-correct">{correctAnswerText(entry.exercises)}</span>
                    </p>
                    {entry.exercises.explanation ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                        {entry.exercises.explanation}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {(rows ?? []).length > 0 ? (
          <p className="mt-6 text-[12px] text-ink-faint">
            Overall accuracy on these skills improves as reviewed items stop reappearing — currently{" "}
            {accuracy(0, 0)}% of notebook entries have been cleared automatically; clear them by
            answering correctly in the review queue.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
