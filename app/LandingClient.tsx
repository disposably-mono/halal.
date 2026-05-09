"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface DivisionCard {
  division: string;
  label: string;
  sublabel: string;
  election: {
    id: string;
    name: string;
    status: string;
    scheduledOpen: string;
    scheduledClose: string;
    _count: { voters: number };
  } | null;
}

interface CountdownTarget {
  date: string;
  electionName: string;
  status: string;
}

interface Props {
  divisionCards: DivisionCard[];
  countdownTarget: CountdownTarget | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  OPEN: {
    label: "Voting Open",
    color: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "text-gold border-gold/40 bg-gold/10",
    dot: "bg-gold",
  },
  DRAFT: {
    label: "In Setup",
    color: "text-mid border-mid/40 bg-mid/10",
    dot: "bg-mid",
  },
  CLOSED: {
    label: "Closed",
    color: "text-maroon border-maroon/40 bg-maroon/10",
    dot: "bg-maroon",
  },
};

function useCountdown(target: string | null) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!target) return;
    const targetDate = new Date(target).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-navy border border-gold/30 flex items-center justify-center rounded-sm">
          <span className="font-mono text-2xl sm:text-3xl text-gold font-bold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="font-body text-[10px] sm:text-xs text-mid uppercase tracking-[0.2em] mt-1.5">
        {label}
      </span>
    </div>
  );
}

function ComelecBirdPlaceholder() {
  return (
    <div className="w-24 h-24 sm:w-32 sm:h-32 relative flex items-center justify-center">
      {/* Sun rays */}
      <svg
        viewBox="0 0 128 128"
        className="absolute inset-0 w-full h-full opacity-20"
        aria-hidden="true"
      >
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * 360;
          const rad = (angle * Math.PI) / 180;
          const x1 = 64 + 28 * Math.cos(rad);
          const y1 = 64 + 28 * Math.sin(rad);
          const x2 = 64 + 60 * Math.cos(rad);
          const y2 = 64 + 60 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#F5C000"
              strokeWidth={i % 2 === 0 ? 2 : 1}
            />
          );
        })}
        <circle cx="64" cy="64" r="26" fill="none" stroke="#F5C000" strokeWidth="1.5" />
      </svg>
      {/* Try real SVG first, fall back to initials */}
      <div className="relative z-10 w-14 h-14 sm:w-18 sm:h-18">
        <Image
          src="/comelec-bird.svg"
          alt="OLPS COMELEC"
          width={72}
          height={72}
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(245,192,0,0.4)]"
          onError={(e) => {
            // Hide broken image, show fallback
            (e.target as HTMLElement).style.display = "none";
            const fallback = (e.target as HTMLElement)
              .closest(".bird-container")
              ?.querySelector(".bird-fallback") as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="bird-fallback hidden absolute inset-0 items-center justify-center"
          aria-hidden="true"
        >
          <span className="font-heading text-gold text-2xl font-bold tracking-wider">
            OLPS
          </span>
        </div>
      </div>
    </div>
  );
}

// Diagonal wave ribbon SVG
function WaveRibbon() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1440 700"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B1A1A" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#6B1A1A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6B1A1A" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Diagonal ribbon bands */}
      <path
        d="M-100 550 L500 -50 L560 -50 L-40 550 Z"
        fill="url(#ribbonGrad)"
      />
      <path
        d="M200 700 L800 100 L830 100 L230 700 Z"
        fill="#6B1A1A"
        fillOpacity="0.15"
      />
      {/* Gold accent lines */}
      <path
        d="M-100 520 L480 -50"
        stroke="#F5C000"
        strokeWidth="0.5"
        strokeOpacity="0.3"
      />
      <path
        d="M220 700 L820 80"
        stroke="#F5C000"
        strokeWidth="0.5"
        strokeOpacity="0.2"
      />
    </svg>
  );
}

