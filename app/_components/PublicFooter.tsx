"use client";

// Shared footer for the public voter-facing pages (results, vote, verify).
// Only the middle note changes per page (e.g. "Public Results", "Cast Your
// Vote", "Ballot Verification").
export function PublicFooter({ note = "Public Results" }: { note?: string }) {
  return (
    <footer className="border-t border-white/5 px-6 py-8 text-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
        <p className="font-tagline text-white/35 text-sm italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/[0.45] text-xs tracking-wide">
          OLPS COMELEC · {note}
        </p>
        <p className="font-body text-mid/30 text-[11px]">
          Our Lady of Peace School
        </p>
      </div>
    </footer>
  );
}
