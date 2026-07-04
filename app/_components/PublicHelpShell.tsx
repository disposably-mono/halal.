import type { ReactNode } from "react";
import Link from "next/link";
import { LandingFooter } from "@/app/_components/LandingFooter";
import { LandingNav } from "@/app/_components/LandingNav";

const PAGE_BACKGROUND = {
  backgroundColor: "#0d0f2b",
  backgroundImage: [
    "radial-gradient(circle at 50% 12%, rgba(27,31,94,0.72) 0%, transparent 34rem)",
    "radial-gradient(circle at 10% 55%, rgba(107,26,26,0.16) 0%, transparent 25rem)",
    "radial-gradient(circle at 90% 78%, rgba(245,192,0,0.05) 0%, transparent 22rem)",
    "repeating-linear-gradient(135deg, transparent 0 34rem, rgba(107,26,26,0.18) 34rem 38rem, transparent 38rem 72rem)",
    "repeating-linear-gradient(135deg, transparent 0 50rem, rgba(27,31,94,0.26) 50rem 54rem, transparent 54rem 96rem)",
    "linear-gradient(rgba(245,192,0,0.03) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(245,192,0,0.03) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "auto, auto, auto, auto, auto, 48px 48px, 48px 48px",
  backgroundAttachment: "fixed",
};

export function PublicHelpShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden font-body text-white" style={PAGE_BACKGROUND}>
      <LandingNav />
      <main>
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden border-b border-gold/10 px-[27px] pb-[72px] pt-[127px] text-center">
          <HelpRibbons />
          <div className="absolute inset-[0px] flex items-center justify-center pointer-events-none">
            <div
              className="h-[32rem] w-[32rem] rounded-full"
              style={{ background: "radial-gradient(ellipse, rgba(27,31,94,0.72) 0%, transparent 70%)" }}
            />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl">
            <div className="mb-[19px] flex items-center justify-center gap-[19px]">
              <div className="h-px w-[36px] bg-gold/55" />
              <p className="text-[12px] uppercase tracking-[0.34em] text-gold/70">{eyebrow}</p>
              <div className="h-px w-[36px] bg-gold/55" />
            </div>
            <h1 className="font-tagline text-[54px] font-bold uppercase leading-none tracking-wider text-white sm:text-[81px]">{title}</h1>
            <div className="mx-auto my-[27px] h-px w-[72px] bg-gold/45" />
            <p className="mx-auto max-w-2xl text-[17px] leading-[32px] text-white/55 sm:text-[19px]">{description}</p>
          </div>
        </section>
        {children}
        <div className="border-t border-white/6 px-[27px] py-[45px] text-center">
          <Link
            href="/"
            className="font-body text-[14px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-gold"
          >
            ← Back to home
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

export function HelpTexturedBand() {
  return (
    <>
      <div className="pointer-events-none absolute inset-[0px] bg-navy/25" />
      <div
        className="pointer-events-none absolute inset-[0px] opacity-[0.045]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
        }}
      />
      <HelpRibbons subtle />
    </>
  );
}

function HelpRibbons({ subtle = false }: { subtle?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-[0px] h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 1440 720"
    >
      <path d="M-150 720 470-60h120L-30 720Z" fill="#6B1A1A" fillOpacity={subtle ? "0.2" : "0.16"} />
      {subtle && <path d="M70 720 690-60h78L148 720Z" fill="#1B1F5E" fillOpacity="0.28" />}
      <path d="m720 720 620-780h190L910 720Z" fill="#1B1F5E" fillOpacity={subtle ? "0.25" : "0.21"} />
      {subtle && <path d="m1160 720 380-480v150l-260 330Z" fill="#6B1A1A" fillOpacity="0.18" />}
      <path d="M-40 690 500-10" stroke="#F5C000" strokeOpacity={subtle ? "0.12" : "0.07"} />
      <path d="m940 720 500-630" stroke="#F5C000" strokeOpacity={subtle ? "0.09" : "0.05"} />
    </svg>
  );
}

export function HelpSectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-[12px] uppercase tracking-[0.32em] text-gold/65">{eyebrow}</p>
      <h2 className="mt-[14px] font-tagline text-[34px] font-bold uppercase tracking-wide text-white sm:text-[41px]">{title}</h2>
      <p className="mt-[19px] text-[17px] leading-[27px] text-white/50">{body}</p>
    </div>
  );
}

export function HelpCheckIcon() {
  return (
    <svg aria-hidden="true" className="mt-[5px] h-[17px] w-[17px] shrink-0 text-emerald-400/75" viewBox="0 0 16 16" fill="none">
      <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HelpWorkflowArrow() {
  return (
    <div aria-hidden="true" className="flex justify-center py-[5px] text-gold/35 lg:px-[5px] lg:py-[0px]">
      <svg className="h-[23px] w-[23px] rotate-90 lg:rotate-0" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
