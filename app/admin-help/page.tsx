import type { Metadata } from "next";
import {
  HelpCheckIcon,
  HelpSectionHeading,
  HelpTexturedBand,
  HelpWorkflowArrow,
  PublicHelpShell,
} from "@/app/_components/PublicHelpShell";
import { hasAdminHelpAccess } from "@/lib/admin-help-access";
import { AdminHelpGate } from "./AdminHelpGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Officer Help | halal. OLPS COMELEC",
  description: "COMELEC officer roles, admin permissions, and election workflow guidance.",
};

const roles = [
  {
    role: "COMELEC Super-admin",
    title: "Fixed system account",
    accent: "border-amber-400/30 bg-amber-400/5",
    permissions: ["Create and manage admin accounts", "Assign operational roles", "Reset passwords and unique officer keys", "View the dashboard and monitor"],
    boundary: "Cannot create, operate, close, or canvass elections.",
  },
  {
    role: "Commissioner",
    title: "Moderator, Chairperson, or Vice-Chairperson",
    accent: "border-blue-400/25 bg-blue-400/4",
    permissions: ["Create elections and manage their lifecycle", "Import, finalize, and export voter rosters", "Manage positions and candidates", "Schedule, open, archive, and restore elections"],
    boundary: "Cannot perform the Canvassing Head's final close or official-results export.",
  },
  {
    role: "Canvassing Head",
    title: "Electoral Canvassing Head",
    accent: "border-emerald-400/25 bg-emerald-400/4",
    permissions: ["View the dashboard and live monitor", "Close an election when voting ends", "Review and export official results", "Observe turnout without seeing voter choices"],
    boundary: "Cannot edit rosters, candidates, schedules, or admin accounts.",
  },
  {
    role: "Officer",
    title: "Other authenticated COMELEC officers",
    accent: "border-white/10 bg-white/2.5",
    permissions: ["View the admin dashboard", "Open summaries and live monitoring", "Observe election status and turnout", "Provide their key for another officer's login"],
    boundary: "Read-only: cannot change election data, accounts, rosters, candidates, or results.",
  },
];

const workflow = [
  ["Commissioner", "Create election", "Set the division and schedule"],
  ["Commissioner", "Prepare ballot", "Import voters and finalize candidates"],
  ["Students", "Cast votes", "Student ID plus one-time Control Number"],
  ["Canvassing Head", "Close and canvass", "Review turnout and export results"],
  ["Public", "View final results", "Available only after closing"],
];

export default async function AdminHelpPage() {
  const unlocked = await hasAdminHelpAccess();

  return (
    <PublicHelpShell
      eyebrow="COMELEC Officer Guide"
      title="Admin roles and workflow"
      description="A role-by-role guide to the admin panel, two-officer verification, and the handoff from election setup to final results."
    >
      {!unlocked ? (
        <>
          <section className="px-6 py-24">
            <div className="mx-auto max-w-3xl rounded-xl border border-white/[0.07] bg-navy/40 p-10 text-center text-sm text-white/35">Officer verification is required to view this guide.</div>
          </section>
          <AdminHelpGate />
        </>
      ) : (
        <AdminHelpContent />
      )}
    </PublicHelpShell>
  );
}

function AdminHelpContent() {
  return (
    <>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Secure Access"
            title="Signing in takes two officers"
            body="Admin login uses your own email and password, followed by a unique officer key belonging to a different COMELEC account."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard number="01" title="Your credentials">Enter the email and password assigned to your own account.</InfoCard>
            <InfoCard number="02" title="Another officer's key">Ask another officer to enter their unique key. Your own key is rejected.</InfoCard>
            <InfoCard number="03" title="Role-based panel">After sign-in, the panel enables only the actions granted to your role.</InfoCard>
          </div>
          <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-5 text-white/50">
            Officer keys and passwords should be entered in person. Do not send them through messages, save them in shared documents, or exchange accounts to work around a denied action.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-gold/10 px-6 py-20">
        <HelpTexturedBand />
        <div className="relative z-10 mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Access by Role"
            title="What each officer can do"
            body="A visible page does not grant permission to every action on it. Server-side capability checks remain authoritative."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {roles.map((item) => (
              <article key={item.role} className={`rounded-xl border p-6 ${item.accent}`}>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{item.title}</p>
                <h3 className="mt-2 font-heading text-xl font-bold text-white/90">{item.role}</h3>
                <ul className="mt-5 space-y-2.5">
                  {item.permissions.map((permission) => (
                    <li key={permission} className="flex gap-2.5 text-xs leading-5 text-white/55">
                      <HelpCheckIcon />
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-white/[0.07] pt-4 text-xs leading-5 text-white/35"><span className="font-semibold text-white/50">Boundary:</span> {item.boundary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <HelpSectionHeading
            eyebrow="Example Workflow"
            title="One election, start to finish"
            body="The workflow separates setup, voting, and final canvassing so one person does not control the entire election."
          />
          <div className="mt-12 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            {workflow.map(([owner, action, note], index) => (
              <div key={action} className="contents">
                <article className="rounded-xl border border-white/8 bg-navy/55 p-4 text-center lg:flex lg:min-h-[150px] lg:flex-col lg:justify-center">
                  <span className="font-mono text-[10px] text-gold/50">STEP {index + 1}</span>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/35">{owner}</p>
                  <h3 className="mt-2 font-heading text-sm font-bold text-white/85">{action}</h3>
                  <p className="mt-2 text-[11px] leading-4 text-white/40">{note}</p>
                </article>
                {index < workflow.length - 1 && <HelpWorkflowArrow />}
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Question title="Why was an action denied?">Your account lacks that capability. Confirm your assigned role with the Super-admin instead of borrowing another account.</Question>
            <Question title="What can officers see about voters?">Officers can monitor turnout and whether a roster entry voted, but submitted candidate choices are not linked to Student IDs.</Question>
            <Question title="Who closes an election?">The Canvassing Head performs the manual final close. Scheduled automation may also close an election at its configured end time.</Question>
            <Question title="Who changes voters or candidates?">Only a Commissioner can manage and finalize the roster, positions, and candidates before voting.</Question>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-white/8 bg-navy/50 p-5">
      <span className="font-mono text-xs text-gold/60">{number}</span>
      <h3 className="mt-3 font-heading font-bold text-white/85">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/45">{children}</p>
    </article>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-white/8 bg-white/2.5 p-5">
      <h3 className="font-heading font-bold text-white/85">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/45">{children}</p>
    </article>
  );
}
