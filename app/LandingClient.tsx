"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ComelecBirdPlaceholder } from "./_components/ComelecBirdPlaceholder";
import { CountdownUnit } from "./_components/CountdownUnit";
import { DivisionStatusCard } from "./_components/DivisionStatusCard";
import { InfoBand } from "./_components/InfoBand";
import { LandingFooter } from "./_components/LandingFooter";
import { LandingNav } from "./_components/LandingNav";
import { WaveRibbon } from "./_components/WaveRibbon";
import { useCountdown } from "./_components/useCountdown";
import type { CountdownTarget, DivisionCard } from "./_components/landing-shared";

interface Props {
  divisionCards: DivisionCard[];
  countdownTarget: CountdownTarget | null;
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
      <LandingNav />

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
          {divisionCards.map((card, i) => (
            <DivisionStatusCard key={card.division} card={card} index={i} />
          ))}
        </div>
      </section>

      {/* ── INFO BAND ───────────────────────────────────────────────── */}
      {countdownTarget && <InfoBand target={countdownTarget} />}

      <LandingFooter />
    </div>
  );
}
