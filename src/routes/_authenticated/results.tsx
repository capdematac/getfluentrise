import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useAuth";
import { AppShell, LevelChip, SectionLabel } from "@/components/AppShell";
import { LevelRing } from "@/components/LevelRing";
import { SKILL_LABEL, type CefrLevel, type SkillArea } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "Your level estimate — FluentRise" },
      { name: "description", content: "Your estimated CEFR level per skill, with strengths, weaknesses and a recommended path." },
      { property: "og:title", content: "Your level estimate — FluentRise" },
      { property: "og:description", content: "Per-skill CEFR estimate with strengths, weaknesses and next steps." },
    ],
  }),
  component: Results,
});

const PATH_BY_LEVEL: Record<CefrLevel, { title: string; body: string }> = {
  A1: { title: "Foundations", body: "Start with core tenses and everyday word partners before moving up." },
  A2: { title: "Foundations", body: "Consolidate present and past systems, then build common collocations." },
  B1: { title: "Consolidation", body: "Tighten conditionals and perfect aspect — the usual barrier to B2 accuracy." },
  B2: { title: "B2 accuracy → C1", body: "Narrative sequencing, phrasal verbs and naturalness, then precision work at C1." },
  C1: { title: "C1 precision & register", body: "Near-synonyms, academic collocation, hedging and formal/neutral/informal control." },
  C2: { title: "C2 discourse & nuance", body: "Concession, inversion, nominalisation, irony and idiom under time pressure." },
};

function Results() {
  const { data: user } = useCurrentUser();

  const { data: result, isLoading } = useQuery({
    queryKey: ["placement-result", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("placement_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="label-mono pt-8">Loading your estimate…</p>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell>
        <div className="panel mt-6 p-6">
          <p className="label-mono">No estimate yet</p>
          <h1 className="mt-2 font-serif text-2xl">Take the placement test first</h1>
          <Link
            to="/placement"
            className="mt-5 inline-block rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
          >
            Start the test
          </Link>
        </div>
      </AppShell>
    );
  }

  const perSkill = (result.per_skill ?? {}) as Record<string, CefrLevel>;
  const path = PATH_BY_LEVEL[result.overall as CefrLevel];
  const confidence = Math.round(Number(result.confidence) * 100);

  return (
    <AppShell>
      <section className="anim-fade pt-6">
        <SectionLabel>Placement result</SectionLabel>

        <div className="panel mt-3 flex flex-wrap items-center gap-6 p-6">
          <LevelRing level={result.overall as CefrLevel} />
          <div className="min-w-56 flex-1">
            <h1 className="font-serif text-[28px] leading-tight">
              Estimated level {result.overall}
            </h1>
            <p className="mt-2 text-[13px] text-ink-soft">
              Confidence {confidence}% — based on {Object.keys(perSkill).length} skill areas. More
              practice sharpens this figure.
            </p>
            <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="panel p-5">
            <p className="label-mono">Per skill</p>
            <ul className="mt-3 space-y-2">
              {Object.entries(perSkill).map(([skill, level]) => (
                <li key={skill} className="flex items-center justify-between">
                  <span className="text-[14px] text-ink-soft">{SKILL_LABEL[skill as SkillArea] ?? skill}</span>
                  <LevelChip level={level} />
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <p className="label-mono">Strengths & weaknesses</p>
            <p className="mt-3 text-[13px] text-ink-soft">Strongest</p>
            <p className="font-serif text-[16px]">
              {(result.strengths as string[]).map((skill) => SKILL_LABEL[skill as SkillArea] ?? skill).join(", ") ||
                "Not yet clear"}
            </p>
            <p className="mt-3 text-[13px] text-ink-soft">Needs work</p>
            <p className="font-serif text-[16px]">
              {(result.weaknesses as string[]).map((skill) => SKILL_LABEL[skill as SkillArea] ?? skill).join(", ") ||
                "Nothing pressing"}
            </p>
          </div>
        </div>

        <div className="panel mt-3 bg-ink p-6 text-paper">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
            Recommended path · starting difficulty {result.overall}
          </p>
          <h2 className="mt-2 font-serif text-[22px]">{path.title}</h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-paper/70">{path.body}</p>
          <Link
            to="/path"
            className="mt-5 inline-block rounded-full bg-paper px-5 py-2.5 text-[14px] font-medium text-ink"
          >
            Open my path
          </Link>
        </div>

        <p className="mt-6 max-w-xl text-[12px] leading-relaxed text-ink-faint">
          This is an educational estimate produced from a short test. It is not an official CEFR
          certification, and completing this app does not award a C2 qualification.
        </p>
      </section>
    </AppShell>
  );
}
