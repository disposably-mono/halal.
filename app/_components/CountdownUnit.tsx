"use client";

export function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-navy border border-gold/30 flex items-center justify-center rounded-sm">
          <span className="font-mono text-2xl sm:text-3xl text-gold font-bold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="font-body text-[10px] sm:text-xs text-mid uppercase tracking-[0.2em] mt-1.5">
        {label}
      </span>
    </div>
  );
}
