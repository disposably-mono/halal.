"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { useRef, useState } from "react";
import { FadeInSection } from "../_components/FadeInSection";
import { LandingFooter } from "../_components/LandingFooter";
import { Eyebrow, NavBirdIcon } from "../_components/PublicPageDecor";

/* ─────────────────────────────────────────────
   OFFICERS PAGE — OLPS COMELEC
   S.Y. 2025–2026 (Active) + S.Y. 2024–2025 (Past)
   ───────────────────────────────────────────── */

// ── Data ────────────────────────────────────────────────────────

type Officer = {
  initials: string;
  role: string;
  name: string;
  photo?: string;
  featured?: boolean;
};

const OFFICERS_2526: Officer[] = [
  { initials: "AM",  role: "Moderator",        name: "Sir Amadeo Maniba",              photo: "/officers/2025-2026/0.png",  featured: true },
  { initials: "MJT", role: "Chairperson",       name: "Mikel Josef F. Taopa",           photo: "/officers/2025-2026/1.png",  featured: true },
  { initials: "KAM", role: "Vice-Chairperson",  name: "Kristine Angelie P. Martinez",   photo: "/officers/2025-2026/2.png",  featured: true },
  { initials: "KRC", role: "Internal Affairs Head",                   name: "Kirzel Rein F. Cruz",            photo: "/officers/2025-2026/3.png" },
  { initials: "ALR", role: "External Affairs Head",                   name: "Abisha Lilian J. Reyes",         photo: "/officers/2025-2026/4.png" },
  { initials: "YJC", role: "Executive Secretary",                     name: "Yuri Juliana G. Calingo",        photo: "/officers/2025-2026/5.png" },
  { initials: "JKC", role: "Electoral Ed., Reforms & Screening Head", name: "Jasley Keira A. Criste",         photo: "/officers/2025-2026/6.png" },
  { initials: "SNC", role: "Electoral Canvassing Head",               name: "Shyra Nicole C. Retirado",       photo: "/officers/2025-2026/7.png" },
  { initials: "AEF", role: "Electoral Complaint Committee Head",      name: "Athena Elisha V. Francisco",     photo: "/officers/2025-2026/8.png" },
  { initials: "ZRA", role: "SHS Information Officer",                 name: "Zaka Raia M. Asido",             photo: "/officers/2025-2026/9.png" },
  { initials: "IMP", role: "JHS Information Officer",                 name: "Ian Dhemetra M. Panganiban",     photo: "/officers/2025-2026/10.png" },
  { initials: "ORT", role: "GS Information Officer",                  name: "Olivia Rachel Faith L. Tolentino", photo: "/officers/2025-2026/11.png" },
];

const OFFICERS_2425: Officer[] = [
  { initials: "AM",  role: "Moderator",        name: "Sir Amadeo Maniba",       photo: "/officers/2024-2025/0.png", featured: true },
  { initials: "CAJ", role: "Chairperson",       name: "Crishelle Ann P. Jornacion", photo: "/officers/2024-2025/1.png", featured: true },
  { initials: "MT",  role: "Vice-Chairperson",  name: "Mikel Taopa",             photo: "/officers/2024-2025/2.png", featured: true },
  { initials: "MM",  role: "Internal Affairs Head",                   name: "Maryle Mopera",           photo: "/officers/2024-2025/3.png" },
  { initials: "CES", role: "External Affairs Head",                   name: "Christel Espiritu Santo",  photo: "/officers/2024-2025/4.png" },
  { initials: "JCD", role: "Executive Secretary",                     name: "Justine Chellzy Dikit",   photo: "/officers/2024-2025/5.png" },
  { initials: "MP",  role: "Electoral Ed., Reforms & Screening Head", name: "Matthew Pallagud",         photo: "/officers/2024-2025/6.png" },
  { initials: "CB",  role: "Electoral Operations Head",               name: "Caroline Balaoro",         photo: "/officers/2024-2025/7.png" },
  { initials: "GC",  role: "Electoral Canvassing Head",               name: "Gianne Candelario",        photo: "/officers/2024-2025/8.png" },
  { initials: "ZG",  role: "Electoral Complaint Committee Head",      name: "Zhaturnina Guimalan",      photo: "/officers/2024-2025/9.png" },
  { initials: "AR",  role: "SHS Information Officer",                 name: "Abisha Reyes",             photo: "/officers/2024-2025/10.png" },
  { initials: "KM",  role: "JHS Information Officer",                 name: "Kristine Martinez",        photo: "/officers/2024-2025/11.png" },
];

