"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";

export function AbstentionModal({
  skippedTitles,
  onConfirm,
  onBack,
  pending,
}: {
  skippedTitles: string[];
  onConfirm: () => void;
  onBack: () => void;
  pending: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { confirmRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onBack();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onBack, pending]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ colorScheme: "light", color: "#1B1F5E" }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={() => !pending && onBack()}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-ballot-paper border-2 border-navy shadow-2xl"
        style={{ borderTop: "3px solid #F5C000" }}
      >
        <div className="bg-navy px-4 py-[10px] flex items-center gap-2">
          <div className="w-0.5 h-4 bg-gold rounded-sm" />
          <p className="font-ballot-mono text-[10px] tracking-[0.3em] uppercase text-gold/70">
            Ballot Review Notice
          </p>
        </div>
        <div className="p-[18px] pb-4">
          <h2
            id="modal-title"
            className="font-ballot-serif font-bold text-[17px] uppercase tracking-widest text-navy mb-1"
          >
            Unselected Positions
          </h2>
          <p className="font-ballot-mono text-[11px] tracking-widest uppercase text-navy/45 mb-3">
            The following positions have no selection:
          </p>
          <div className="border-[1.5px] border-navy mb-3">
            {skippedTitles.map((title, i) => (
              <div
                key={title}
                className={`
                  flex items-center gap-[10px] px-3 py-2
                  font-ballot-serif text-[13px] text-navy
                  ${i < skippedTitles.length - 1 ? "border-b border-ballot-rule" : ""}
                `}
              >
                <div className="w-[14px] h-[14px] border-2 border-navy/28 rounded-sm shrink-0" aria-hidden="true" />
                {title}
              </div>
            ))}
          </div>
          <p className="font-ballot-mono text-[11px] leading-relaxed tracking-[0.04em] text-navy/45 border-t border-ballot-rule pt-3 mb-4">
            Unselected positions will be recorded as abstentions. You may go
            back to complete your ballot, or submit as-is.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onBack}
              disabled={pending}
              className="flex-1 py-[10px] border-[1.5px] border-navy/25 bg-transparent text-navy font-ballot-mono text-[11px] tracking-[0.18em] uppercase hover:border-navy/60 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/20 disabled:opacity-30"
            >
              ← Go Back
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 py-[10px] bg-gold border-none text-navy font-ballot-mono text-[11px] font-bold tracking-[0.18em] uppercase hover:opacity-[0.85] transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ballot-paper disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {pending ? (
                <>
                  <Spinner className="w-3.5 h-3.5" />
                  Submitting…
                </>
              ) : (
                "Submit Ballot →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
