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
      className="fixed inset-[0px] z-50 flex items-center justify-center p-[18px] sm:p-[27px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ colorScheme: "light", color: "#1B1F5E" }}
    >
      <div
        className="absolute inset-[0px] bg-black/60 backdrop-blur-[2px]"
        onClick={() => !pending && onBack()}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-ballot-paper border-2 border-navy shadow-2xl"
        style={{ borderTop: "3px solid #F5C000" }}
      >
        <div className="bg-navy px-[18px] py-[11px] flex items-center gap-[9px]">
          <div className="w-[2px] h-[18px] bg-gold rounded-sm" />
          <p className="font-ballot-mono text-[11px] tracking-[0.3em] uppercase text-gold/70">
            Ballot Review Notice
          </p>
        </div>
        <div className="p-[20px] pb-[18px]">
          <h2
            id="modal-title"
            className="font-ballot-serif font-bold text-[19px] uppercase tracking-widest text-navy mb-[5px]"
          >
            Unselected Positions
          </h2>
          <p className="font-ballot-mono text-[12px] tracking-widest uppercase text-navy/45 mb-[14px]">
            The following positions have no selection:
          </p>
          <div className="border-[1.5px] border-navy mb-[14px]">
            {skippedTitles.map((title, i) => (
              <div
                key={title}
                className={`
                  flex items-center gap-[11px] px-[14px] py-[9px]
                  font-ballot-serif text-[15px] text-navy
                  ${i < skippedTitles.length - 1 ? "border-b border-ballot-rule" : ""}
                `}
              >
                <div className="w-[16px] h-[16px] border-2 border-navy/28 rounded-sm shrink-0" aria-hidden="true" />
                {title}
              </div>
            ))}
          </div>
          <p className="font-ballot-mono text-[12px] leading-relaxed tracking-[0.04em] text-navy/45 border-t border-ballot-rule pt-[14px] mb-[18px]">
            Unselected positions will be recorded as abstentions. You may go
            back to complete your ballot, or submit as-is.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-[9px]">
            <button
              type="button"
              onClick={onBack}
              disabled={pending}
              className="flex-1 py-[11px] border-[1.5px] border-navy/25 bg-transparent text-navy font-ballot-mono text-[12px] tracking-[0.18em] uppercase hover:border-navy/60 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/20 disabled:opacity-30"
            >
              ← Go Back
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 py-[11px] bg-gold border-none text-navy font-ballot-mono text-[12px] font-bold tracking-[0.18em] uppercase hover:opacity-[0.85] transition-opacity focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ballot-paper disabled:opacity-50 flex items-center justify-center gap-[9px]"
            >
              {pending ? (
                <>
                  <Spinner className="w-[16px] h-[16px]" />
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
