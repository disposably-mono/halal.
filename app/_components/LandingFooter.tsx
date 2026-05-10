"use client";

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="font-tagline text-white/30 text-sm italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/50 text-xs tracking-wide">
          OLPS COMELEC — Commission on Elections
        </p>
        <p className="font-body text-mid/30 text-[11px]">Our Lady of Peace School</p>
      </div>
    </footer>
  );
}
