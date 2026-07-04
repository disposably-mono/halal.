import Image from "next/image";

import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Shared decorative bits for public info pages
   (About, Creator, Officers) — nav bird glyph,
   labeled rule "eyebrow", and gold divider rule.
   ───────────────────────────────────────────── */

export function NavBirdIcon() {
  return (
    <Image src="/comelec-bird.svg" alt="" width={24} height={24} className="w-[24px] h-[24px] object-contain" aria-hidden="true" />
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
