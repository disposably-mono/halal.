import type { ReactNode } from "react";
import {
  HelpSectionHeading,
  HelpTexturedBand,
  PublicHelpShell,
} from "@/app/_components/PublicHelpShell";

const LAST_UPDATED = "4 July 2026";

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
      title="Privacy"
      description="How HALAL handles OLPS COMELEC voter records, anonymous ballots, receipt verification, admin access, cookies, and operational logs."
    >
      <div className="px-6 pb-2 pt-12 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold/50">
          Last updated {LAST_UPDATED}
        </span>
      </div>

      <section className="px-6 pb-16 pt-10">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="What We Hold"
            title="Data used to run elections"
            body="HALAL stores the minimum records needed for OLPS COMELEC to prepare rosters, authenticate officers, cast ballots, verify receipts, and publish results."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PolicyCard title="Voter roster records">
              For each election, HALAL stores roster details such as Student ID,
              grade level, division, section, Control Number, and whether that
              roster entry has voted. These records prevent duplicate voting and
              open the correct ballot.
            </PolicyCard>
            <PolicyCard title="Admin auth records">
              COMELEC administrator accounts store officer names, email addresses,
              roles, bcrypt-hashed passwords, and bcrypt-hashed officer keys.
              Admin sign-in requires one officer&apos;s password plus a different
              officer&apos;s key.
            </PolicyCard>
            <PolicyCard title="Your ballot is anonymous">
              Submitted choices are stored under anonymous ballot records. Ballots
              do not store a Student ID, Control Number, or voter-record reference.
              The roster records only that the voter credential has already been
              used.
            </PolicyCard>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-gold/10 px-6 py-16">
        <HelpTexturedBand />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Receipts & Verification"
            title="Proof without naming the voter"
            body="After a ballot is accepted, HALAL shows a receipt code once. The system stores a hash of that code, not the plaintext receipt."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PolicyCard title="Receipt hashes">
              Receipt hashes link a receipt code to an anonymous ballot record for
              verification. They do not identify the Student ID or Control Number
              used to cast the ballot.
            </PolicyCard>
            <PolicyCard title="One-time confirmation">
              The confirmation page displays the receipt code and recorded ballot
              choices immediately after voting. After leaving that flow, the code
              cannot be recovered from HALAL.
            </PolicyCard>
            <PolicyCard title="One-time verification">
              The Verify page can confirm that the anonymous ballot remains
              included and unchanged. Keep receipt codes private because the
              verification result can show that receipt&apos;s recorded choices.
            </PolicyCard>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Cookies"
            title="Essential cookies only"
            body="HALAL uses first-party cookies needed for voting, receipt confirmation, officer-help access, and admin sessions. It does not add analytics, advertising, or third-party tracking cookies."
          />
          <div className="mt-10 overflow-x-auto border border-white/8">
            <table className="min-w-[680px] w-full text-left text-xs">
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

      <section className="relative overflow-hidden border-y border-gold/10 px-6 py-16">
        <HelpTexturedBand />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Operational Records"
            title="Logs are for system work"
            body="Operational records help officers run elections and maintain the system. They are not a place for student ballot choices or secret material."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PolicyCard title="Admin audit logs">
              Audit rows identify officers performing election or account actions.
              They do not store plaintext passwords, officer keys, Student IDs, or
              candidate choices.
            </PolicyCard>
            <PolicyCard title="Monitoring snapshots">
              Live monitor snapshots store aggregate turnout and tally data for an
              election. They do not store which voter selected which candidate.
            </PolicyCard>
            <PolicyCard title="Tracing allowlist">
              Operational logs do not contain ballot choices. Custom tracing only
              allows aggregate fields such as election IDs, counts, cache state,
              and admin roles.
            </PolicyCard>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Reporting & Rights"
            title="How election data is handled"
            body="Final reporting focuses on turnout, certified results, and audit status. Individual voter identities are not published with ballot choices."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PolicyCard title="How we use election data">
              COMELEC reports turnout and results as part of running the
              election, the same as it would for a manual election. Public results
              are released only after the election closes, and receipts can be used
              to verify ballot inclusion.
            </PolicyCard>
            <PolicyCard title="Retention">
              HALAL supports archiving completed elections without removing their
              records. Any export, deletion, or long-term retention decision should
              be handled by authorized OLPS COMELEC or school personnel.
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
    <article className="border border-white/8 bg-navy/50 p-6">
      <h3 className="font-heading text-base font-bold text-white/90">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{children}</p>
    </article>
  );
}
