"use client";

import { Link } from "next-view-transitions";
import { useEffect, useState } from "react";
import { LandingFooter } from "../_components/LandingFooter";

/* ─────────────────────────────────────────────
   ABOUT COMELEC — OLPS Commission on Elections
   Content: S.Y. 2025–2026 Club Description, Vision, Mission
   Design: Institutional dark, OLPS COMELEC brand
   ───────────────────────────────────────────── */

// ── Content ─────────────────────────────────────────────────────

const MVV = [
  {
    key: "description",
    accent: "#F5C000", // gold
    label: "Who We Are",
    heading: "Organization Description",
    body: "The OLPS Commission on Elections manages school elections at Our Lady of Peace School and helps students understand civic responsibility. COMELEC trains student commissioners to uphold integrity, transparency, and accountability while conducting fair elections for the OLPS community.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 opacity-70" aria-hidden="true">
        <circle cx="20" cy="20" r="16" stroke="#F5C000" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="8" stroke="#F5C000" strokeWidth="1.5" strokeOpacity="0.45" />
        <circle cx="20" cy="20" r="2" fill="#F5C000" />
      </svg>
    ),
  },
  {
    key: "vision",
    accent: "#6b1a1a", // maroon
    label: "Vision",
    heading: "A Fair School Election Culture",
    body: "The OLPS Commission on Elections envisions a school community where students take part in elections with integrity. We aim to make transparency and accountability part of how student elections are prepared, conducted, and reviewed. Through this work, COMELEC helps students practice responsible citizenship inside and beyond Our Lady of Peace School.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 opacity-70" aria-hidden="true">
        <path d="M20 6 L34 28 H6 Z" stroke="#F5C000" strokeWidth="1.5" fill="none" />
        <path d="M20 14 L28 26 H12 Z" stroke="#F5C000" strokeWidth="1" fill="none" strokeOpacity="0.35" />
        <circle cx="20" cy="20" r="2" fill="#F5C000" fillOpacity="0.65" />
      </svg>
    ),
  },
  {
    key: "mission",
    accent: "#1b1f5e", // navy
    label: "Mission",
    heading: "Upholding Free, Honest & Orderly Elections",
    body: "The OLPS Commission on Elections upholds free, honest, and orderly elections within Our Lady of Peace School. We train commissioners to serve with responsibility, knowledge, and integrity. For the student body, we work to keep elections transparent, accurate, and worthy of trust.",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10 opacity-70" aria-hidden="true">
        <rect x="8" y="8" width="24" height="28" rx="2" stroke="#F5C000" strokeWidth="1.5" />
        <line x1="13" y1="16" x2="27" y2="16" stroke="#F5C000" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="13" y1="21" x2="27" y2="21" stroke="#F5C000" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="13" y1="26" x2="22" y2="26" stroke="#F5C000" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
    ),
  },
];

const PRINCIPLES = [
  { num: "01", name: "Integrity", desc: "Unwavering honesty in all electoral proceedings." },
  { num: "02", name: "Transparency", desc: "Open processes, public results, accountable decisions." },
  { num: "03", name: "Accountability", desc: "Every action of the commission is answerable to the student body." },
  { num: "04", name: "Accuracy", desc: "Every vote counts and is counted correctly." },
  { num: "05", name: "Inclusion", desc: "Accessible elections for every student division." },
];

const MILESTONES = [
  {
    year: "S.Y. 24–25",
    title: "COMELEC Becomes a Separate Entity",
    desc: "For the first time, the OLPS Commission on Elections operated as an independent organization — distinct from the student council — with its own structure, officers, and mandate.",
    highlight: false,
  },
  {
    year: "S.Y. 25–26",
    title: "Improved Election Processes",
    desc: "After its first year as an independent organization, COMELEC improved its election procedures, used more digital tools, and continued its civic education work.",
    highlight: false,
  },
  {
    year: "S.Y. 26–27",
    title: "First Year of HALAL",
    desc: "Built during the summer transition out of S.Y. 2025–2026, HALAL — the commission's online voting and verifiable-ballot system — enters its first year of implementation. This marks COMELEC's first attempt at running fully digital, anonymous, and auditable elections at Our Lady of Peace School.",
    highlight: true,
  },
];