// Placeholder roster for the upcoming year — officers are not yet elected, so
// every entry uses a "To Be Announced" name and the initials-icon placeholder
// (no photo) until pubmats are added.
const OFFICERS_2627: Officer[] = [
  { initials: "TBA", role: "Moderator",        name: "To Be Announced", featured: true },
  { initials: "TBA", role: "Chairperson",       name: "To Be Announced", featured: true },
  { initials: "TBA", role: "Vice-Chairperson",  name: "To Be Announced", featured: true },
  { initials: "TBA", role: "Internal Affairs Head",                   name: "To Be Announced" },
  { initials: "TBA", role: "External Affairs Head",                   name: "To Be Announced" },
  { initials: "TBA", role: "Executive Secretary",                     name: "To Be Announced" },
  { initials: "TBA", role: "Electoral Ed., Reforms & Screening Head", name: "To Be Announced" },
  { initials: "TBA", role: "Electoral Canvassing Head",               name: "To Be Announced" },
  { initials: "TBA", role: "Electoral Complaint Committee Head",      name: "To Be Announced" },
  { initials: "TBA", role: "SHS Information Officer",                 name: "To Be Announced" },
  { initials: "TBA", role: "JHS Information Officer",                 name: "To Be Announced" },
  { initials: "TBA", role: "GS Information Officer",                  name: "To Be Announced" },
];

// ── Section grouping helpers ─────────────────────────────────────

const LEADERSHIP_ROLES = ["Moderator", "Chairperson", "Vice-Chairperson"];
const INFO_OFFICER_ROLES = [
  "SHS Information Officer",
  "JHS Information Officer",
  "GS Information Officer",
];

function groupOfficers(officers: Officer[]) {
  return {
    leadership:   officers.filter((o) => LEADERSHIP_ROLES.includes(o.role)),
    heads:        officers.filter((o) => !LEADERSHIP_ROLES.includes(o.role) && !INFO_OFFICER_ROLES.includes(o.role)),
    infoOfficers: officers.filter((o) => INFO_OFFICER_ROLES.includes(o.role)),
  };
}

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

export const OFFICER_PHOTO_SIZES =
  "(max-width: 639px) calc(50vw - 2rem), (max-width: 1023px) calc(33vw - 2rem), 264px";

// ── Decorative SVGs ──────────────────────────────────────────────

