"use client";

import { Link } from "next-view-transitions";

// Shared footer for the public voter-facing pages (results, vote, verify).
// Only the middle note changes per page (e.g. "Public Results", "Cast Your
// Vote", "Ballot Verification").
export function PublicFooter({ note = "Public Results" }: { note?: string }) {
  return (
    <footer className="border-t border-white/5 px-[27px] py-[36px] text-center">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-[14px]">
        <p className="font-tagline text-white/35 text-[17px] italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/45 text-[14px] tracking-wide">
          OLPS COMELEC · {note}
        </p>
        <p className="font-body text-mid/30 text-[13px]">
          Our Lady of Peace School
        </p>
        <Link
          href="/privacy"
          className="font-body text-[12px] uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-gold"
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
