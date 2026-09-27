import { useMemo, useState } from "react";
import {
  correctAnswerText,
  exerciseOptions,
  gradeResponse,
  isChoiceType,
  SKILL_LABEL,
  TYPE_LABEL,
  type Exercise,
} from "@/lib/cefr";
import { LevelChip } from "@/components/AppShell";

type Props = {
  exercise: Exercise;
  index: number;
  total: number;
  onAnswered: (correct: boolean, response: string) => void;
  onNext: () => void;
  onSave?: () => void;
  saved?: boolean;
  nextLabel?: string;
  hideFeedback?: boolean;
};

type MatchPair = { left: string; right: string };

export function ExercisePlayer({
  exercise,
  index,
  total,
  onAnswered,
  onNext,
  onSave,
  saved,
  nextLabel = "Next",
  hideFeedback = false,
}: Props) {
  const [text, setText] = useState("");
  const [choice, setChoice] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [result, setResult] = useState<{ correct: boolean; response: string } | null>(null);

  const options = exerciseOptions(exercise);
  const matchPairs = useMemo(
    () => (exercise.type === "matching" ? (options as MatchPair[]) : []),
    [exercise.type, options],
  );
  const tokens = useMemo(
    () => (exercise.type === "ordering" ? (options as string[]) : []),
    [exercise.type, options],
  );
  const rightOptions = useMemo(
    () => matchPairs.map((pair) => pair.right).sort((a, b) => a.localeCompare(b)),
    [matchPairs],
  );

  function currentResponse(): string {
    if (isChoiceType(exercise.type)) return choice ?? "";
    if (exercise.type === "matching") return JSON.stringify(pairs);
    if (exercise.type === "ordering") return order.join(" ");
    return text;
  }

  const canSubmit = (() => {
    if (result) return false;
    if (isChoiceType(exercise.type)) return Boolean(choice);
    if (exercise.type === "matching") return Object.keys(pairs).length === matchPairs.length;
    if (exercise.type === "ordering") return order.length === tokens.length;
    return text.trim().length > 0;
  })();

  function submit() {
    const response = currentResponse();
    const correct = gradeResponse(exercise, response);
    setResult({ correct, response });
    onAnswered(correct, response);
  }

  function reset() {
    setText("");
    setChoice(null);
    setPairs({});
    setOrder([]);
    setResult(null);
  }

  function handleNext() {
    reset();
    onNext();
  }

  return (
    <div className="anim-fade">
      <div className="flex items-center justify-between">
        <p className="label-mono">
          Question {index + 1} / {total}
        </p>
        <LevelChip level={exercise.level} />
      </div>

      <div className="panel mt-3 p-5">
        <p className="label-mono">
          {TYPE_LABEL[exercise.type] ?? exercise.type} · {SKILL_LABEL[exercise.skill]}
        </p>

        {exercise.passage ? (
          <p className="mt-3 border-l-2 border-line pl-4 font-serif text-[16px] leading-relaxed text-ink-soft">
            {exercise.passage}
          </p>
        ) : null}

        <p className="mt-3 whitespace-pre-line font-serif text-[19px] leading-snug">{exercise.prompt}</p>

        {isChoiceType(exercise.type) ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(options as string[]).map((option) => {
              const isChosen = choice === option;
              const isKey = result && option === correctAnswerText(exercise);
              const isWrongPick = result && isChosen && !result.correct;
              const base = "rounded-md px-4 py-2.5 text-left text-[14px] font-medium transition-colors";
              const cls = isKey
                ? "bg-correct-soft text-correct ring-1 ring-correct/20"
                : isWrongPick
                  ? "bg-incorrect-soft text-incorrect ring-1 ring-incorrect/20"
                  : isChosen
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink-soft ring-1 ring-ink/5 hover:ring-ink/20";
              return (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => setChoice(option)}
                  className={`${base} ${cls}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

        {exercise.type === "matching" ? (
          <div className="mt-4 space-y-2">
            {matchPairs.map((pair) => (
              <div key={pair.left} className="flex flex-wrap items-center gap-2">
                <span className="min-w-32 font-serif text-[15px]">{pair.left}</span>
                <select
                  disabled={Boolean(result)}
                  value={pairs[pair.left] ?? ""}
                  onChange={(event) =>
                    setPairs((previous) => ({ ...previous, [pair.left]: event.target.value }))
                  }
                  className="flex-1 rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
                >
                  <option value="">Choose…</option>
                  {rightOptions.map((right) => (
                    <option key={right} value={right}>
                      {right}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : null}

        {exercise.type === "ordering" ? (
          <div className="mt-4">
            <div className="min-h-12 rounded-md bg-paper p-3 ring-1 ring-ink/5">
              <p className="font-serif text-[16px]">{order.join(" ") || "Tap the words in order…"}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tokens.map((token, tokenIndex) => {
                const used = order.filter((item) => item === token).length;
                const available = tokens.filter((item) => item === token).length;
                const disabled = Boolean(result) || used >= available;
                return (
                  <button
                    key={`${token}-${tokenIndex}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setOrder((previous) => [...previous, token])}
                    className="rounded-md bg-line px-3 py-1.5 text-[13px] font-medium text-ink disabled:opacity-35"
                  >
                    {token}
                  </button>
                );
              })}
            </div>
            {order.length > 0 && !result ? (
              <button
                type="button"
                onClick={() => setOrder((previous) => previous.slice(0, -1))}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
              >
                Undo last word
              </button>
            ) : null}
          </div>
        ) : null}

        {!isChoiceType(exercise.type) && exercise.type !== "matching" && exercise.type !== "ordering" ? (
          <input
            value={text}
            disabled={Boolean(result)}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSubmit) submit();
            }}
            placeholder="Type your answer"
            maxLength={200}
            className="mt-4 w-full rounded-md bg-paper px-4 py-3 font-serif text-[16px] ring-1 ring-ink/10 outline-none focus:ring-accent/40"
          />
        ) : null}

        {!result ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="mt-5 w-full rounded-full bg-accent py-2.5 text-[14px] font-medium text-accent-foreground transition-opacity disabled:opacity-40"
          >
            Check answer
          </button>
        ) : null}
      </div>

      {result && !hideFeedback ? (
        <div className="panel anim-rail mt-3 p-5">
          <div className="flex items-center gap-2">
            <span
              className={`grid size-5 place-items-center rounded-full text-[11px] text-paper ${
                result.correct ? "bg-correct" : "bg-incorrect"
              }`}
            >
              {result.correct ? "✓" : "×"}
            </span>
            <p className="font-serif text-[17px] font-medium">
              {result.correct ? "Correct" : "Not quite"}
            </p>
            <span className="ml-auto">
              <LevelChip level={exercise.level} />
            </span>
          </div>

          {!result.correct ? (
            <p className="mt-3 text-[13px] text-ink-soft">
              Expected: <span className="font-medium text-ink">{correctAnswerText(exercise)}</span>
            </p>
          ) : null}

          {exercise.explanation ? (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{exercise.explanation}</p>
          ) : null}

          {exercise.examples.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {exercise.examples.map((example) => (
                <li key={example} className="font-serif text-[14px] text-ink-soft">
                  — {example}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-full bg-ink py-2.5 text-[13px] font-medium text-paper"
            >
              {nextLabel}
            </button>
            {onSave ? (
              <button
                type="button"
                onClick={onSave}
                disabled={saved}
                className="rounded-full px-4 py-2.5 text-[13px] font-medium text-ink-soft ring-1 ring-ink/10 disabled:opacity-50"
              >
                {saved ? "Saved for review" : "Save for review"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {result && hideFeedback ? (
        <div className="panel anim-rail mt-3 p-5">
          <p className="text-[13px] text-ink-soft">
            Answer recorded. Feedback is withheld during the placement test so the estimate stays honest.
          </p>
          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-full bg-ink py-2.5 text-[13px] font-medium text-paper"
          >
            {nextLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
