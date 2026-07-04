"use client";

import { Link } from "next-view-transitions";

type FooterAction = {
  href: string;
  label: string;
  ariaLabel?: string;
};

type LandingFooterProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  signal?: string;
  action?: FooterAction;
};

export function LandingFooter({
  eyebrow,
  title,
  description,
  signal,
  action,
}: LandingFooterProps) {
  const hasContactBand = Boolean(eyebrow || title || description || signal || action);

  return (
    <footer className="border-t border-white/5">
      {hasContactBand && (
        <div className="relative border-y border-gold/20 bg-navy/60 py-[45px] px-[27px] overflow-hidden">
          <div
            className="absolute inset-[0px] opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
            }}
          />
          <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-[27px]">
            <div className="max-w-2xl">
              {eyebrow && (
                <p className="font-body text-gold/60 text-[14px] tracking-[0.3em] uppercase mb-[5px]">
                  {eyebrow}
                </p>
              )}
              {title && (
                <p className="font-heading font-bold text-white text-[20px]">{title}</p>
              )}
              {description && (
                <p className="font-body text-mid/65 text-[17px] leading-[27px] mt-[10px]">
                  {description}
                </p>
              )}
            </div>

            {(signal || action) && (
              <div className="flex flex-col sm:items-end gap-[14px]">
                {signal && (
                  <div className="flex items-center gap-[14px]">
                    <span className="w-[10px] h-[10px] rounded-full bg-emerald-400" />
                    <span className="font-heading font-bold text-emerald-400 text-[17px] tracking-widest uppercase">
                      {signal}
                    </span>
                  </div>
                )}
                {action && (
                  <a
                    href={action.href}
                    aria-label={action.ariaLabel ?? action.label}
                    className="inline-flex items-center justify-center rounded-sm border border-gold/30 px-[23px] py-[12px] font-heading text-[14px] font-bold uppercase tracking-[0.18em] text-gold/80 transition-colors hover:border-gold/60 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                  >
                    {action.label}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-[27px] py-[54px]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-[19px] text-center">
        <p className="font-tagline text-white/40 text-[17px] italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/50 text-[14px] tracking-wide">
          OLPS COMELEC — Commission on Elections
        </p>
        <p className="font-body text-mid/30 text-[13px]">Our Lady of Peace School</p>
        <div className="flex items-center gap-[14px] pt-[10px] font-body text-[12px] uppercase tracking-[0.16em]">
          <Link href="/voter-help" className="text-white/35 transition-colors hover:text-gold">
            Voter Help
          </Link>
          <span className="text-gold/20" aria-hidden="true">|</span>
          <Link href="/admin-help" className="text-white/35 transition-colors hover:text-gold">
            Officer Help
          </Link>
          <span className="text-gold/20" aria-hidden="true">|</span>
          <Link href="/privacy" className="text-white/35 transition-colors hover:text-gold">
            Privacy
          </Link>
        </div>
        </div>
      </div>
    </footer>
  );
}