export default function LandingClient({ divisionCards, countdownTarget }: Props) {
  const countdown = useCountdown(
    countdownTarget?.status === "SCHEDULED" ? countdownTarget.date : null
  );
  const anyOpen = divisionCards.some((c) => c.election?.status === "OPEN");

  // Staggered entrance animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-navy-deep text-white overflow-x-hidden">
      {/* ── NAV ───────────────────────────────────────────────────── */}
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
        <div className="hidden sm:flex gap-6">
          {[
            { label: "Home", href: "/", active: true },
            { label: "Creator", href: "/creator" },
            { label: "About COMELEC", href: "/about" },
            { label: "Officers", href: "/officers" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-body text-[0.65rem] tracking-[0.2em] uppercase transition-colors duration-200"
              style={{ color: link.active ? "#F5C000" : "rgba(255,255,255,0.45)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#F5C000 1px, transparent 1px), linear-gradient(90deg, #F5C000 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[600px] h-[600px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(27,31,94,0.8) 0%, transparent 70%)",
            }}
          />
        </div>
        <WaveRibbon />

        {/* Content */}
        <div
          className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
        >
          {/* Bird logo */}
          <div className="bird-container mb-6">
            <ComelecBirdPlaceholder />
          </div>

          {/* Org label */}
          <p
            className="font-body text-gold/70 text-xs tracking-[0.35em] uppercase mb-3"
            style={{ transitionDelay: "100ms" }}
          >
            OLPS COMELEC — Commission on Elections
          </p>

          {/* Tagline */}
          <p className="font-tagline text-white/50 text-base sm:text-lg italic mb-4 tracking-wide">
            VOX POPULI VOX DEI
          </p>

          {/* Election name / hero headline */}
          {countdownTarget ? (
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-white leading-none tracking-wide mb-2 uppercase">
              {countdownTarget.electionName}
            </h1>
          ) : (
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl text-white leading-none tracking-wide mb-2 uppercase">
              OLPS Elections
            </h1>
          )}

          {/* Gold rule */}
          <div className="w-24 h-px bg-gold my-6 opacity-60" />

          {/* Countdown */}
          {countdownTarget?.status === "SCHEDULED" && !countdown.expired && (
            <div className="mb-8">
              <p className="font-body text-mid text-xs tracking-[0.2em] uppercase mb-4">
                Voting opens in
              </p>
              <div className="flex items-start gap-3 sm:gap-4">
                <CountdownUnit value={countdown.days} label="Days" />
                <span className="font-mono text-gold/40 text-2xl mt-4">:</span>
                <CountdownUnit value={countdown.hours} label="Hours" />
                <span className="font-mono text-gold/40 text-2xl mt-4">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="font-mono text-gold/40 text-2xl mt-4">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            {anyOpen && (
              <Link
                href="/vote"
                className="px-8 py-3.5 bg-gold text-navy font-heading font-bold text-sm tracking-[0.15em] uppercase hover:bg-gold/90 transition-colors rounded-sm"
              >
                Cast Your Vote
              </Link>
            )}
            <Link
              href="/results"
              className="px-8 py-3.5 border border-white/20 text-white/70 font-heading text-sm tracking-[0.15em] uppercase hover:border-gold/40 hover:text-gold/80 transition-colors rounded-sm"
            >
              View Results
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="font-body text-[10px] tracking-[0.3em] uppercase text-white">
            Scroll
          </span>
          <div className="w-px h-8 bg-white/50" />
        </div>
      </section>

      {/* ── DIVISION CARDS ──────────────────────────────────────────── */}
      <section className="relative py-20 px-6">
        {/* Section label */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center gap-4">
            <div className="w-8 h-px bg-gold" />
            <span className="font-body text-gold/70 text-xs tracking-[0.3em] uppercase">
              Elections
            </span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mt-3 tracking-wide">
            Division Status
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {divisionCards.map(({ division, label, sublabel, election }, i) => {
            const status = election?.status ?? null;
            const cfg = status ? STATUS_CONFIG[status] : null;

            return (
              <div
                key={division}
                className={`relative border border-white/10 bg-navy/40 rounded-sm p-5 flex flex-col gap-3 hover:border-gold/20 transition-all duration-300 ${status === "OPEN" ? "border-gold/25 bg-navy/60" : ""
                  }`}
                style={{
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {/* Division code */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-3xl text-white/20 leading-none">
                    {division}
                  </span>
                  {cfg && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-body tracking-[0.15em] uppercase border px-2 py-1 rounded-sm ${cfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === "OPEN" ? "animate-pulse" : ""}`} />
                      {cfg.label}
                    </span>
                  )}
                  {!cfg && (
                    <span className="text-[10px] font-body tracking-[0.15em] uppercase text-mid">
                      —
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <p className="font-heading font-bold text-white text-base leading-tight">
                    {label}
                  </p>
                  <p className="font-body text-mid text-xs mt-0.5">{sublabel}</p>
                </div>

                {/* Election name if exists */}
                {election && (
                  <p className="font-body text-white/40 text-xs leading-snug border-t border-white/5 pt-3">
                    {election.name}
                  </p>
                )}

                {/* Voter count */}
                {election && election._count.voters > 0 && (
                  <p className="font-mono text-mid text-[11px]">
                    {election._count.voters.toLocaleString()} registered voters
                  </p>
                )}

                {/* No election */}
                {!election && (
                  <p className="font-body text-mid/50 text-xs italic">
                    No election scheduled
                  </p>
                )}

                {/* Gold left border accent for OPEN */}
                {status === "OPEN" && (
                  <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gold rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── INFO BAND ───────────────────────────────────────────────── */}
      {countdownTarget && (
        <section className="relative border-y border-gold/20 bg-navy/60 py-10 px-6 overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
            }}
          />
          <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-body text-gold/60 text-xs tracking-[0.3em] uppercase mb-1">
                Election Schedule
              </p>
              <p className="font-heading font-bold text-white text-lg">
                {countdownTarget.electionName}
              </p>
            </div>
            {countdownTarget.status === "OPEN" && (
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-heading font-bold text-emerald-400 text-sm tracking-widest uppercase">
                  Voting is now open
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
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