const PAGE_BACKGROUND = {
  backgroundColor: "#0d0f2b",
  backgroundImage: [
    "radial-gradient(circle at 50% 18%, rgba(27,31,94,0.55) 0%, transparent 36rem)",
    "radial-gradient(circle at 12% 52%, rgba(107,26,26,0.18) 0%, transparent 28rem)",
    "radial-gradient(circle at 88% 78%, rgba(245,192,0,0.06) 0%, transparent 24rem)",
    "repeating-linear-gradient(135deg, transparent 0 34rem, rgba(107,26,26,0.18) 34rem 38rem, transparent 38rem 72rem)",
    "repeating-linear-gradient(135deg, transparent 0 50rem, rgba(27,31,94,0.26) 50rem 54rem, transparent 54rem 96rem)",
    "linear-gradient(rgba(245,192,0,0.035) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(245,192,0,0.035) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "auto, auto, auto, auto, auto, 48px 48px, 48px 48px",
  backgroundAttachment: "fixed",
};

// ── Decorative SVGs ──────────────────────────────────────────────

function HeroRibbons() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 600"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aboutRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B1A1A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6B1A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M-100 500 L450 -50 L510 -50 L-40 500 Z" fill="url(#aboutRibbon)" />
      <path d="M900 600 L1440 100 L1440 0 L850 600 Z" fill="#1b1f5e" fillOpacity="0.28" />
      <path d="M-100 475 L430 -50" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.2" />
      <path d="M920 600 L1440 120" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.12" />
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

function HeroLogoPlaceholder() {
  return (
    <div className="relative w-28 h-28 mx-auto mb-8">
      {/* Outer decorative ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ inset: "-10px", border: "1px solid rgba(245,192,0,0.12)" }}
      />
      {/* Main circle */}
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1b1f5e 0%, #252a7a 100%)",
          border: "2px solid rgba(245,192,0,0.35)",
        }}
      >
        {/*
          Replace with actual logo:
          <Image src="/comelec-bird.svg" alt="OLPS COMELEC" width={72} height={72} className="w-16 h-16 object-contain" />
        */}
        <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" aria-label="OLPS COMELEC logo placeholder">
          <circle cx="32" cy="32" r="26" stroke="#F5C000" strokeWidth="1.5" strokeOpacity="0.55" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={32 + 20 * Math.cos(rad)}
                y1={32 + 20 * Math.sin(rad)}
                x2={32 + 28 * Math.cos(rad)}
                y2={32 + 28 * Math.sin(rad)}
                stroke="#F5C000"
                strokeWidth="1.5"
                strokeOpacity="0.45"
              />
            );
          })}
          <path
            d="M20 38 C23 28 27 24 32 24 C37 24 41 28 44 38"
            stroke="#F5C000"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="32" cy="20" r="3.5" fill="#F5C000" fillOpacity="0.65" />
          <path
            d="M25 28 C21 24 15 23 14 25 C17 27 23 27 25 28Z"
            fill="none"
            stroke="#F5C000"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </svg>
      </div>
    </div>
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
  return <div className="w-20 h-px mx-auto opacity-50 mb-8 bg-gold" />;
}

// ── Main Component ──────────────────────────────────────────────

