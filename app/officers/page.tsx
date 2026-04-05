"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

/* ─────────────────────────────────────────────
   OFFICERS PAGE — OLPS COMELEC
   S.Y. 2025–2026 (Active) + S.Y. 2024–2025 (Past)
   ───────────────────────────────────────────── */

// ── Data ────────────────────────────────────────────────────────

type Officer = {
  initials: string;
  role: string;
  name: string;
  photo?: string; // path to public/officers/<filename>
  featured?: boolean;
};

const OFFICERS_2526: Officer[] = [
  {
    initials: "AM",
    role: "Moderator",
    name: "Sir Amadeo Maniba",
    photo: "/officers/2025-2026/0.png",
    featured: true,
  },
  {
    initials: "MJT",
    role: "Chairperson",
    name: "Mikel Josef F. Taopa",
    photo: "/officers/2025-2026/1.png",
    featured: true,
  },
  {
    initials: "KAM",
    role: "Vice-Chairperson",
    name: "Kristine Angelie P. Martinez",
    photo: "/officers/2025-2026/2.png",
    featured: true,
  },
  {
    initials: "KRC",
    role: "Internal Affairs Head",
    name: "Kirzel Rein F. Cruz",
    photo: "/officers/2025-2026/3.png",
  },
  {
    initials: "ALR",
    role: "External Affairs Head",
    name: "Abisha Lilian J. Reyes",
    photo: "/officers/2025-2026/4.png",
  },
  {
    initials: "YJC",
    role: "Executive Secretary",
    name: "Yuri Juliana G. Calingo",
    photo: "/officers/2025-2026/5.png",
  },
  {
    initials: "JKC",
    role: "Electoral Ed., Reforms & Screening Head",
    name: "Jasley Keira A. Criste",
    photo: "/officers/2025-2026/6.png",
  },
  {
    initials: "SNC",
    role: "Electoral Canvassing Head",
    name: "Shyra Nicole C. Retirado",
    photo: "/officers/2025-2026/7.png",
  },
  {
    initials: "AEF",
    role: "Electoral Complaint Committee Head",
    name: "Athena Elisha V. Francisco",
    photo: "/officers/2025-2026/8.png",
  },
  {
    initials: "ZRA",
    role: "SHS Information Officer",
    name: "Zaka Raia M. Asido",
    photo: "/officers/2025-2026/9.png",
  },
  {
    initials: "IMP",
    role: "JHS Information Officer",
    name: "Ian Dhemetra M. Panganiban",
    photo: "/officers/2025-2026/10.png",
  },
  {
    initials: "ORT",
    role: "GS Information Officer",
    name: "Olivia Rachel Faith L. Tolentino",
    photo: "/officers/2025-2026/11.png",
  },
];

const OFFICERS_2425: Officer[] = [
  {
    initials: "AM",
    role: "Moderator",
    name: "Sir Amadeo Maniba",
    photo: "/officers/2024-2025/0.png",
    featured: true,
  },
  {
    initials: "CAJ",
    role: "Chairperson",
    name: "Crishelle Ann P. Jornacion",
    photo: "/officers/2024-2025/1.png",
    featured: true,
  },
  {
    initials: "MT",
    role: "Vice-Chairperson",
    name: "Mikel Taopa",
    photo: "/officers/2024-2025/2.png",
    featured: true,
  },
  {
    initials: "MM",
    role: "Internal Affairs Head",
    name: "Maryle Mopera",
    photo: "/officers/2024-2025/3.png",
  },
  {
    initials: "CES",
    role: "External Affairs Head",
    name: "Christel Espiritu Santo",
    photo: "/officers/2024-2025/4.png",
  },
  {
    initials: "JCD",
    role: "Executive Secretary",
    name: "Justine Chellzy Dikit",
    photo: "/officers/2024-2025/5.png",
  },
  {
    initials: "MP",
    role: "Electoral Ed., Reforms & Screening Head",
    name: "Matthew Pallagud",
    photo: "/officers/2024-2025/6.png",
  },
  {
    initials: "CB",
    role: "Electoral Operations Head",
    name: "Caroline Balaoro",
    photo: "/officers/2024-2025/7.png",
  },
  {
    initials: "GC",
    role: "Electoral Canvassing Head",
    name: "Gianne Candelario",
    photo: "/officers/2024-2025/8.png",
  },
  {
    initials: "ZG",
    role: "Electoral Complaint Committee Head",
    name: "Zhaturnina Guimalan",
    photo: "/officers/2024-2025/9.png",
  },
  {
    initials: "AR",
    role: "SHS Information Officer",
    name: "Abisha Reyes",
    photo: "/officers/2024-2025/10.png",
  },
  {
    initials: "KM",
    role: "JHS Information Officer",
    name: "Kristine Martinez",
    photo: "/officers/2024-2025/11.png",
  },
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
    leadership: officers.filter((o) => LEADERSHIP_ROLES.includes(o.role)),
    heads: officers.filter(
      (o) =>
        !LEADERSHIP_ROLES.includes(o.role) &&
        !INFO_OFFICER_ROLES.includes(o.role)
    ),
    infoOfficers: officers.filter((o) => INFO_OFFICER_ROLES.includes(o.role)),
  };
}

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

function NavBirdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.5" />
      <path d="M8 14c1-2 3-4 4-4s3 2 4 4" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="9" r="1.5" fill="#F5C000" />
    </svg>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <div className="w-8 h-px bg-gold opacity-60" />
      <span className="font-body text-[0.6rem] tracking-[0.35em] uppercase text-gold/70">
        {label}
      </span>
      <div className="w-8 h-px bg-gold opacity-60" />
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-white/5" />
      <span className="font-body text-[0.58rem] tracking-[0.28em] uppercase text-gold/50 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function OfficerCard({
  officer,
  past = false,
}: {
  officer: Officer;
  past?: boolean;
}) {
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
        ${isFeatured
          ? "border-gold/30 bg-navy/50"
          : "border-white/8 bg-navy/25 hover:border-gold/20"
        }
        ${past ? "opacity-80 hover:opacity-100" : ""}
      `}
    >
      {/* Top accent bar */}
      <div className="h-[3px] flex-shrink-0" style={{ background: accentColor }} />

      {/* Photo area — 4:5 aspect ratio matching pubmat format */}
      <div
        className="relative w-full flex-shrink-0"
        style={{ aspectRatio: "4/5" }}
      >
        {officer.photo ? (
          <Image
            src={officer.photo}
            alt={officer.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{
              background: "linear-gradient(160deg, #1b1f5e 0%, #0f1235 100%)",
            }}
          >
            {/* Decorative sun ring behind initials */}
            <div className="relative flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="absolute w-20 h-20 opacity-10" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * 360;
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 40 + 26 * Math.cos(rad);
                  const y1 = 40 + 26 * Math.sin(rad);
                  const x2 = 40 + 38 * Math.cos(rad);
                  const y2 = 40 + 38 * Math.sin(rad);
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#F5C000"
                      strokeWidth={i % 2 === 0 ? 1.5 : 0.75}
                    />
                  );
                })}
                <circle cx="40" cy="40" r="22" fill="none" stroke="#F5C000" strokeWidth="0.75" />
              </svg>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center z-10"
                style={{ border: "1.5px solid rgba(245,192,0,0.3)", background: "rgba(15,18,53,0.7)" }}
              >
                <span className="font-mono text-sm font-bold text-gold/50 tracking-wider">
                  {officer.initials}
                </span>
              </div>
            </div>
            <span className="font-body text-[9px] tracking-[0.2em] uppercase text-white/20 mt-1">
              Add pubmat
            </span>
          </div>
        )}

        {/* Pubmat badge */}
        {!officer.photo && (
          <div className="absolute top-2 right-2 border border-gold/20 bg-gold/8 rounded-sm px-1.5 py-0.5">
            <span className="font-body text-[8px] tracking-[0.15em] uppercase text-gold/50">
              Pubmat
            </span>
          </div>
        )}

        {/* Featured glow overlay */}
        {isFeatured && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(27,31,94,0.6) 0%, transparent 50%)",
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {isFeatured && (
          <div className="inline-flex items-center self-start border border-gold/20 bg-gold/8 rounded-sm px-1.5 py-0.5 mb-0.5">
            <span className="font-body text-[8px] tracking-[0.2em] uppercase text-gold/70">
              {officer.role}
            </span>
          </div>
        )}
        {!isFeatured && (
          <p className="font-body text-[9px] tracking-[0.18em] uppercase text-gold/55 leading-tight">
            {officer.role}
          </p>
        )}
        <p className={`font-heading font-bold leading-snug text-white ${isFeatured ? "text-[0.9rem]" : "text-[0.8rem]"}`}>
          {officer.name}
        </p>
        <p className="font-mono text-[9px] text-white/25 mt-auto pt-1">
          {past ? "S.Y. 2024–2025" : "S.Y. 2025–2026"}
        </p>
      </div>
    </div>
  );
}

// ── Tab content ──────────────────────────────────────────────────

function OfficersGrid({
  officers,
  past = false,
}: {
  officers: Officer[];
  past?: boolean;
}) {
  const { leadership, heads, infoOfficers } = groupOfficers(officers);

  return (
    <div>

      {/* Leadership */}
      <SectionDivider label="Leadership" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-2">
        {leadership.map((o) => (
          <OfficerCard key={o.name} officer={o} past={past} />
        ))}
      </div>

      {/* Heads */}
      <SectionDivider label="Committee Heads" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {heads.map((o) => (
          <OfficerCard key={o.name} officer={o} past={past} />
        ))}
      </div>

      {/* Info Officers — only for 25–26 which has GS */}
      {infoOfficers.length > 0 && (
        <>
          <SectionDivider label="Information Officers" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {infoOfficers.map((o) => (
              <OfficerCard key={o.name} officer={o} past={past} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

export default function OfficersPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

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
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
          aria-label="OLPS COMELEC home"
        >
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
            { label: "Creator", href: "/creator" },
            { label: "About COMELEC", href: "/about" },
            { label: "Officers", href: "/officers", active: true },
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
      <section className="relative min-h-[55vh] flex flex-col items-center justify-center px-6 pt-28 pb-8 overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(27,31,94,0.7) 0%, transparent 70%)" }}
          />
        </div>
        <HeroRibbons />

        {/* Fade-in content */}
        <div
          className={`relative z-10 text-center max-w-[640px] w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          <Eyebrow label="OLPS COMELEC" />

          <h1
            className="font-display leading-none tracking-wide uppercase text-white"
            style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
          >
            Officers
          </h1>

          <div className="w-12 h-px bg-gold/50 mx-auto my-5" />

          <p className="font-tagline italic text-gold/60 text-sm sm:text-base tracking-wider">
            VOX POPULI VOX DEI
          </p>
        </div>
      </section>

      {/* ── TAB BAR ──────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 flex justify-center px-6 py-3"
        style={{
          background: "rgba(13,15,43,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,192,0,0.08)",
        }}
      >
        <div
          className="flex border rounded-sm overflow-hidden"
          style={{ borderColor: "rgba(245,192,0,0.2)" }}
        >
          <button
            onClick={() => setActiveTab("current")}
            className="px-6 py-2 font-body text-[0.65rem] tracking-[0.2em] uppercase transition-all duration-200 border-none outline-none cursor-pointer"
            style={{
              background: activeTab === "current" ? "#F5C000" : "transparent",
              color: activeTab === "current" ? "#0d0f2b" : "rgba(255,255,255,0.4)",
              fontWeight: activeTab === "current" ? 600 : 400,
            }}
          >
            S.Y. 2025–2026
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className="px-6 py-2 font-body text-[0.65rem] tracking-[0.2em] uppercase transition-all duration-200 border-none outline-none cursor-pointer border-l"
            style={{
              borderColor: "rgba(245,192,0,0.2)",
              background: activeTab === "past" ? "#F5C000" : "transparent",
              color: activeTab === "past" ? "#0d0f2b" : "rgba(255,255,255,0.4)",
              fontWeight: activeTab === "past" ? 600 : 400,
            }}
          >
            S.Y. 2024–2025
          </button>
        </div>
      </div>

      {/* ── OFFICERS GRID ────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {activeTab === "current" ? (
          <OfficersGrid officers={OFFICERS_2526} past={false} />
        ) : (
          <OfficersGrid officers={OFFICERS_2425} past={true} />
        )}
      </main>

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
