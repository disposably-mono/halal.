"use client";

export function ResultsFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-8 text-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
        <p className="font-tagline text-white/35 text-sm italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/[0.45] text-xs tracking-wide">
          OLPS COMELEC · Public Results
        </p>
        <p className="font-body text-mid/30 text-[11px]">
          Our Lady of Peace School
        </p>
      </div>
    </footer>
  );
}
