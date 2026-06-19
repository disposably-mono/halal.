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
        <div className="relative border-b border-gold/20 bg-navy/60 py-10 px-6 overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #F5C000 0px, #F5C000 1px, transparent 1px, transparent 12px)",
            }}
          />
          <div className="relative max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-2xl">
              {eyebrow && (
                <p className="font-body text-gold/60 text-xs tracking-[0.3em] uppercase mb-1">
                  {eyebrow}
                </p>
              )}
              {title && (
                <p className="font-heading font-bold text-white text-lg">{title}</p>
              )}
              {description && (
                <p className="font-body text-mid/[0.65] text-sm leading-6 mt-2">
                  {description}
                </p>
              )}
            </div>

            {(signal || action) && (
              <div className="flex flex-col sm:items-end gap-3">
                {signal && (
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-heading font-bold text-emerald-400 text-sm tracking-widest uppercase">
                      {signal}
                    </span>
                  </div>
                )}
                {action && (
                  <a
                    href={action.href}
                    aria-label={action.ariaLabel ?? action.label}
                    className="inline-flex items-center justify-center rounded-sm border border-gold/30 px-5 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.18em] text-gold/80 transition-colors hover:border-gold/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
                  >
                    {action.label}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="font-tagline text-white/40 text-sm italic">VOX POPULI VOX DEI</p>
        <p className="font-body text-mid/50 text-xs tracking-wide">
          OLPS COMELEC — Commission on Elections
        </p>
        <p className="font-body text-mid/30 text-[11px]">Our Lady of Peace School</p>
        <div className="flex items-center gap-3 pt-2 font-body text-[10px] uppercase tracking-[0.16em]">
          <Link href="/voter-help" className="text-white/35 transition-colors hover:text-gold">
            Voter Help
          </Link>
          <span className="text-gold/20" aria-hidden="true">|</span>
          <Link href="/admin-help" className="text-white/35 transition-colors hover:text-gold">
            Officer Help
          </Link>
        </div>
        </div>
      </div>
    </footer>
  );
}
