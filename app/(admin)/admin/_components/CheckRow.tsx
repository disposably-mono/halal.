"use client";

export function CheckRow({ done, yes, no }: { done: boolean; yes: string; no: string }) {
  return (
    <div className="flex items-center gap-[7px] text-[10px]">
      <span className={`w-[14px] h-[14px] rounded-full border shrink-0 flex items-center justify-center
        ${done ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400" : "border-white/12 text-white/[0.14]"}`}>
        {done ? (
          <svg style={{ width: 8, height: 8 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg style={{ width: 8, height: 8 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </span>
      <span className="text-white/70">{done ? yes : no}</span>
    </div>
  );
}
