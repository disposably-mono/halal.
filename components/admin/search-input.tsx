"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

export const DEFAULT_SEARCH_DEBOUNCE_MS = 800;

export function SearchInput({
  defaultValue = "",
  onSearch,
  placeholder = "Search",
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  className,
  label = "Search",
}: {
  defaultValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputId = useId();

  useEffect(() => {
    const timeout = window.setTimeout(() => onSearch(value), debounceMs);
    return () => window.clearTimeout(timeout);
  }, [debounceMs, onSearch, value]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input
        id={inputId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-[45px] w-full rounded-[8px] border border-white/10 bg-white/4 px-[40px] pr-[45px] text-[13px] text-white/80 outline-hidden transition-colors placeholder:text-white/35 focus:border-gold/50 focus:ring-2 focus:ring-gold/10"
      />
      <svg aria-hidden="true" className="pointer-events-none absolute left-[13px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue("")}
          className="absolute right-[0px] top-[0px] flex h-[45px] w-[45px] items-center justify-center rounded-[8px] text-white/45 transition-colors hover:text-white/80 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          ×
        </button>
      )}
    </div>
  );
}
