import { useEffect, useState } from "react";

/** Reads a script aloud with the browser's built-in speech voice.
 *  Honest fallback: no recorded audio — a synthetic voice is used and labelled as such. */
export function ListenButton({ script }: { script: string }) {
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [plays, setPlays] = useState(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function play(rate: number) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => v.lang === "en-GB") ?? voices.find((v) => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-GB";
    utterance.rate = rate;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    setPlays((n) => n + 1);
    synth.speak(utterance);
  }

  if (!supported) {
    return (
      <p className="mt-3 text-[13px] text-ink-soft">
        Your browser can't play audio for this task. Transcript: <span className="font-serif">{script}</span>
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => play(0.95)}
        aria-label="Play audio"
        className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper"
      >
        {speaking ? "Playing…" : plays > 0 ? "▶ Play again" : "▶ Play audio"}
      </button>
      <button
        type="button"
        onClick={() => play(0.7)}
        className="rounded-full px-4 py-2 text-[13px] font-medium text-ink-soft ring-1 ring-ink/10"
      >
        Slower
      </button>
      <span className="label-mono">Synthetic voice · played {plays}×</span>
    </div>
  );
}
