import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  mode: z.enum(["explain", "roleplay"]),
  scenario: z.string().trim().max(120).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(24),
});

const SYSTEM_EXPLAIN = `You are the FluentRise tutor, helping adult learners move from B2 to C2 English.
Rules you must follow:
- Explain grammar, vocabulary and register precisely, with two or three natural example sentences.
- Never invent grammar rules, exam statistics or citations. If you are unsure, say so plainly.
- Treat British and American usage as different conventions, never better or worse; say which is which.
- Tag advice with the CEFR band it belongs to when relevant.
- Feedback on a learner's own writing is approximate; say so when you give it.
- Keep answers under 220 words unless the learner asks for more.`;

const SYSTEM_ROLEPLAY = `You are a conversation partner for an advanced English learner (B2-C2).
Stay in the given role and situation, keep turns short, and push the learner to produce language.
Every third turn, add a brief "Language note:" line with one correction or a more precise alternative.
Never invent facts about the learner. Mark your corrections as approximate guidance, not certification.`;

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        ok: false as const,
        reply:
          "The AI tutor is not configured on this deployment. Everything else — lessons, feedback and review — works without it.",
      };
    }

    const system = data.mode === "roleplay" ? SYSTEM_ROLEPLAY : SYSTEM_EXPLAIN;
    const scenarioLine = data.scenario ? `\nSituation: ${data.scenario}` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system + scenarioLine }, ...data.messages],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`AI gateway failed [${response.status}]: ${body}`);
      return {
        ok: false as const,
        reply:
          response.status === 429
            ? "The tutor is rate limited right now. Try again in a moment."
            : "The tutor could not answer just now. Your lessons and review queue are unaffected.",
      };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content?.trim();
    return {
      ok: Boolean(reply),
      reply: reply ?? "No answer came back. Please rephrase and try again.",
    };
  });
