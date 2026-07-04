"use client";

export function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] bg-navy border border-gold/30 flex items-center justify-center rounded-sm">
          <span className="font-mono text-[27px] sm:text-[34px] text-gold font-bold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="font-body text-[12px] sm:text-[14px] text-mid uppercase tracking-[0.2em] mt-[7px]">
        {label}
      </span>
    </div>
  );
}