function HeroRibbons() {
  return (
    <svg
      className="absolute inset-[0px] w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 600"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="officersRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B1A1A" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6B1A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M-100 500 L450 -50 L510 -50 L-40 500 Z" fill="url(#officersRibbon)" />
      <path d="M900 600 L1440 100 L1440 0 L850 600 Z" fill="#1b1f5e" fillOpacity="0.28" />
      <path d="M-100 475 L430 -50" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.2" />
      <path d="M920 600 L1440 120" stroke="#F5C000" strokeWidth="0.5" strokeOpacity="0.12" />
    </svg>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[19px] my-[36px]">
      <div className="flex-1 h-px bg-white/5" />
      <span className="font-body text-[0.58rem] tracking-[0.28em] uppercase text-gold/50 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function OfficerCard({ officer, past = false, year }: { officer: Officer; past?: boolean; year: string }) {
  const isFeatured = officer.featured && !past;
  const isInfoOfficer = INFO_OFFICER_ROLES.includes(officer.role);

  const accentColor = isFeatured
    ? "#F5C000"
    : isInfoOfficer
      ? "rgba(107,26,26,0.7)"
      : "rgba(245,192,0,0.3)";

  return (
    <div
      className={`relative flex flex-col border rounded-sm overflow-hidden transition-all duration-300 group
        ${isFeatured ? "border-gold/30 bg-navy/50" : "border-white/8 bg-navy/25 hover:border-gold/20"}
        ${past ? "opacity-80 hover:opacity-100" : ""}
      `}
    >
      {/* Top accent bar */}
      <div className="h-[4px] shrink-0" style={{ background: accentColor }} />

      {/* Photo area — 4:5 aspect ratio */}
      <div className="relative w-full shrink-0" style={{ aspectRatio: "4/5" }}>
        {officer.photo ? (
          <Image src={officer.photo} alt={officer.name} fill sizes={OFFICER_PHOTO_SIZES} className="object-cover object-top" />
        ) : (
          <div
            className="absolute inset-[0px] flex flex-col items-center justify-center gap-[10px]"
            style={{ background: "linear-gradient(160deg, #1b1f5e 0%, #0f1235 100%)" }}
          >
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="absolute w-[90px] h-[90px] opacity-10" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 40 + 26 * Math.cos(rad);
                  const y1 = 40 + 26 * Math.sin(rad);
                  const x2 = 40 + 38 * Math.cos(rad);
                  const y2 = 40 + 38 * Math.sin(rad);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5C000" strokeWidth={i % 2 === 0 ? 1.5 : 0.75} />;
                })}
                <circle cx="40" cy="40" r="22" fill="none" stroke="#F5C000" strokeWidth="0.75" />
              </svg>
              <div
                className="w-[63px] h-[63px] rounded-full flex items-center justify-center z-10"
                style={{ border: "1.5px solid rgba(245,192,0,0.3)", background: "rgba(15,18,53,0.7)" }}
              >
                <span className="font-mono text-[17px] font-bold text-gold/50 tracking-wider">
                  {officer.initials}
                </span>
              </div>
            </div>
            <span className="font-body text-[11px] tracking-[0.2em] uppercase text-white/30 mt-[5px]">
              Add pubmat
            </span>
          </div>
        )}

        {!officer.photo && (
          <div className="absolute top-[10px] right-[10px] border border-gold/20 bg-gold/8 rounded-sm px-[7px] py-[2px]">
            <span className="font-body text-[10px] tracking-[0.15em] uppercase text-gold/50">Pubmat</span>
          </div>
        )}

        {isFeatured && (
          <div
            className="absolute inset-[0px] pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(27,31,94,0.6) 0%, transparent 50%)" }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-[14px] flex flex-col gap-[5px] flex-1">
        {isFeatured && (
          <div className="inline-flex items-center self-start border border-gold/20 bg-gold/8 rounded-sm px-[7px] py-[2px] mb-[2px]">
            <span className="font-body text-[10px] tracking-[0.2em] uppercase text-gold/70">
              {officer.role}
            </span>
          </div>
        )}
        {!isFeatured && (
          <p className="font-body text-[11px] tracking-[0.18em] uppercase text-gold/[0.55] leading-tight">
            {officer.role}
          </p>
        )}
        <p className={`font-tagline font-bold leading-snug text-white ${isFeatured ? "text-[0.9rem]" : "text-[0.8rem]"}`}>
          {officer.name}
        </p>
        <p className="font-mono text-[11px] text-white/35 mt-auto pt-[5px]">
          {year}
        </p>
      </div>
    </div>
  );
}

// ── Tab content ──────────────────────────────────────────────────

