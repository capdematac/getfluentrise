import { LEVELS, levelIndex, type CefrLevel } from "@/lib/cefr";

export function LevelRing({ level }: { level: CefrLevel }) {
  const progress = (levelIndex(level) + 1) / LEVELS.length;
  const circumference = 188;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative grid size-[92px] shrink-0 place-items-center">
      <svg viewBox="0 0 72 72" className="size-[92px] -rotate-90">
        <circle cx="36" cy="36" r="30" fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          className="anim-arc"
          cx="36"
          cy="36"
          r="30"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-serif text-[22px] font-semibold leading-none">{level}</p>
          <p className="label-mono mt-1">Estimated</p>
        </div>
      </div>
    </div>
  );
}
