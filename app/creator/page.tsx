"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────
   ABOUT THE CREATOR — Mikel Taopa
   Design: Institutional dark, OLPS COMELEC brand
   Navy-deep / Gold / Maroon palette
   Fonts: Playfair Display, Montserrat, Lora, JetBrains Mono
   ───────────────────────────────────────────── */

const SOCIALS = [
  {
    id: "linkedin",
    platform: "LinkedIn",
    handle: "Mikel Taopa",
    href: "https://www.linkedin.com/in/mikel-taopa-a86205359/",
    color: "rgba(0,119,181,0.25)",
    border: "rgba(0,119,181,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="#0077B5" className="w-[18px] h-[18px]" aria-hidden="true">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    id: "facebook",
    platform: "Facebook",
    handle: "Mikel Taopa",
    href: "https://www.facebook.com/MikelTaopa",
    color: "rgba(24,119,242,0.25)",
    border: "rgba(24,119,242,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="#1877F2" className="w-[18px] h-[18px]" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    platform: "Instagram",
    handle: "@disposablymono",
    href: "https://www.instagram.com/disposablymono/",
    color: "rgba(225,48,108,0.25)",
    border: "rgba(225,48,108,0.4)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="#E1306C" stroke="none" />
      </svg>
    ),
  },
  {
    id: "email",
    platform: "Email",
    handle: "mikel.taopa@gmail.com",
    href: "mailto:mikel.taopa@gmail.com",
    color: "rgba(245,192,0,0.1)",
    border: "rgba(245,192,0,0.3)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F5C000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
];

const HIGHLIGHTS = [
  {
    num: "01",
    title: "Voting System",
    desc: "Secure, division-scoped digital ballots with real-time status tracking and scheduled open/close windows.",
  },
  {
    num: "02",
    title: "Results Dashboard",
    desc: "Live election results with transparent tallying and a public-facing audit trail across all school divisions.",
  },
  {
    num: "03",
    title: "Design Consistency",
    desc: "Unified the website's visual language to align with existing COMELEC branding — colors, typography, and layout system.",
  },
  {
    num: "04",
    title: "System Integration",
    desc: "Built around and integrated with existing internal systems already in use by COMELEC, ensuring seamless continuity.",
  },
  {
    num: "05",
    title: "Officer Portal",
    desc: "Admin tools for election management, candidate setup, division monitoring, and voter registration.",
  },
  {
    num: "06",
    title: "Documentation",
    desc: "Wrote thorough technical documentation covering architecture, components, and workflows for future maintainers.",
  },
];

// ── Decorative SVGs ──────────────────────────────────────────────

function HeroRibbons() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 700"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="creatorRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B1A1A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6B1A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M-100 550 L500 -50 L560 -50 L-40 550 Z" fill="url(#creatorRibbon)" />
      <path d="M200 700 L800 100 L830 100 L230 700 Z" fill="#6B1A1A" fillOpacity="0.1" />
      <path d="M-100 520 L480 -50" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.25" />
      <path d="M220 700 L820 80" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.15" />
      {/* Right-side navy accent */}
      <path d="M1100 0 L1440 300 L1440 0 Z" fill="#1b1f5e" fillOpacity="0.25" />
    </svg>
  );
}

function NavBirdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.5" />
      <path d="M8 14c1-2 3-4 4-4s3 2 4 4" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="9" r="1.5" fill="#F5C000" />
    </svg>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="w-8 h-px bg-gold opacity-60" />
      <span
        className="font-body text-[0.6rem] tracking-[0.35em] uppercase"
        style={{ color: "rgba(245,192,0,0.7)" }}
      >
        {label}
      </span>
      <div className="w-8 h-px bg-gold opacity-60" />
    </div>
  );
}

function GoldRule() {
  return <div className="w-20 h-px mx-auto opacity-50 bg-gold" />;
}

// ── Main Component ──────────────────────────────────────────────

