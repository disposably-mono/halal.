"use client";

import { Link } from "next-view-transitions";
import { PUBLIC_PAGE_BACKGROUND } from "../_components/public-page";
import { LandingFooter } from "../_components/LandingFooter";

const LAST_UPDATED = "1 July 2026";

const COOKIES = [
  {
    name: "voter_session",
    purpose: "Keeps a voter's place during the voting flow.",
    life: "Session (cleared after voting).",
  },
  {
    name: "ballot_confirmation",
    purpose: "Shows the one-time confirmation after a ballot is cast.",
    life: "Short-lived; cleared after confirmation.",
  },
  {
    name: "admin_help_access",
    purpose: "Gates the officer help page.",
    life: "Session.",
  },
  {
    name: "NextAuth session",
    purpose: "Signs in COMELEC administrators.",
    life: "Until logout / expiry.",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 font-tagline text-xl font-bold text-white">{title}</h2>
      <div className="font-body text-[0.9rem] leading-[1.8] text-white/60">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyClient() {
  return (
    <div
      className="min-h-screen font-body text-white"
      style={PUBLIC_PAGE_BACKGROUND}
    >
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-gold opacity-60" />
            <span className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-gold/70">
              Our Lady of Peace School
            </span>
            <div className="h-px w-8 bg-gold opacity-60" />
          </div>
          <h1 className="font-tagline text-4xl font-black uppercase tracking-[0.05em]">
            Data &amp; Privacy Policy
          </h1>
          <p className="mt-3 font-body text-xs text-white/40">
            Last updated {LAST_UPDATED}
          </p>
        </div>

        <Section title="What we collect">
          <p>
            To run school elections we hold voter control numbers (in the format
            YYGGSNNN) and COMELEC administrator accounts (email, plus a securely
            hashed password and officer key). We do not build profiles of voters.
          </p>
        </Section>

        <Section title="Your ballot is anonymous">
          <p>
            A cast ballot is never linked to the voter who cast it — our records
            simply have no field connecting the two. This mirrors a physical
            ballot box: once your vote is in, it cannot be traced back to you. We
            only record that a control number has voted, to prevent double-voting.
          </p>
        </Section>

        <Section title="Cookies we use">
          <p className="mb-4">
            We use only essential, first-party cookies needed to run voting
            securely. We do not use analytics, advertising, or third-party
            tracking cookies.
          </p>
          <div className="overflow-hidden rounded-sm border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 font-heading uppercase tracking-wide">
                    Cookie
                  </th>
                  <th className="px-3 py-2 font-heading uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="px-3 py-2 font-heading uppercase tracking-wide">
                    Lifetime
                  </th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-gold/80">{c.name}</td>
                    <td className="px-3 py-2 text-white/60">{c.purpose}</td>
                    <td className="px-3 py-2 text-white/50">{c.life}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="How we use election data">
          <p>
            COMELEC reports turnout and results as part of running the election,
            the same as it would for a manual election. Any reporting is
            aggregate only — small groups are not broken out in a way that could
            reveal how an individual voted, and individual ballots are never
            linked to voters.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Election data is kept for the school year and audit window, then
            archived and eventually purged in line with COMELEC policy.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Under the Data Privacy Act of 2012 (RA 10173) you may ask to access
            or correct your information. Student data is processed under the
            authority of the school. To make a request or raise a concern,
            contact COMELEC at{" "}
            <a
              href="mailto:comelec.club@olps.edu.ph"
              className="text-gold underline-offset-2 hover:underline"
            >
              comelec.club@olps.edu.ph
            </a>
            .
          </p>
        </Section>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="font-body text-xs uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-gold"
          >
            ← Back to home
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
