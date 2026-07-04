"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ActiveNavItem({
  href,
  label,
  icon,
  exact = false,
  collapsed = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  // exact=true: only active when path is exactly href (used for Dashboard)
  // exact=false: active when path starts with href
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-label={label}
      title={collapsed ? label : undefined}
      className={`flex min-h-[45px] items-center gap-[9px] px-[18px] py-[8px] text-[13px] transition-all no-underline relative
        focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-hidden
        ${collapsed ? "justify-center px-[0px]" : ""}
        ${isActive
          ? "text-white/90 bg-white/5 border-l-2 border-gold"
          : "text-white/40 hover:text-white/70 hover:bg-white/3 border-l-2 border-transparent"
        }`}
    >
      <span className={isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