export default function AboutCreatorClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen font-body text-white overflow-x-hidden"
      style={{ background: "#0d0f2b" }}
    >
      {/* ── NAV ──────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          background: "rgba(13,15,43,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,192,0,0.1)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="OLPS COMELEC home">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#1b1f5e", border: "1px solid rgba(245,192,0,0.4)" }}
          >
            <NavBirdIcon />
          </div>
          <span className="font-tagline text-sm font-bold tracking-[0.15em] text-gold">
            OLPS COMELEC
          </span>
        </Link>

        <div className="hidden sm:flex gap-6">
          {[
            { label: "Home", href: "/" },
            { label: "Creator", href: "/creator", active: true },
            { label: "About COMELEC", href: "/about" },
            { label: "Officers", href: "/officers" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-body text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-200 no-underline"
              style={{ color: link.active ? "#F5C000" : "rgba(255,255,255,0.45)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 overflow-hidden"
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,192,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,192,0,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-[700px] h-[700px] rounded-full"
            style={{
              background: "radial-gradient(ellipse, rgba(27,31,94,0.75) 0%, transparent 70%)",
            }}
          />
        </div>
        <HeroRibbons />

        {/* Fade-in content */}
        <div
          className={`relative z-10 flex flex-col items-center text-center max-w-2xl w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {/* Photo placeholder */}
          <div className="relative mb-8">
            {/* Outer ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: "-14px", border: "1px solid rgba(245,192,0,0.15)" }}
            />
            {/* Inner ring */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: "-6px", border: "2px solid rgba(245,192,0,0.45)" }}
            />
            {/* Photo circle */}
            <div
              className="w-40 h-40 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1b1f5e 0%, #252a7a 100%)",
                border: "1px solid rgba(245,192,0,0.3)",
              }}
            >
              {/*
                Replace this span with an <Image> when you have a photo:
                <Image src="/creator-photo.jpg" alt="Mikel Taopa" width={160} height={160} className="w-full h-full object-cover" />
              */}
              <span
                className="font-tagline font-bold tracking-widest text-3xl select-none"
                style={{ color: "rgba(245,192,0,0.35)" }}
                aria-hidden="true"
              >
                MONO
              </span>
            </div>
          </div>

          {/* Meta */}
          <p
            className="font-body text-[0.6rem] tracking-[0.3em] uppercase mb-2"
            style={{ color: "rgba(245,192,0,0.7)" }}
          >
            OLPS COMELEC — Developer &amp; Designer
          </p>

          <h1
            className="font-tagline font-bold leading-none tracking-[0.05em] uppercase mb-1"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              color: "#ffffff",
            }}
          >
            Mikel Taopa
          </h1>

          <p
            className="font-tagline text-base italic mb-8"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Commission on Elections · S.Y. 2024–2026
          </p>

          <GoldRule />

          <p
            className="font-body text-[0.9rem] leading-[1.85] mt-8 max-w-[540px]"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            An alumni of Our Lady of Peace School passionate about civic technology and
            transparent governance. I built and designed this platform to uphold the principle
            of{" "}
            <em className="font-tagline" style={{ color: "rgba(255,255,255,0.75)" }}>
              Vox Populi Vox Dei
            </em>{" "}
            — the voice of the people is the voice of God. This system serves every student&apos;s
            right to a fair, accessible, and dignified electoral process.
          </p>
        </div>
      </section>

      {/* ── SOCIAL LINKS ─────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 py-20">
        <Eyebrow label="Connect" />
        <h2
          className="font-tagline font-bold text-center mb-10"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            color: "#ffffff",
          }}
        >
          Get in Touch
        </h2>

        <div className="flex flex-wrap gap-4 justify-center max-w-2xl">
          {SOCIALS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              target={s.id !== "email" ? "_blank" : undefined}
              rel={s.id !== "email" ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 no-underline transition-all duration-200 hover:-translate-y-0.5"
              style={{
                padding: "0.875rem 1.5rem",
                border: `1px solid rgba(245,192,0,0.2)`,
                background: "rgba(27,31,94,0.3)",
                borderRadius: "2px",
                minWidth: "200px",
                color: "#ffffff",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,192,0,0.5)";
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(27,31,94,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,192,0,0.2)";
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(27,31,94,0.3)";
              }}
              aria-label={`${s.platform}: ${s.handle}`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: s.color, border: `1px solid ${s.border}` }}
              >
                {s.icon}
              </div>
              <div className="flex flex-col">
                <span
                  className="font-body text-[0.6rem] tracking-[0.2em] uppercase"
                  style={{ color: "rgba(245,192,0,0.7)" }}
                >
                  {s.platform}
                </span>
                <span className="font-body text-sm font-semibold" style={{ color: "#ffffff" }}>
                  {s.handle}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── WHAT I BUILT ─────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 pb-24">
        <Eyebrow label="About This Project" />
        <h2
          className="font-tagline font-bold text-center mb-3"
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            color: "#ffffff",
          }}
        >
          What I Built
        </h2>

        <div
          className="grid gap-4 mt-10 w-full"
          style={{
            maxWidth: "860px",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.num}
              className="relative overflow-hidden group transition-all duration-250"
              style={{
                padding: "1.75rem 1.5rem",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(27,31,94,0.2)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(245,192,0,0.22)";
                const accent = el.querySelector(".card-accent") as HTMLElement | null;
                if (accent) accent.style.opacity = "0.6";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                const accent = el.querySelector(".card-accent") as HTMLElement | null;
                if (accent) accent.style.opacity = "0";
              }}
            >
              {/* Left gold accent bar */}
              <div
                className="card-accent absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-opacity duration-250"
                style={{ background: "#F5C000", opacity: 0 }}
              />
              <p
                className="font-mono text-[0.65rem] mb-2"
                style={{ color: "rgba(245,192,0,0.45)" }}
              >
                {h.num}
              </p>
              <p className="font-heading text-[0.875rem] font-bold mb-1.5" style={{ color: "#ffffff" }}>
                {h.title}
              </p>
              <p
                className="font-body text-[0.75rem] leading-[1.6]"
                style={{ color: "#8a8fbb" }}
              >
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
          <p className="font-tagline text-white/30 text-sm italic">
            VOX POPULI VOX DEI
          </p>
          <p className="font-body text-mid/50 text-xs tracking-wide">
            OLPS COMELEC — Commission on Elections
          </p>
          <p className="font-body text-mid/30 text-[11px]">
            Our Lady of Peace School
          </p>
        </div>
      </footer>
    </div>
  );
}
