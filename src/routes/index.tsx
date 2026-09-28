import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FluentRise — advanced English from B2 to C2" },
      {
        name: "description",
        content:
          "A structured English platform for adults: a multi-skill placement estimate, C1–C2 learning paths, precise feedback and spaced review.",
      },
      { property: "og:title", content: "FluentRise — advanced English from B2 to C2" },
      {
        property: "og:description",
        content: "Placement estimate, advanced learning paths, exact feedback and spaced review.",
      },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  {
    label: "01 — Placement",
    title: "An estimate, honestly labelled",
    body: "Sixteen calibrated tasks across grammar, vocabulary, use of English, reading and writing judgement. You get a band per skill and a stated confidence — not a certificate.",
  },
  {
    label: "02 — Path",
    title: "Courses, not shuffled quizzes",
    body: "Modules from A2 refreshers to C2 discourse work, with the deepest content where it matters: register, concession, nominalisation, irony and idiom.",
  },
  {
    label: "03 — Feedback",
    title: "Why, not just wrong",
    body: "Every item carries the expected answer, the rule behind it, natural examples and a CEFR tag. Mistakes go to your notebook and return on a schedule.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[19px] font-semibold tracking-tight">FluentRise</span>
          <span className="label-mono">Advanced</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper"
        >
          Start
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        <section className="anim-fade pt-10 sm:pt-16">
          <p className="label-mono">B2 → C1 → C2</p>
          <h1 className="mt-3 max-w-2xl font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[58px]">
            English for adults who are already good at it.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            FluentRise is built for the last stretch — the part where progress stops coming from
            vocabulary lists and starts coming from precision, register and inference.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-foreground"
            >
              Take the placement test
            </Link>
            <span className="font-mono text-[11px] text-ink-faint">
              Results are educational estimates, not official CEFR certification.
            </span>
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.label} className="panel p-5">
              <p className="label-mono">{pillar.label}</p>
              <h2 className="mt-2 font-serif text-[19px] leading-snug">{pillar.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{pillar.body}</p>
            </article>
          ))}
        </section>

        <section className="panel mt-3 bg-ink p-6 text-paper">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
            What it is not
          </p>
          <p className="mt-3 max-w-2xl font-serif text-[19px] leading-snug">
            No mascots, no streak guilt, no invented rules. Motivation exists, but the measure of
            success is the quality of your English — not a counter.
          </p>
        </section>
      </main>
    </div>
  );
}
