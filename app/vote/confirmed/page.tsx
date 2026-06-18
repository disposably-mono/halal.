import { getVoterSession } from "@/lib/voter-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Link } from "next-view-transitions";

export default async function ConfirmedPage() {
  // By the time this renders, middleware has already cleared the cookie.
  // We check the session only to guard against direct navigation here
  // without having voted — in that edge case, getVoterSession() will
  // still return the session if the cookie somehow persists pre-clear.
  const session = await getVoterSession();

  if (session) {
    // Cookie wasn't cleared yet (e.g. direct nav) — check DB
    const voter = await prisma.voter.findUnique({
      where: { id: session.voterId },
      select: { hasVoted: true },
    });
    // If they haven't actually voted, send them back to the ballot
    if (voter && !voter.hasVoted) {
      redirect("/vote/ballot");
    }
    // hasVoted = true — fall through and render success
  }

  // No session = cookie was cleared by middleware on arrival — render normally

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#F5C000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="font-body text-gold/50 text-[10px] tracking-[0.4em] uppercase mb-3">
          OLPS COMELEC
        </p>
        <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-3">
          Vote Recorded
        </h1>
        <p className="font-tagline text-white/40 text-sm italic mb-8">
          VOX POPULI VOX DEI
        </p>
        <div className="w-12 h-px bg-gold/30 mx-auto mb-8" />
        <p className="font-body text-white/60 text-sm leading-relaxed mb-8">
          Your ballot has been successfully submitted. Thank you for exercising
          your right to vote.
        </p>
        <Link
          href="/results"
          className="inline-block px-6 py-3 border border-white/15 text-white/60 font-heading text-xs tracking-[0.2em] uppercase hover:border-gold/30 hover:text-gold/60 transition-colors rounded-sm"
        >
          View Results
        </Link>
        <p className="font-body text-mid/30 text-[11px] mt-8">
          OLPS COMELEC · Our Lady of Peace School
        </p>
      </div>
    </div>
  );
}
