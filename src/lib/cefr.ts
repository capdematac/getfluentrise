import type { Database } from "@/integrations/supabase/types";

export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type CefrLevel = Database["public"]["Enums"]["cefr_level"];
export type SkillArea = Database["public"]["Enums"]["skill_area"];

export const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const SKILLS: SkillArea[] = [
  "grammar",
  "vocabulary",
  "reading",
  "use_of_english",
  "writing",
  "listening",
  "speaking",
];

export const SKILL_LABEL: Record<SkillArea, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
  use_of_english: "Use of English",
};

export const TYPE_LABEL: Record<string, string> = {
  multiple_choice: "Multiple choice",
  reading_mcq: "Reading comprehension",
  register_choice: "Register judgement",
  open_cloze: "Open cloze",
  key_word_transformation: "Key word transformation",
  error_correction: "Error correction",
  matching: "Matching",
  ordering: "Sentence ordering",
};

export const GOALS = [
  { id: "c2", label: "C2 proficiency", blurb: "Reach the highest CEFR band across all skills." },
  { id: "academic", label: "Academic English", blurb: "Essays, seminars, papers and citation register." },
  { id: "professional", label: "Professional English", blurb: "Meetings, reports and written diplomacy." },
  { id: "speaking", label: "Speaking confidence", blurb: "Fluency, reformulation and thinking aloud." },
  { id: "cpe", label: "Cambridge C2 Proficiency", blurb: "Exam task types and timing practice." },
  { id: "fluency", label: "General advanced fluency", blurb: "Broad, natural, idiomatic English." },
] as const;

export function levelIndex(level: CefrLevel): number {
  return LEVELS.indexOf(level);
}

export function isChoiceType(type: string): boolean {
  return type === "multiple_choice" || type === "reading_mcq" || type === "register_choice";
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,;:!?"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type AnswerShape = {
  correct?: string;
  accepted?: string[];
  pairs?: Record<string, string>;
  order?: string[];
};

export function exerciseAnswer(exercise: Exercise): AnswerShape {
  return (exercise.answer ?? {}) as AnswerShape;
}

export function exerciseOptions(exercise: Exercise): unknown[] {
  return Array.isArray(exercise.options) ? (exercise.options as unknown[]) : [];
}

/** Grades a learner response. `response` is a plain string for text/choice types,
 *  a JSON string of pairs for matching, and a space-joined token list for ordering. */
export function gradeResponse(exercise: Exercise, response: string): boolean {
  const answer = exerciseAnswer(exercise);
  if (isChoiceType(exercise.type)) {
    return normalise(response) === normalise(answer.correct ?? "");
  }
  if (exercise.type === "matching") {
    const expected = answer.pairs ?? {};
    let given: Record<string, string> = {};
    try {
      given = JSON.parse(response) as Record<string, string>;
    } catch {
      return false;
    }
    const keys = Object.keys(expected);
    return keys.length > 0 && keys.every((key) => normalise(given[key] ?? "") === normalise(expected[key] ?? ""));
  }
  if (exercise.type === "ordering") {
    return normalise(response) === normalise((answer.order ?? []).join(" "));
  }
  const accepted = answer.accepted ?? [];
  return accepted.some((candidate) => normalise(candidate) === normalise(response));
}

export function correctAnswerText(exercise: Exercise): string {
  const answer = exerciseAnswer(exercise);
  if (isChoiceType(exercise.type)) return answer.correct ?? "";
  if (exercise.type === "ordering") return (answer.order ?? []).join(" ");
  if (exercise.type === "matching") {
    return Object.entries(answer.pairs ?? {})
      .map(([left, right]) => `${left} → ${right}`)
      .join(" · ");
  }
  return (answer.accepted ?? []).join(" / ");
}

/** Spaced repetition: a deliberately simple, transparent interval schedule. */
export function nextInterval(currentDays: number, correct: boolean): number {
  if (!correct) return 1;
  return Math.min(Math.round(Math.max(currentDays, 1) * 2.3), 60);
}

export type PlacementAttempt = { level: CefrLevel; skill: SkillArea; correct: boolean };

export type PlacementEstimate = {
  overall: CefrLevel;
  confidence: number;
  perSkill: Partial<Record<SkillArea, CefrLevel>>;
  strengths: string[];
  weaknesses: string[];
};

/** Estimates a band per level: the highest level where the learner answered
 *  at least 60% correctly, provided every lower band also reached 50%. */
export function estimateLevel(attempts: PlacementAttempt[]): CefrLevel {
  const byLevel = new Map<CefrLevel, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const bucket = byLevel.get(attempt.level) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (attempt.correct) bucket.correct += 1;
    byLevel.set(attempt.level, bucket);
  }
  let achieved: CefrLevel = "A1";
  for (const level of LEVELS) {
    const bucket = byLevel.get(level);
    if (!bucket || bucket.total === 0) continue;
    const ratio = bucket.correct / bucket.total;
    if (ratio >= 0.6) achieved = level;
    else if (ratio < 0.34) break;
  }
  return achieved;
}

export function estimatePlacement(attempts: PlacementAttempt[]): PlacementEstimate {
  const overall = estimateLevel(attempts);

  const perSkill: Partial<Record<SkillArea, CefrLevel>> = {};
  const ratios: { skill: SkillArea; ratio: number }[] = [];
  for (const skill of SKILLS) {
    const subset = attempts.filter((attempt) => attempt.skill === skill);
    if (subset.length === 0) continue;
    perSkill[skill] = estimateLevel(subset);
    ratios.push({
      skill,
      ratio: subset.filter((attempt) => attempt.correct).length / subset.length,
    });
  }

  ratios.sort((a, b) => b.ratio - a.ratio);
  const strengths = ratios.slice(0, 2).filter((item) => item.ratio >= 0.5).map((item) => SKILL_LABEL[item.skill]);
  const weaknesses = ratios.slice(-2).filter((item) => item.ratio < 0.75).map((item) => SKILL_LABEL[item.skill]);

  const confidence = Math.min(0.9, 0.4 + attempts.length * 0.03);

  return { overall, confidence, perSkill, strengths, weaknesses };
}

export function accuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
