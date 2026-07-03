"use client";

import Link from "next/link";

export function AttnBtn({
  href,
  label,
  primary = false,
  danger = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  const base = "flex-1 py-[5px] text-center text-[10px] rounded-[6px] transition-all no-underline";
  if (primary)
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-gold bg-gold/10 border border-gold/20 hover:bg-gold/20`}>
        {label}
      </Link>
    );
  if (danger)
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 hover:bg-emerald-400/15`}>
        {label}
      </Link>
    );
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-white/50 border border-white/[0.07] hover:text-white/70 hover:border-white/12`}>
      {label}
    </Link>
  );
}
