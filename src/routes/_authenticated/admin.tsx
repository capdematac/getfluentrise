import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAuth";
import { AppShell, LevelChip, SectionLabel } from "@/components/AppShell";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { LEVELS, SKILLS, SKILL_LABEL, TYPE_LABEL, type Exercise } from "@/lib/cefr";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Content studio — FluentRise" },
      { name: "description", content: "Author, review, publish and archive exercises with CEFR, skill and objective tags." },
      { property: "og:title", content: "Content studio — FluentRise" },
      { property: "og:description", content: "The FluentRise CMS: exercise CRUD, review workflow and learner preview." },
    ],
  }),
  component: Admin,
});

const TYPES = Object.keys(TYPE_LABEL);
const STATUSES = ["draft", "in_review", "published", "archived"] as const;

function Admin() {
  const { data: isAdmin, isLoading: checkingRole } = useIsAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [draft, setDraft] = useState({
    type: "multiple_choice",
    level: "C1",
    skill: "grammar",
    prompt: "",
    options: "",
    answer: "",
    explanation: "",
    examples: "",
    objective: "",
    status: "in_review",
  });

  const { data: exercises, isLoading } = useQuery({
    queryKey: ["admin-exercises"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(400);
      if (error) throw error;
      return data as Exercise[];
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ["admin-lessons"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return (exercises ?? []).filter((exercise) => {
      if (levelFilter && exercise.level !== levelFilter) return false;
      if (statusFilter && exercise.status !== statusFilter) return false;
      if (search && !`${exercise.prompt} ${exercise.title ?? ""} ${exercise.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [exercises, levelFilter, statusFilter, search]);

  async function setStatus(exercise: Exercise, status: string) {
    const { error } = await supabase
      .from("exercises")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", exercise.id);
    if (error) {
      toast.error("Could not update status");
      return;
    }
    toast.success(`Moved to ${status.replace("_", " ")}`);
    void queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
  }

  async function saveDraft() {
    const prompt = draft.prompt.trim();
    if (prompt.length < 5) {
      toast.error("Add a prompt before saving");
      return;
    }
    let answer: unknown;
    try {
      answer = JSON.parse(draft.answer || "{}");
    } catch {
      toast.error('Answer must be JSON, e.g. {"correct":"had been"} or {"accepted":["had been"]}');
      return;
    }
    const options = draft.options
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      type: draft.type,
      level: draft.level as Exercise["level"],
      skill: draft.skill as Exercise["skill"],
      prompt,
      options,
      answer,
      explanation: draft.explanation.trim() || null,
      examples: draft.examples.split("\n").map((line) => line.trim()).filter(Boolean),
      objective: draft.objective.trim() || null,
      status: draft.status,
      updated_at: new Date().toISOString(),
    };

    const { error } = editing
      ? await supabase.from("exercises").update(payload).eq("id", editing.id)
      : await supabase.from("exercises").insert(payload);

    if (error) {
      toast.error("Could not save the exercise");
      return;
    }
    toast.success(editing ? "Exercise updated" : "Exercise created in review");
    setEditing(null);
    setDraft({ ...draft, prompt: "", options: "", answer: "", explanation: "", examples: "", objective: "" });
    void queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
  }

  function loadIntoForm(exercise: Exercise) {
    setEditing(exercise);
    setDraft({
      type: exercise.type,
      level: exercise.level,
      skill: exercise.skill,
      prompt: exercise.prompt,
      options: (Array.isArray(exercise.options) ? (exercise.options as unknown[]) : [])
        .map((option) => (typeof option === "string" ? option : JSON.stringify(option)))
        .join("\n"),
      answer: JSON.stringify(exercise.answer),
      explanation: exercise.explanation ?? "",
      examples: exercise.examples.join("\n"),
      objective: exercise.objective ?? "",
      status: exercise.status,
    });
  }

  if (checkingRole) {
    return (
      <AppShell>
        <p className="label-mono pt-8">Checking permissions…</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="panel mt-6 p-6">
          <p className="label-mono">Restricted</p>
          <h1 className="mt-2 font-serif text-2xl">Content studio is for editors</h1>
          <p className="mt-2 text-[14px] text-ink-soft">
            Your account doesn't have the editor role, so this area is read-protected at the database
            level too.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="pt-6">
        <SectionLabel right={`${filtered.length} items`}>Content studio</SectionLabel>
        <h1 className="mt-2 font-serif text-[28px] leading-tight">Question bank</h1>
        <p className="mt-2 max-w-xl text-[13px] text-ink-soft">
          Every item carries a CEFR band, skill, type, objective and explanation. AI-generated drafts
          land in review and are never published automatically.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search prompts and tags"
            className="min-w-48 flex-1 rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />
          <select
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          >
            <option value="">All levels</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="panel mt-3 p-5">
          <p className="label-mono">{editing ? "Edit exercise" : "New exercise"}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value })}
              className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            <select
              value={draft.level}
              onChange={(event) => setDraft({ ...draft, level: event.target.value })}
              className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              value={draft.skill}
              onChange={(event) => setDraft({ ...draft, skill: event.target.value })}
              className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
            >
              {SKILLS.map((skill) => (
                <option key={skill} value={skill}>
                  {SKILL_LABEL[skill]}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={draft.prompt}
            onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
            placeholder="Prompt"
            rows={2}
            maxLength={1000}
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />
          <textarea
            value={draft.options}
            onChange={(event) => setDraft({ ...draft, options: event.target.value })}
            placeholder="Options, one per line (leave empty for open answers)"
            rows={3}
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />
          <input
            value={draft.answer}
            onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
            placeholder='Answer JSON, e.g. {"correct":"had been"} or {"accepted":["no sooner"]}'
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 font-mono text-[12px] ring-1 ring-ink/10"
          />
          <textarea
            value={draft.explanation}
            onChange={(event) => setDraft({ ...draft, explanation: event.target.value })}
            placeholder="Explanation — the rule and why the alternatives fail"
            rows={2}
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />
          <textarea
            value={draft.examples}
            onChange={(event) => setDraft({ ...draft, examples: event.target.value })}
            placeholder="Example sentences, one per line"
            rows={2}
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />
          <input
            value={draft.objective}
            onChange={(event) => setDraft({ ...draft, objective: event.target.value })}
            placeholder="Learning objective"
            className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
            <button
              onClick={() => void saveDraft()}
              className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground"
            >
              {editing ? "Save changes" : "Create"}
            </button>
            {editing ? (
              <button
                onClick={() => setEditing(null)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
              >
                Cancel edit
              </button>
            ) : null}
            <span className="font-mono text-[10px] text-ink-faint">
              {lessons?.length ?? 0} lessons available for assignment
            </span>
          </div>
        </div>

        {preview ? (
          <div className="panel mt-3 p-5">
            <div className="flex items-center justify-between">
              <p className="label-mono">Learner preview</p>
              <button
                onClick={() => setPreview(null)}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              <ExercisePlayer
                key={preview.id}
                exercise={preview}
                index={0}
                total={1}
                nextLabel="Done"
                onAnswered={() => undefined}
                onNext={() => setPreview(null)}
              />
            </div>
          </div>
        ) : null}

        {isLoading ? <p className="label-mono mt-6">Loading bank…</p> : null}

        <div className="mt-3 space-y-2">
          {filtered.map((exercise) => (
            <article key={exercise.id} className="panel p-4">
              <div className="flex flex-wrap items-center gap-2">
                <LevelChip level={exercise.level} tone="accent" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {TYPE_LABEL[exercise.type] ?? exercise.type} · {SKILL_LABEL[exercise.skill]} ·{" "}
                  {exercise.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 font-serif text-[16px] leading-snug">{exercise.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setPreview(exercise)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-soft ring-1 ring-ink/10"
                >
                  Preview
                </button>
                <button
                  onClick={() => loadIntoForm(exercise)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-soft ring-1 ring-ink/10"
                >
                  Edit
                </button>
                {exercise.status !== "published" ? (
                  <button
                    onClick={() => void setStatus(exercise, "published")}
                    className="rounded-full bg-correct-soft px-3 py-1.5 text-[12px] font-medium text-correct"
                  >
                    Approve & publish
                  </button>
                ) : (
                  <button
                    onClick={() => void setStatus(exercise, "in_review")}
                    className="rounded-full px-3 py-1.5 text-[12px] font-medium text-ink-soft ring-1 ring-ink/10"
                  >
                    Unpublish to review
                  </button>
                )}
                <button
                  onClick={() => void setStatus(exercise, "archived")}
                  className="rounded-full px-3 py-1.5 text-[12px] font-medium text-incorrect ring-1 ring-incorrect/20"
                >
                  Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
