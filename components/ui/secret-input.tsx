"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SecretInputProps = Omit<ComponentProps<"input">, "type"> & {
  secretLabel?: string;
  toggleClassName?: string;
};

export function SecretInput({
  className,
  secretLabel = "credential",
  toggleClassName,
  ...props
}: SecretInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(className, "w-full pr-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={`${visible ? "Hide" : "Show"} ${secretLabel}`}
        aria-pressed={visible}
        className={cn(
          "absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-white/35 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400/40",
          toggleClassName,
        )}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A11.7 11.7 0 0 1 12 6c6.5 0 10 6 10 6a16.8 16.8 0 0 1-2.1 2.9" />
      <path d="M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6 10 6a10.5 10.5 0 0 0 4.1-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
