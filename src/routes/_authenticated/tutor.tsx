import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionLabel } from "@/components/AppShell";
import { askTutor } from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "AI tutor — FluentRise" },
      { name: "description", content: "Ask about grammar, vocabulary and register, or practise a role-based conversation." },
      { property: "og:title", content: "AI tutor — FluentRise" },
      { property: "og:description", content: "Explanations and role-play practice for advanced English." },
    ],
  }),
  component: Tutor,
});

const SCENARIOS = [
  "Job interview for a senior role",
  "Academic seminar discussion",
  "Conference presentation Q&A",
  "Debate on a policy question",
  "Difficult conversation with a client",
  "Travel: resolving a booking problem",
];

type Message = { role: "user" | "assistant"; content: string };

function Tutor() {
  const ask = useServerFn(askTutor);
  const [mode, setMode] = useState<"explain" | "roleplay">("explain");
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const result = await ask({
        data: { mode, scenario: mode === "roleplay" ? scenario : undefined, messages: next.slice(-24) },
      });
      setMessages([...next, { role: "assistant", content: result.reply }]);
      if (!result.ok) toast.error("The tutor could not answer fully");
    } catch {
      toast.error("The tutor is unavailable right now");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className="pt-6">
        <SectionLabel right="AI-generated">Tutor</SectionLabel>
        <h1 className="mt-2 font-serif text-[28px] leading-tight">Ask, or practise out loud in text</h1>
        <p className="mt-2 max-w-xl text-[13px] text-ink-soft">
          Answers here are AI-generated and may be imperfect. Lesson feedback, by contrast, is
          human-authored and verified. Report anything that looks wrong.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["explain", "roleplay"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setMode(option)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium ${
                mode === option ? "bg-ink text-paper" : "text-ink-soft ring-1 ring-ink/10"
              }`}
            >
              {option === "explain" ? "Explain something" : "Role-play"}
            </button>
          ))}
        </div>

        {mode === "roleplay" ? (
          <select
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            className="mt-3 w-full max-w-sm rounded-md bg-paper px-3 py-2 text-[14px] ring-1 ring-ink/10"
          >
            {SCENARIOS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : null}

        <div className="panel mt-4 space-y-3 p-5">
          {messages.length === 0 ? (
            <p className="text-[13px] text-ink-soft">
              {mode === "explain"
                ? "Try: why is “I'd rather you didn't” past tense?"
                : "Open the scene — the tutor stays in role and adds language notes."}
            </p>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`anim-fade max-w-[85%] rounded-lg px-4 py-3 text-[14px] leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-ink text-paper"
                  : "bg-paper text-ink ring-1 ring-ink/5"
              }`}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              {message.role === "assistant" ? (
                <button
                  onClick={() => toast.success("Reported — thank you. We review flagged answers.")}
                  className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint hover:text-accent"
                >
                  Report this answer
                </button>
              ) : null}
            </div>
          ))}
          {busy ? <p className="label-mono">Thinking…</p> : null}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={input}
            maxLength={2000}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void send();
            }}
            placeholder="Type your question or your turn"
            className="flex-1 rounded-full bg-paper px-4 py-3 text-[14px] ring-1 ring-ink/10 outline-none focus:ring-accent/40"
          />
          <button
            onClick={() => void send()}
            disabled={busy}
            className="rounded-full bg-accent px-5 text-[14px] font-medium text-accent-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </section>
    </AppShell>
  );
}
