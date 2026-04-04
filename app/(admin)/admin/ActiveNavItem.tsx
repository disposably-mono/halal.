"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ActiveNavItem({
  href,
  label,
  icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  // exact=true: only active when path is exactly href (used for Dashboard)
  // exact=false: active when path starts with href
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-[7px] text-[12px] transition-all no-underline relative
        ${isActive
          ? "text-white/90 bg-white/[0.05]"
          : "text-white/30 hover:text-white/70 hover:bg-white/[0.03]"
        }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-amber-400 rounded-r-[2px]" />
      )}
      <span className={isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
