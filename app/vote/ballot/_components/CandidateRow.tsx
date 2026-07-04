"use client";

import type { Candidate } from "./ballot-shared";

export function CandidateRow({
  candidate,
  selected,
  onSelect,
  disabled,
  index,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`
        group w-full flex items-center gap-[14px] px-[18px] py-[10px]
        border-b border-ballot-rule last:border-b-0
        transition-colors duration-100 text-left
        focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/55
        ${selected
          ? "bg-navy/6 shadow-[inset_3px_0_0_#F5C000]"
          : "bg-transparent hover:bg-ballot-hover"
        }
        ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          shrink-0 w-[25px] h-[25px] rounded-full border-2 transition-all duration-150
          ${selected
            ? "bg-navy border-navy"
            : "bg-transparent border-navy/35 group-hover:border-navy/70"
          }
        `}
        aria-hidden="true"
      />
      <span
        className={`
          font-ballot-mono text-[11px] w-[20px] text-right shrink-0
          ${selected ? "text-navy/50" : "text-navy/30"}
        `}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        className={`
          flex-1 font-ballot-serif text-[15px] uppercase tracking-[0.06em]
          min-w-[0px] overflow-hidden text-ellipsis whitespace-nowrap
          ${selected ? "text-navy font-semibold" : "text-navy/72"}
        `}
      >
        {candidate.fullName}
      </span>
      <span
        className={`
          shrink-0 font-ballot-mono text-[10px] tracking-[0.16em]
          ${selected ? "text-navy/50" : "text-navy/25"}
        `}
      >
        Gr.{candidate.gradeLevel}
      </span>
    </button>
  );
}
