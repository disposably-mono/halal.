import { redirect } from "next/navigation";
import { getVoterSession } from "@/lib/voter-session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BallotPage() {
  const session = await getVoterSession();

  if (!session) {
    redirect("/vote");
  }

  // Check voter hasn't already voted
  const voter = await prisma.voter.findUnique({
    where: { id: session.voterId },
    select: { hasVoted: true, gradeLevel: true, section: true, division: true },
  });

  if (!voter) {
    redirect("/vote");
  }

  if (voter.hasVoted) {
    redirect("/vote/confirmed");
  }

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-navy/40">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gold rounded-full" />
          <div>
            <p className="font-body text-gold/60 text-[10px] tracking-[0.3em] uppercase">
              OLPS COMELEC
            </p>
            <p className="font-heading font-bold text-white text-sm tracking-wide">
              Official Ballot
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-body text-mid/60 text-[10px] tracking-[0.2em] uppercase">
            {session.division} · Grade {session.gradeLevel}
          </p>
          <p className="font-mono text-mid/40 text-[10px]">
            Session active
          </p>
        </div>
      </header>

      {/* Placeholder content — full ballot UI in next implementation step */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Ballot coming soon */}
          <div className="border border-gold/20 rounded-sm p-10 bg-navy/30">
            <div className="w-12 h-12 border border-gold/30 rounded-sm flex items-center justify-center mx-auto mb-6">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="1" stroke="#F5C000" strokeWidth="1.2" strokeOpacity="0.6" />
                <path d="M7 7h6M7 10h6M7 13h4" stroke="#F5C000" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
              </svg>
            </div>
            <h1 className="font-display text-4xl text-white mb-3 uppercase tracking-wide">
              Your Ballot
            </h1>
            <p className="font-tagline text-white/30 text-sm italic mb-6">
              VOX POPULI VOX DEI
            </p>
            <p className="font-body text-mid/70 text-sm mb-2">
              Ballot for <span className="text-gold/70">{session.division}</span> · Grade <span className="text-gold/70">{session.gradeLevel}</span>
            </p>
            <p className="font-body text-mid/40 text-xs">
              Full ballot UI — Phase 3 implementation in progress.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
