"use client";

import { Link } from "next-view-transitions";

export function LandingNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(13,15,43,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,192,0,0.1)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5" aria-label="OLPS COMELEC home">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "#1b1f5e", border: "1px solid rgba(245,192,0,0.4)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.5" />
            <path d="M8 14c1-2 3-4 4-4s3 2 4 4" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="9" r="1.5" fill="#F5C000" />
          </svg>
        </div>
        <span className="font-tagline font-bold text-sm tracking-[0.15em] text-gold">
          OLPS COMELEC
        </span>
      </Link>

      {/* Links */}
      <div className="hidden sm:flex items-center gap-4">
        {[
          { label: "COMELEC", href: "/about" },
          { label: "LEADERSHIP", href: "/officers" },
          { label: "MAKER", href: "/creator" },
          { label: "VERIFY", href: "/verify" },
        ].map((link, index) => (
          <div key={link.label} className="flex items-center gap-4">
            {index > 0 && (
              <span className="font-body text-[0.65rem] text-gold/25" aria-hidden="true">
                |
              </span>
            )}
            <Link
              href={link.href}
              className="font-body text-[0.65rem] tracking-[0.2em] uppercase text-white/[0.45] transition-colors duration-200 hover:text-gold"
            >
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );
}
