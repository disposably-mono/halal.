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
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20`}>
        {label}
      </Link>
    );
  if (danger)
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 hover:bg-emerald-400/[0.15]`}>
        {label}
      </Link>
    );
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className={`${base} text-white/40 border border-white/[0.07] hover:text-white/70 hover:border-white/[0.12]`}>
      {label}
    </Link>
  );
}