function OfficersGrid({ officers, past = false, year }: { officers: Officer[]; past?: boolean; year: string }) {
  const { leadership, heads, infoOfficers } = groupOfficers(officers);

  return (
    <div>
      <SectionDivider label="Leadership" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[19px] mb-[10px]">
        {leadership.map((o) => <OfficerCard key={o.role} officer={o} past={past} year={year} />)}
      </div>

      <SectionDivider label="Committee Heads" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[14px]">
        {heads.map((o) => <OfficerCard key={o.role} officer={o} past={past} year={year} />)}
      </div>

      {infoOfficers.length > 0 && (
        <>
          <SectionDivider label="Information Officers" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[14px]">
            {infoOfficers.map((o) => <OfficerCard key={o.role} officer={o} past={past} year={year} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function OfficersPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "current" | "past">("current");
  const gridRef = useRef<HTMLElement>(null);

  const TABS: { key: "upcoming" | "current" | "past"; label: string }[] = [
    { key: "upcoming", label: "S.Y. 2026–2027" },
    { key: "current", label: "S.Y. 2025–2026" },
    { key: "past", label: "S.Y. 2024–2025" },
  ];

  return (
    <div
      className="min-h-screen font-body text-white overflow-x-hidden"
      style={PAGE_BACKGROUND}
    >
      {/* ── NAV ──────────────────────────────────────────── */}
      <nav
        className="fixed top-[0px] left-[0px] right-[0px] z-50 flex items-center justify-between px-[36px] py-[19px]"
        style={{
          background: "rgba(13,15,43,0.88)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,192,0,0.1)",
        }}
      >
        <Link href="/" className="flex items-center gap-[12px] no-underline" aria-label="OLPS COMELEC home">
          <div
            className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
            style={{ background: "#1b1f5e", border: "1px solid rgba(245,192,0,0.4)" }}
          >
            <NavBirdIcon />
          </div>
          <span className="font-tagline text-[17px] font-bold tracking-[0.15em] text-gold">
            OLPS COMELEC
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-[19px]">
          {[
            { label: "COMELEC", href: "/about" },
            { label: "LEADERSHIP", href: "/officers", active: true },
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
                className={`font-body text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-200 no-underline ${
                  link.active ? "text-gold" : "text-white/45 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            </div>
          ))}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-[27px] pt-[127px] pb-[36px] overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-[0px] flex items-center justify-center pointer-events-none">
          <div
            className="w-[791px] h-[791px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(27,31,94,0.7) 0%, transparent 70%)" }}
          />
        </div>
        <HeroRibbons />

        {/* Fade-in content */}
        <FadeInSection className="relative z-10 text-center max-w-[723px] w-full">
          <Eyebrow label="OLPS COMELEC" />

          <h1
            className="font-tagline font-bold leading-none tracking-wider uppercase text-white"
            style={{ fontSize: "clamp(3rem, 9vw, 5.5rem)" }}
          >
            Officers
          </h1>

          <div className="w-[54px] h-px bg-gold/50 mx-auto my-[23px]" />

          <p className="font-tagline italic text-gold/60 text-[17px] sm:text-[19px] tracking-wider mb-[14px]">
            VOX POPULI VOX DEI
          </p>

          <p
            className="font-body text-[0.8rem] leading-relaxed mb-[45px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Meet the OLPS COMELEC officers.
          </p>

          {/* School year tabs — inline in hero */}
          <div
            className="inline-flex border rounded-sm overflow-hidden"
            style={{ borderColor: "rgba(245,192,0,0.2)" }}
          >
            {TABS.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  gridRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-[19px] sm:px-[27px] py-[10px] font-body text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] uppercase transition-all duration-200 outline-hidden cursor-pointer ${i > 0 ? "border-l" : "border-none"}`}
                style={{
                  borderColor: "rgba(245,192,0,0.2)",
                  background: activeTab === tab.key ? "#F5C000" : "transparent",
                  color: activeTab === tab.key ? "#0d0f2b" : "rgba(255,255,255,0.4)",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* ── OFFICERS GRID ────────────────────────────────── */}
      <main ref={gridRef} className="max-w-6xl mx-auto px-[27px] py-[45px]">
        {activeTab === "upcoming" ? (
          <OfficersGrid officers={OFFICERS_2627} past={false} year="S.Y. 2026–2027" />
        ) : activeTab === "current" ? (
          <OfficersGrid officers={OFFICERS_2526} past={false} year="S.Y. 2025–2026" />
        ) : (
          <OfficersGrid officers={OFFICERS_2425} past={true} year="S.Y. 2024–2025" />
        )}
      </main>

      <LandingFooter
        eyebrow="Member Applications"
        title="Interested in serving with COMELEC?"
        description="Contact Sir Amadeo Maniba to ask about member applications and requirements."
        signal="Applications still open"
      />
    </div>
  );
}