export default function AboutComelecClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen font-body text-white overflow-x-hidden"
      style={PAGE_BACKGROUND}
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

        <div className="hidden sm:flex items-center gap-4">
          {[
            { label: "COMELEC", href: "/about", active: true },
            { label: "LEADERSHIP", href: "/officers" },
            { label: "MAKER", href: "/creator" },
          ].map((link, index) => (
            <div key={link.label} className="flex items-center gap-4">
              {index > 0 && (
                <span className="font-body text-[0.65rem] text-gold/25" aria-hidden="true">
                  |
                </span>
              )}
              <Link
                href={link.href}
                className={`font-body text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-200 no-underline ${
                  link.active ? "text-gold" : "text-white/[0.45] hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-16 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(27,31,94,0.7) 0%, transparent 70%)" }}
          />
        </div>
        <HeroRibbons />

        {/* Fade-in content */}
        <div
          className={`relative z-10 text-center max-w-[680px] transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <HeroLogoPlaceholder />

          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-8 h-px bg-gold opacity-50" />
            <span
              className="font-body text-[0.6rem] tracking-[0.35em] uppercase"
              style={{ color: "rgba(245,192,0,0.65)" }}
            >
              Our Lady of Peace School
            </span>
            <div className="w-8 h-px bg-gold opacity-50" />
          </div>

          <p className="font-tagline text-[0.9rem] italic mb-3 tracking-[0.2em] text-gold/[0.65]">
            VOX POPULI VOX DEI
          </p>

          <h1
            className="font-tagline font-black leading-none tracking-[0.05em] uppercase mb-2"
            style={{
              fontSize: "clamp(2.75rem, 8vw, 5.5rem)",
              color: "#ffffff",
            }}
          >
            COMELEC
          </h1>

          <p
            className="font-tagline font-bold uppercase tracking-[0.22em] mb-8 text-gold"
            style={{ fontSize: "clamp(0.9rem, 2vw, 1.3rem)" }}
          >
            Commission on Elections
          </p>

          <GoldRule />

          <p
            className="font-body text-[0.875rem] leading-[1.85]"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            The OLPS Commission on Elections is the independent electoral body of Our Lady of
            Peace School. It manages school elections and helps students practice civic
            responsibility.
          </p>
        </div>
      </section>

      {/* ── MISSION / VISION / DESCRIPTION ───────────────── */}
      <section className="px-6 py-20">
        <div className="text-center mb-14">
          <Eyebrow label="S.Y. 2025–2026" />
          <h2
            className="font-tagline font-bold"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#ffffff" }}
          >
            Mission, Vision &amp; Description
          </h2>
        </div>

        <div
          className="grid gap-6 mx-auto"
          style={{ maxWidth: "960px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
        >
          {MVV.map((card) => (
            <div
              key={card.key}
              className="relative overflow-hidden transition-all duration-300"
              style={{
                padding: "2.5rem 2rem",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(27,31,94,0.22)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,192,0,0.22)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }}
              />
              {card.icon}
              <p
                className="font-body text-[0.58rem] tracking-[0.3em] uppercase mt-5 mb-2"
                style={{ color: "rgba(245,192,0,0.6)" }}
              >
                {card.label}
              </p>
              <p
                className="font-tagline font-bold mb-4"
                style={{ fontSize: "1.2rem", color: "#ffffff" }}
              >
                {card.heading}
              </p>
              <p
                className="font-body text-[0.82rem] leading-[1.8]"
                style={{ color: "rgba(255,255,255,0.52)" }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CORE PRINCIPLES ──────────────────────────────── */}
      <section
        className="px-6 py-16"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(27,31,94,0.12) 50%, transparent 100%)" }}
      >
        <div className="text-center mb-12">
          <Eyebrow label="Core Values" />
          <h2
            className="font-tagline font-bold"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#ffffff" }}
          >
            Our Guiding Principles
          </h2>
        </div>

        <div
          className="grid gap-4 mx-auto"
          style={{ maxWidth: "860px", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
        >
          {PRINCIPLES.map((p) => (
            <div
              key={p.num}
              className="text-center transition-all duration-[250ms] hover:-translate-y-1"
              style={{
                padding: "1.75rem 1.25rem",
                border: "1px solid rgba(245,192,0,0.1)",
                background: "rgba(13,15,43,0.6)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,192,0,0.32)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,192,0,0.1)";
              }}
            >
              <p
                className="font-mono text-[0.6rem] mb-3"
                style={{ color: "rgba(245,192,0,0.38)" }}
              >
                {p.num}
              </p>
              <p className="font-heading text-[0.825rem] font-bold mb-2 tracking-[0.04em]" style={{ color: "#ffffff" }}>
                {p.name}
              </p>
              <p className="font-body text-[0.7rem] leading-[1.55]" style={{ color: "#8a8fbb" }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MILESTONES ───────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="text-center mb-14">
          <Eyebrow label="Our History" />
          <h2
            className="font-tagline font-bold"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "#ffffff" }}
          >
            Milestones
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative max-w-[680px] mx-auto">
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: "76px", width: "1px", background: "rgba(245,192,0,0.14)" }}
          />

          {MILESTONES.map((m) => (
            <div key={m.year} className="flex gap-8 mb-10 items-start">
              {/* Year */}
              <span
                className="flex-shrink-0 text-right font-mono text-[0.7rem] pt-0.5"
                style={{ width: "68px", color: "#F5C000", opacity: 0.7 }}
              >
                {m.year}
              </span>
              {/* Dot */}
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full mt-1"
                style={{
                  background: "#F5C000",
                  opacity: m.highlight ? 1 : 0.45,
                  boxShadow: m.highlight ? "0 0 8px rgba(245,192,0,0.5)" : "none",
                }}
              />
              {/* Content */}
              <div className="flex-1">
                <p className="font-heading font-bold text-[0.875rem] mb-1" style={{ color: "#ffffff" }}>
                  {m.title}
                </p>
                <p className="font-body text-[0.78rem] leading-[1.65]" style={{ color: "#8a8fbb" }}>
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT BAND ─────────────────────────────────── */}
      <section
        className="relative px-6 py-16 overflow-hidden"
        style={{
          borderTop: "1px solid rgba(245,192,0,0.14)",
          borderBottom: "1px solid rgba(245,192,0,0.14)",
          background: "rgba(27,31,94,0.28)",
        }}
      >
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
          }}
        />

        <div className="relative max-w-[680px] mx-auto text-center">
          <Eyebrow label="Reach Us" />
          <h2
            className="font-tagline font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "#ffffff" }}
          >
            Connect with OLPS COMELEC
          </h2>
          <p
            className="font-body text-[0.875rem] leading-[1.7] mb-10 mx-auto"
            style={{ maxWidth: "480px", color: "rgba(255,255,255,0.5)" }}
          >
            For inquiries, complaints, election-related concerns, or media requests,
            reach us through our official channels.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {/* Email */}
            <a
              href="mailto:comelec.club@olps.edu.ph"
              className="inline-flex items-center gap-3 no-underline font-body font-semibold text-[0.75rem] tracking-[0.1em] uppercase transition-all duration-200"
              style={{
                padding: "0.875rem 1.75rem",
                background: "#F5C000",
                color: "#0d0f2b",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(245,192,0,0.85)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#F5C000";
              }}
              aria-label="Email OLPS COMELEC at comelec.club@olps.edu.ph"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              comelec.club@olps.edu.ph
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/comelec.olps"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 no-underline font-body font-semibold text-[0.75rem] tracking-[0.1em] uppercase transition-all duration-200"
              style={{
                padding: "0.875rem 1.75rem",
                border: "1px solid rgba(245,192,0,0.28)",
                color: "rgba(255,255,255,0.7)",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,192,0,0.6)";
                (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(245,192,0,0.28)";
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
              }}
              aria-label="OLPS COMELEC on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
              OLPS COMELEC on Facebook
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
