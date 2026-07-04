"use client";

import { Link } from "next-view-transitions";

export function LandingNav() {
  return (
    <nav
      className="fixed top-[0px] left-[0px] right-[0px] z-50 flex items-center justify-between px-[36px] py-[19px]"
      style={{
        background: "rgba(13,15,43,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,192,0,0.1)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-[12px]" aria-label="OLPS COMELEC home">
        <div
          className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
          style={{ background: "#1b1f5e", border: "1px solid rgba(245,192,0,0.4)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.5" />
            <path d="M8 14c1-2 3-4 4-4s3 2 4 4" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="9" r="1.5" fill="#F5C000" />
          </svg>
        </div>
        <span className="font-tagline font-bold text-[17px] tracking-[0.15em] text-gold">
          OLPS COMELEC
        </span>
      </Link>

      {/* Links */}
      <div className="hidden sm:flex items-center gap-[19px]">
        {[
          { label: "COMELEC", href: "/about" },
          { label: "LEADERSHIP", href: "/officers" },
          { label: "MAKER", href: "/creator" },
        ].map((link, index) => (
          <div key={link.label} className="flex items-center gap-[19px]">
            {index > 0 && (
              <span className="font-body text-[0.65rem] text-gold/25" aria-hidden="true">
                |
              </span>
            )}
            <Link
              href={link.href}
              className="font-body text-[0.65rem] tracking-[0.2em] uppercase text-white/45 transition-colors duration-200 hover:text-gold"
            >
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </nav>
  );
}
