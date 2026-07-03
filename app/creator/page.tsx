import { Link } from "next-view-transitions";
import { FadeInSection } from "../_components/FadeInSection";
import { LandingFooter } from "../_components/LandingFooter";

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
  {
    id: "github",
    platform: "GitHub",
    handle: "disposably-mono",
    href: "https://github.com/disposably-mono",
    color: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.25)",
    icon: (
      <svg viewBox="0 0 24 24" fill="#ffffff" className="w-[18px] h-[18px]" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.742 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
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
    desc: "Aligned the site with existing COMELEC branding, including its colors, type, and page layouts.",
  },
  {
    num: "04",
    title: "System Integration",
    desc: "Built to work with the internal systems COMELEC was already using.",
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
            { label: "COMELEC", href: "/about" },
            { label: "LEADERSHIP", href: "/officers" },
            { label: "MAKER", href: "/creator", active: true },
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
            style={{ background: "radial-gradient(ellipse, rgba(27,31,94,0.75) 0%, transparent 70%)" }}
          />
        </div>
        <HeroRibbons />

        <FadeInSection className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
          {/* Photo placeholder */}
          <div className="relative mb-8">
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: "-14px", border: "1px solid rgba(245,192,0,0.15)" }}
            />
            <div
              className="absolute rounded-full pointer-events-none"
              style={{ inset: "-6px", border: "2px solid rgba(245,192,0,0.45)" }}
            />
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

          <p
            className="font-body text-[0.6rem] tracking-[0.3em] uppercase mb-2"
            style={{ color: "rgba(245,192,0,0.7)" }}
          >
            OLPS COMELEC — Developer &amp; Designer
          </p>

          <h1
            className="font-tagline font-bold leading-none tracking-[0.05em] uppercase mb-1"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", color: "#ffffff" }}
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
            I am an OLPS alumnus who built and designed this platform for COMELEC. The goal was
            simple: support fair, accessible school elections while honoring{" "}
            <em className="font-tagline" style={{ color: "rgba(255,255,255,0.75)" }}>
              Vox Populi Vox Dei
            </em>, the voice of the people is the voice of God.
          </p>
        </FadeInSection>
      </section>

      {/* ── SOCIAL LINKS ─────────────────────────────────── */}
      <section className="flex flex-col items-center px-6 py-20">
        <Eyebrow label="Connect" />
        <h2
          className="font-tagline font-bold text-center mb-10"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "#ffffff" }}
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
              className="flex items-center gap-3 no-underline border border-gold/20 bg-navy/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-navy/60"
              style={{
                padding: "0.875rem 1.5rem",
                borderRadius: "2px",
                minWidth: "200px",
                color: "#ffffff",
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
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "#ffffff" }}
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
              className="relative overflow-hidden group border border-white/[0.07] transition-all duration-[250ms] hover:border-gold/20"
              style={{
                padding: "1.75rem 1.5rem",
                background: "rgba(27,31,94,0.2)",
                borderRadius: "2px",
              }}
            >
              <div
                className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gold opacity-0 transition-opacity duration-[250ms] group-hover:opacity-60"
              />
              <p className="font-mono text-[0.65rem] mb-2" style={{ color: "rgba(245,192,0,0.45)" }}>
                {h.num}
              </p>
              <p className="font-tagline text-[0.875rem] font-bold mb-1.5" style={{ color: "#ffffff" }}>
                {h.title}
              </p>
              <p className="font-body text-[0.75rem] leading-[1.6]" style={{ color: "#8a8fbb" }}>
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter
        eyebrow="Creator Contact"
        title="Catch up with what Mikel is doing"
        description="Click through if you want to catch up with what I'm building, learning, and quietly obsessing over lately."
        action={{
          href: "https://disposably-mono.github.io/",
          label: "Visit Website",
          ariaLabel: "Visit Mikel Taopa's website",
        }}
      />
    </div>
  );
}
