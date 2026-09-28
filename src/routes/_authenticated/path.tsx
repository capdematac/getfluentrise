import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, LevelChip, SectionLabel } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/path")({
  head: () => ({
    meta: [
      { title: "Learning path — FluentRise" },
      { name: "description", content: "Structured English modules and lessons from A2 foundations to C2 discourse and nuance." },
      { property: "og:title", content: "Learning path — FluentRise" },
      { property: "og:description", content: "Modules and lessons organised by CEFR level, not a random exercise list." },
    ],
  }),
  component: PathPage,
});

function PathPage() {
  const { data: user } = useCurrentUser();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["path-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, slug, title, subtitle, objective, level, position, lessons(id, title, summary, est_minutes, position, published)")
        .eq("published", true)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_progress").select("lesson_id, completed_at, accuracy");
      if (error) throw error;
      return data;
    },
  });

  const done = new Map((progress ?? []).map((row) => [row.lesson_id, row]));

  return (
    <AppShell>
      <section className="anim-fade pt-6">
        <SectionLabel right={`${modules?.length ?? 0} modules`}>Learning path</SectionLabel>
        <h1 className="mt-2 font-serif text-[28px] leading-tight">Courses, modules, lessons</h1>
        <p className="mt-2 max-w-xl text-[14px] text-ink-soft">
          Work down the spine. Modules deepen as you climb: the C1 and C2 blocks focus on precision,
          register, discourse and nuance rather than new rules.
        </p>

        {isLoading ? <p className="label-mono mt-8">Loading…</p> : null}

        <div className="mt-6 space-y-3">
          {(modules ?? []).map((module) => (
            <article key={module.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-2">
                <LevelChip level={module.level} tone="accent" />
                <h2 className="font-serif text-[20px] leading-snug">{module.title}</h2>
              </div>
              {module.subtitle ? <p className="mt-1 text-[13px] text-ink-soft">{module.subtitle}</p> : null}
              {module.objective ? (
                <p className="mt-2 text-[12px] text-ink-faint">Objective — {module.objective}</p>
              ) : null}

              <ul className="mt-4 space-y-1.5">
                {[...module.lessons]
                  .filter((lesson) => lesson.published)
                  .sort((a, b) => a.position - b.position)
                  .map((lesson) => {
                    const record = done.get(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          to="/lesson/$lessonId"
                          params={{ lessonId: lesson.id }}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-line/60"
                        >
                          <span
                            className={`size-2 shrink-0 rounded-full ${
                              record?.completed_at ? "bg-correct" : "bg-line"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-serif text-[16px]">{lesson.title}</span>
                            <span className="block truncate text-[12px] text-ink-faint">{lesson.summary}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-ink-faint">
                            {record?.accuracy != null ? `${Math.round(Number(record.accuracy))}%` : `${lesson.est_minutes}m`}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
