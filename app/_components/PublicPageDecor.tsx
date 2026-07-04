import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Shared decorative bits for public info pages
   (About, Creator, Officers) — nav bird glyph,
   labeled rule "eyebrow", and gold divider rule.
   ───────────────────────────────────────────── */

export function NavBirdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.5" />
      <path d="M8 14c1-2 3-4 4-4s3 2 4 4" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="9" r="1.5" fill="#F5C000" />
    </svg>
  );
}

export function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-[19px] mb-[19px]">
      <div className="w-[36px] h-px bg-gold opacity-60" />
      <span
        className="font-body text-[0.6rem] tracking-[0.35em] uppercase"
        style={{ color: "rgba(245,192,0,0.7)" }}
      >
        {label}
      </span>
      <div className="w-[36px] h-px bg-gold opacity-60" />
    </div>
  );
}

export function GoldRule({ className }: { className?: string }) {
  return <div className={cn("w-[90px] h-px mx-auto opacity-50 bg-gold", className)} />;
}
