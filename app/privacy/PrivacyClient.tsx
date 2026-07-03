import type { ReactNode } from "react";
import {
  HelpSectionHeading,
  HelpTexturedBand,
  PublicHelpShell,
} from "@/app/_components/PublicHelpShell";

const LAST_UPDATED = "1 July 2026";

const COOKIES = [
  {
    name: "voter_session",
    purpose: "Keeps a voter's place during the voting flow.",
    life: "Up to 30 minutes; cleared after voting.",
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

export default function PrivacyClient() {
  return (
    <PublicHelpShell
      eyebrow="Our Lady of Peace School"
      title="Data & Privacy Policy"
      description="How the OLPS COMELEC HALAL voting system handles student and admin data, cookies, and voter anonymity under the Data Privacy Act (RA 10173)."
    >
      <div className="px-6 pt-16 pb-2 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold/50">
          Last updated {LAST_UPDATED}
        </span>
      </div>

      <section className="px-6 pb-20 pt-10">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="What We Hold"
            title="Data we keep, and why"
            body="The only personal details the system stores, and why a cast ballot can never be traced back to the voter who cast it."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <PolicyCard title="What we collect">
              To run school elections we hold voter control numbers (in the
              format YYGGSNNN) and COMELEC administrator accounts (email, plus a
              securely hashed password and officer key). We do not build profiles
              of voters.
            </PolicyCard>
            <PolicyCard title="Your ballot is anonymous">
              A cast ballot is never linked to the voter who cast it — our
              records simply have no field connecting the two. This mirrors a
              physical ballot box: once your vote is in, it cannot be traced back
              to you. We only record that a control number has voted, to prevent
              double-voting.
            </PolicyCard>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-gold/10 px-6 py-20">
        <HelpTexturedBand />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Cookies"
            title="Cookies we use"
            body="We use only essential, first-party cookies needed to run voting securely. We do not use analytics, advertising, or third-party tracking cookies."
          />
          <div className="mt-10 overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 font-heading uppercase tracking-wide">
                    Cookie
                  </th>
                  <th className="px-4 py-3 font-heading uppercase tracking-wide">
                    Purpose
                  </th>
                  <th className="px-4 py-3 font-heading uppercase tracking-wide">
                    Lifetime
                  </th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-t border-white/6">
                    <td className="px-4 py-3 font-mono text-gold/80">{c.name}</td>
                    <td className="px-4 py-3 text-white/60">{c.purpose}</td>
                    <td className="px-4 py-3 text-white/50">{c.life}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Reporting & Rights"
            title="How data is handled"
            body="What COMELEC reports, how long records are kept, and the rights you have over your information."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PolicyCard title="How we use election data">
              COMELEC reports turnout and results as part of running the
              election, the same as it would for a manual election. Any reporting
              is aggregate only — small groups are not broken out in a way that
              could reveal how an individual voted, and individual ballots are
              never linked to voters.
            </PolicyCard>
            <PolicyCard title="How long we keep it">
              Election data is kept for the school year and audit window, then
              archived and eventually purged in line with COMELEC policy.
            </PolicyCard>
            <PolicyCard title="Your rights">
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
            </PolicyCard>
          </div>
        </div>
      </section>
    </PublicHelpShell>
  );
}

function PolicyCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-white/8 bg-navy/50 p-6">
      <h3 className="font-heading text-base font-bold text-white/90">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{children}</p>
    </article>
  );
}
