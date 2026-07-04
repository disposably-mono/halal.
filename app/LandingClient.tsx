"use client";

import { Link } from "next-view-transitions";
import { ComelecBirdPlaceholder } from "./_components/ComelecBirdPlaceholder";
import { CountdownUnit } from "./_components/CountdownUnit";
import { DivisionStatusCard } from "./_components/DivisionStatusCard";
import { FadeInSection } from "./_components/FadeInSection";
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

const PAGE_BACKGROUND = {
  backgroundColor: "#0f1235",
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

export default function LandingClient({ divisionCards, countdownTarget }: Props) {
  const countdown = useCountdown(
    countdownTarget?.status === "SCHEDULED" ? countdownTarget.date : null
  );
  const anyOpen = divisionCards.some((c) => c.election?.status === "OPEN");

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={PAGE_BACKGROUND}>
      <LandingNav />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Radial glow behind logo */}
        <div className="absolute inset-[0px] flex items-center justify-center pointer-events-none">
          <div
            className="w-[678px] h-[678px] rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(27,31,94,0.8) 0%, transparent 70%)",
            }}
          />
        </div>
        <WaveRibbon />

        {/* Content */}
        <FadeInSection className="relative z-10 flex flex-col items-center text-center px-[27px]">
          {/* Bird logo */}
          <div className="bird-container mb-[27px]">
            <ComelecBirdPlaceholder />
          </div>

          {/* Org label */}
          <p
            className="font-body text-gold/70 text-[14px] tracking-[0.35em] uppercase mb-[14px]"
            style={{ transitionDelay: "100ms" }}
          >
            OLPS COMELEC — Commission on Elections
          </p>

          {/* Tagline */}
          <p className="font-tagline text-white/60 text-[19px] sm:text-[20px] italic mb-[19px] tracking-wide">
            VOX POPULI VOX DEI
          </p>

          {/* Election name / hero headline */}
          {countdownTarget ? (
            <h1 className="font-display text-[54px] sm:text-[81px] lg:text-[108px] text-white leading-none tracking-wide mb-[10px] uppercase">
              {countdownTarget.electionName}
            </h1>
          ) : (
            <h1 className="font-display text-[54px] sm:text-[81px] lg:text-[108px] text-white leading-none tracking-wide mb-[10px] uppercase">
              OLPS Elections
            </h1>
          )}

          {/* Gold rule */}
          <div className="w-[108px] h-px bg-gold my-[27px] opacity-60" />

          {/* Countdown */}
          {countdownTarget?.status === "SCHEDULED" && !countdown.expired && (
            <div className="mb-[36px]">
              <p className="font-body text-mid text-[14px] tracking-[0.2em] uppercase mb-[19px]">
                Voting opens in
              </p>
              <div className="flex items-start gap-[14px] sm:gap-[19px]">
                <CountdownUnit value={countdown.days} label="Days" />
                <span className="font-mono text-gold/40 text-[27px] mt-[19px]">:</span>
                <CountdownUnit value={countdown.hours} label="Hours" />
                <span className="font-mono text-gold/40 text-[27px] mt-[19px]">:</span>
                <CountdownUnit value={countdown.minutes} label="Min" />
                <span className="font-mono text-gold/40 text-[27px] mt-[19px]">:</span>
                <CountdownUnit value={countdown.seconds} label="Sec" />
              </div>
            </div>
          )}

          {/* CTAs — Vote then Verify share the same availability (an election
              is open); View Results is always reachable. */}
          <div className="flex flex-col sm:flex-row gap-[14px] mt-[10px]">
            {anyOpen && (
              <Link
                href="/vote"
                className="px-[36px] py-[17px] bg-gold text-navy font-heading font-bold text-[17px] tracking-[0.15em] uppercase hover:bg-gold/90 transition-colors rounded-sm"
              >
                Cast Your Vote
              </Link>
            )}
            {anyOpen && (
              <Link
                href="/verify"
                className="px-[36px] py-[17px] border border-gold/30 text-gold/70 font-heading text-[17px] tracking-[0.15em] uppercase hover:border-gold/60 hover:text-gold transition-colors rounded-sm"
              >
                Verify Receipt
              </Link>
            )}
            <Link
              href="/results"
              className="px-[36px] py-[17px] border border-white/20 text-white/70 font-heading text-[17px] tracking-[0.15em] uppercase hover:border-gold/40 hover:text-gold/80 transition-colors rounded-sm"
            >
              View Results
            </Link>
          </div>
        </FadeInSection>

        {/* Scroll indicator */}
        <div className="absolute bottom-[36px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-[10px] opacity-30">
          <span className="font-body text-[12px] tracking-[0.3em] uppercase text-white">
            Scroll
          </span>
          <div className="w-px h-[36px] bg-white/50" />
        </div>
      </section>

      {/* ── DIVISION CARDS ──────────────────────────────────────────── */}
      <section className="relative py-[90px] px-[27px]">
        {/* Section label */}
        <div className="max-w-5xl mx-auto mb-[54px]">
          <div className="flex items-center gap-[19px]">
            <div className="w-[36px] h-px bg-gold" />
            <span className="font-body text-gold/70 text-[14px] tracking-[0.3em] uppercase">
              Elections
            </span>
          </div>
          <h2 className="font-heading font-bold text-[34px] sm:text-[41px] text-white mt-[14px] tracking-wide">
            Division Status
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[19px]">
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
