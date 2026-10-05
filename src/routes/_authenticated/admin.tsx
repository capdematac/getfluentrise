  import { createFileRoute } from "@tanstack/react-router";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
 
  const STATUSES = ["draft", "in_review", "published", "archived"] as const;
  type Status = (typeof STATUSES)[number];

  type LessonOption = {
    id: string;
    title: string;
    modules: { title: string; level: string } | null;
  };

  type Draft = {
    lessonId: string;
    type: string;
    level: Exercise["level"];
    skill: Exercise["skill"];
    title: string;
    prompt: string;
    passage: string;
    options: string;
    answer: string;
    explanation: string;
    examples: string;
    tags: string;
    objective: string;
    estSeconds: string;
    status: Status;
  };

  type ImportItem = {
    type: string;
    level: Exercise["level"];
    skill: Exercise["skill"];
    title: string | null;
    prompt: string;
    passage: string | null;
    options: string[];
    answer: Exercise["answer"];
    explanation: string | null;
    examples: string[];
    tags: string[];
    objective: string | null;
    estSeconds: number;
    status: Status;
  };

  function emptyDraft(lessonId = ""): Draft {
    return {
      lessonId,
      type: "multiple_choice",
      level: "B2",
      skill: "reading",
      title: "",
      prompt: "",
      passage: "",
      options: "",
      answer: "",
      explanation: "",
      examples: "",
      tags: "",
      objective: "",
      estSeconds: "60",
      status: "in_review",
    };
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function stringList(value: unknown, field: string, index: number): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      throw new Error(`Item ${index + 1}: ${field} must be a list of text values.`);
    }
    return value.map((item) => item.trim()).filter(Boolean);
  }

  function requiredText(value: unknown, field: string, index: number): string {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`Item ${index + 1}: ${field} is required.`);
    }
    return value.trim();
  }

  function optionalText(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function parseImport(value: unknown): ImportItem[] {
    const rows = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.items) ? value.items : null;
    if (!rows || rows.length === 0) throw new Error('Use a JSON list, or an object containing an "items" list.');
    if (rows.length > 200) throw new Error("Import at most 200 exercises at a time.");

    return rows.map((row, index) => {
      if (!isRecord(row)) throw new Error(`Item ${index + 1} is not an exercise object.`);

      const type = requiredText(row.type, "type", index);
      if (!TYPES.includes(type)) throw new Error(`Item ${index + 1}: unsupported type “${type}”.`);

      const level = requiredText(row.level, "level", index) as Exercise["level"];
      if (!LEVELS.includes(level)) throw new Error(`Item ${index + 1}: unsupported level “${level}”.`);

      const skill = requiredText(row.skill, "skill", index) as Exercise["skill"];
      if (!SKILLS.includes(skill)) throw new Error(`Item ${index + 1}: unsupported skill “${skill}”.`);

      if (!isRecord(row.answer)) throw new Error(`Item ${index + 1}: answer must be an object, such as {"correct":"answer"}.`);

      const providedStatus = typeof row.status === "string" ? row.status : "in_review";
      const status = STATUSES.includes(providedStatus as Status) ? (providedStatus as Status) : "in_review";
      const providedSeconds = typeof row.estSeconds === "number" ? row.estSeconds : 60;

      return {
        type,
        level,
        skill,
        title: optionalText(row.title),
        prompt: requiredText(row.prompt, "prompt", index),
        passage: optionalText(row.passage),
        options: stringList(row.options, "options", index),
        answer: row.answer as Exercise["answer"],
        explanation: optionalText(row.explanation),
        examples: stringList(row.examples, "examples", index),
        tags: stringList(row.tags, "tags", index),
        objective: optionalText(row.objective),
        estSeconds: Number.isFinite(providedSeconds) && providedSeconds > 0 ? Math.round(providedSeconds) : 60,
        status,
      };
    });
  }

  function lessonName(lesson: LessonOption) {
    return lesson.modules ? `${lesson.modules.level} · ${lesson.modules.title} → ${lesson.title}` : lesson.title;
  }

  function Admin() {
    const { data: isAdmin, isLoading: checkingRole } = useIsAdmin();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [preview, setPreview] = useState<Exercise | null>(null);
    const [editing, setEditing] = useState<Exercise | null>(null);
    const [draft, setDraft] = useState<Draft>(() => emptyDraft());
    const [importLessonId, setImportLessonId] = useState("");
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [replaceMatching, setReplaceMatching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, modules(title, level)")
          .order("title");
        if (error) throw error;
        return (data ?? []) as unknown as LessonOption[];
      },
    });

    const filtered = useMemo(() => {
      return (exercises ?? []).filter((exercise) => {
        if (levelFilter && exercise.level !== levelFilter) return false;
        if (statusFilter && exercise.status !== statusFilter) return false;
        if (
          search &&
          !`${exercise.prompt} ${exercise.title ?? ""} ${exercise.tags.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
    }, [exercises, levelFilter, statusFilter, search]);

    function nextPosition(lessonId: string) {
      return (
        (exercises ?? [])
          .filter((exercise) => exercise.lesson_id === lessonId)
          .reduce((highest, exercise) => Math.max(highest, exercise.position), 0) + 1
      );
    }

    async function setStatus(exercise: Exercise, status: Status) {
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
      if (!draft.lessonId) {
        toast.error("Choose the lesson that should contain this exercise.");
        return;
      }

      const prompt = draft.prompt.trim();
      if (prompt.length < 5) {
        toast.error("Add a prompt before saving");
        return;
      }

      let answer: Exercise["answer"];
      try {
        const parsed = JSON.parse(draft.answer || "{}");
        if (!isRecord(parsed)) throw new Error("not an object");
        answer = parsed as Exercise["answer"];
      } catch {
        toast.error('Answer must be JSON, e.g. {"correct":"had been"}.');
        return;
      }

      const payload = {
        lesson_id: draft.lessonId,
        type: draft.type,
        level: draft.level,
        skill: draft.skill,
        title: draft.title.trim() || null,
        prompt,
        passage: draft.passage.trim() || null,
        options: draft.options
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        answer,
        explanation: draft.explanation.trim() || null,
        examples: draft.examples
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        objective: draft.objective.trim() || null,
        est_seconds: Math.max(10, Number.parseInt(draft.estSeconds, 10) || 60),
        position: editing?.position ?? nextPosition(draft.lessonId),
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
      setDraft(emptyDraft(draft.lessonId));
      void queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    }

    function loadIntoForm(exercise: Exercise) {
      setEditing(exercise);
      setDraft({
        lessonId: exercise.lesson_id ?? "",
        type: exercise.type,
        level: exercise.level,
        skill: exercise.skill,
        title: exercise.title ?? "",
        prompt: exercise.prompt,
        passage: exercise.passage ?? "",
        options: (Array.isArray(exercise.options) ? (exercise.options as unknown[]) : [])
          .map((option) => (typeof option === "string" ? option : JSON.stringify(option)))
          .join("\n"),
        answer: JSON.stringify(exercise.answer),
        explanation: exercise.explanation ?? "",
        examples: exercise.examples.join("\n"),
        tags: exercise.tags.join(", "),
        objective: exercise.objective ?? "",
        estSeconds: String(exercise.est_seconds),
        status: exercise.status as Status,
      });
    }

    async function readImportFile(event: ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      try {
        const parsed = parseImport(JSON.parse(await file.text()));
        setImportItems(parsed);
        setImportFileName(file.name);
        toast.success(`${parsed.length} exercises are ready to import.`);
      } catch (error) {
        setImportItems([]);
        setImportFileName("");
        toast.error(error instanceof Error ? error.message : "That file could not be read.");
      }
    }

  async function importExercises() {
      if (!importLessonId) {
        toast.error("Choose the destination lesson first.");
        return;
      }
      if (importItems.length === 0) {
        toast.error("Choose a JSON package first.");
        return;
      }

    setIsImporting(true);
    const firstPosition = nextPosition(importLessonId);
    const timestamp = new Date().toISOString();
    const payload = importItems.map((item, index) => ({
      lesson_id: importLessonId,
        is_placement: false,
        type: item.type,
        level: item.level,
        skill: item.skill,
        title: item.title,
        prompt: item.prompt,
        passage: item.passage,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        examples: item.examples,
        tags: item.tags,
        objective: item.objective,
        est_seconds: item.estSeconds,
        position: firstPosition + index,
        status: item.status,
      updated_at: timestamp,
    }));

    const existingByPrompt = new Map(
      (exercises ?? [])
        .filter((exercise) => exercise.lesson_id === importLessonId)
        .map((exercise) => [exercise.prompt.trim(), exercise]),
    );
    const updates = replaceMatching
      ? payload.filter((item) => existingByPrompt.has(item.prompt.trim()))
      : [];
    const additions = replaceMatching
      ? payload.filter((item) => !existingByPrompt.has(item.prompt.trim()))
      : payload;

    const updateResults = await Promise.all(
      updates.map((item) => {
        const existing = existingByPrompt.get(item.prompt.trim())!;
        return supabase
          .from("exercises")
          .update({ ...item, position: existing.position })
          .eq("id", existing.id);
      }),
    );
    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      setIsImporting(false);
      toast.error("The existing exercises could not be updated.");
      return;
    }

    const { error } = additions.length > 0 ? await supabase.from("exercises").insert(additions) : { error: null };
    setIsImporting(false);
    if (error) {
      toast.error("The package could not be imported.");
      return;
    }

    toast.success(
      replaceMatching
        ? `${updates.length} exercises updated and ${additions.length} added.`
        : `${payload.length} exercises imported into the selected lesson.`,
    );
      setImportItems([]);
      setImportFileName("");
      void queryClient.invalidateQueries({ queryKey: ["admin-exercises"] });
    }

    function downloadTemplate() {
      const template = {
        items: [
          {
            type: "multiple_choice",
            level: "B2",
            skill: "reading",
            title: "Example exercise",
            prompt: "Which statement is best supported by the passage?",
            passage: "Write or paste an original reading passage here.",
            options: ["First option", "Second option", "Third option", "Fourth option"],
            answer: { correct: "First option" },
            explanation: "Explain why the correct answer is supported and the alternatives are not.",
            examples: [],
            tags: ["reading", "inference"],
            objective: "Identify a writer's main point.",
            estSeconds: 90,
            status: "in_review",
          },
        ],
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "fluentrise-import-template.json";
      link.click();
      URL.revokeObjectURL(url);
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
              Your account does not have the editor role. The database also protects this area.
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
            Draft new questions one at a time, or import a reviewed JSON package into one selected lesson.
          </p>

          <div className="panel mt-5 p-5">
            <p className="label-mono">Bulk import</p>
            <h2 className="mt-2 font-serif text-[20px]">Add a complete exercise package</h2>
            <p className="mt-2 max-w-2xl text-[13px] text-ink-soft">
              Select the lesson first. Every imported item will be placed there in order and will remain in review
              until you publish it.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <select
                value={importLessonId}
                onChange={(event) => setImportLessonId(event.target.value)}
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
              >
                <option value="">Choose module and lesson…</option>
                {(lessons ?? []).map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lessonName(lesson)}
                  </option>
                ))}
              </select>
              <label className="cursor-pointer rounded-full px-4 py-2 text-center text-[13px] font-medium text-ink ring-1 ring-ink/10">
                Choose JSON file
                <input type="file" accept="application/json,.json" onChange={readImportFile} className="sr-only" />
              </label>
              <button
                onClick={downloadTemplate}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-ink-soft ring-1 ring-ink/10"
              >
                Download example
              </button>
            </div>
          {importItems.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-[13px] text-ink-soft">
                <span className="font-medium text-ink">{importItems.length} exercises</span> ready from {importFileName}.
              </p>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={replaceMatching}
                  onChange={(event) => setReplaceMatching(event.target.checked)}
                />
                Replace matching questions in this lesson
              </label>
              <button
                  onClick={() => void importExercises()}
                  disabled={isImporting}
                  className="rounded-full bg-accent px-5 py-2 text-[14px] font-medium text-accent-foreground disabled:opacity-50"
              >
                {isImporting ? "Importing…" : replaceMatching ? "Update package" : "Import package"}
              </button>
              </div>
            ) : null}
          </div>

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
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                value={draft.lessonId}
                onChange={(event) => setDraft({ ...draft, lessonId: event.target.value })}
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10 sm:col-span-2"
              >
                <option value="">Choose module and lesson…</option>
                {(lessons ?? []).map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lessonName(lesson)}
                  </option>
                ))}
              </select>
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
                onChange={(event) => setDraft({ ...draft, level: event.target.value as Exercise["level"] })}
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
                onChange={(event) => setDraft({ ...draft, skill: event.target.value as Exercise["skill"] })}
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
              >
                {SKILLS.map((skill) => (
                  <option key={skill} value={skill}>
                    {SKILL_LABEL[skill]}
                  </option>
                ))}
              </select>
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="Short internal title (optional)"
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
              />
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
              value={draft.passage}
              onChange={(event) => setDraft({ ...draft, passage: event.target.value })}
              placeholder="Reading passage or listening transcript (optional)"
              rows={4}
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
              placeholder='Answer JSON, e.g. {"correct":"had been"}'
              className="mt-2 w-full rounded-md bg-paper px-3 py-2 font-mono text-[12px] ring-1 ring-ink/10"
            />
            <textarea
              value={draft.explanation}
              onChange={(event) => setDraft({ ...draft, explanation: event.target.value })}
              placeholder="Explanation — why the answer is correct"
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
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_10rem]">
              <input
                value={draft.tags}
                onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                placeholder="Tags, separated by commas"
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
              />
              <input
                value={draft.estSeconds}
                onChange={(event) => setDraft({ ...draft, estSeconds: event.target.value })}
                inputMode="numeric"
                placeholder="Seconds"
                className="rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
              />
            </div>
            <input
              value={draft.objective}
              onChange={(event) => setDraft({ ...draft, objective: event.target.value })}
              placeholder="Learning objective"
              className="mt-2 w-full rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}
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
                  onClick={() => {
                    setEditing(null);
                    setDraft(emptyDraft(draft.lessonId));
                  }}
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
                >
                  Cancel edit
                </button>
              ) : null}
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
                    {TYPE_LABEL[exercise.type] ?? exercise.type} · {SKILL_LABEL[exercise.skill]} · {exercise.status.replace("_", " ")}
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
