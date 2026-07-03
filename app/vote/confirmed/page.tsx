import { getBallotConfirmation } from "@/lib/ballot-confirmation";
import { prisma } from "@/lib/prisma";
import { ReceiptActions } from "./ReceiptActions";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage() {
  const confirmation = await getBallotConfirmation();
  const ballot = confirmation
    ? await prisma.ballot.findUnique({
        where: { id: confirmation.ballotId },
        select: {
          election: { select: { name: true, auditFingerprint: true } },
          votes: {
            orderBy: { position: { order: "asc" } },
            select: {
              isAbstain: true,
              position: { select: { title: true } },
              candidate: { select: { fullName: true } },
            },
          },
        },
      })
    : null;

  return (
    <div className="min-h-screen bg-navy-deep flex flex-col items-center justify-center px-6 py-10 print:bg-white print:text-black">
      <div className="w-full max-w-xl text-center">
        <p className="font-body text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-3 print:text-black/60">OLPS COMELEC</p>
        <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-3 print:text-black">Vote Recorded</h1>
        {ballot && confirmation ? (
          <>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6 print:text-black/70">
              This is how your anonymous ballot was recorded. Review it now, then retain the receipt code; it cannot be recovered later.
            </p>
            <div className="text-left border border-white/15 bg-white/4 rounded-sm mb-5 print:border-black/30">
              <div className="px-5 py-4 border-b border-white/10 print:border-black/20">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 print:text-black/50">Election</div>
                <div className="text-white/90 mt-1 print:text-black">{ballot.election.name}</div>
              </div>
              {ballot.votes.map((vote) => (
                <div key={vote.position.title} className="px-5 py-3 border-b border-white/[0.07] last:border-0 print:border-black/10">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-white/40 print:text-black/50">{vote.position.title}</div>
                  <div className="text-sm text-white/85 mt-1 print:text-black">{vote.isAbstain ? "Abstained" : vote.candidate?.fullName}</div>
                </div>
              ))}
            </div>
            <div className="border border-gold/30 bg-gold/5 px-5 py-5 mb-6 print:border-black">
              <div className="text-[10px] uppercase tracking-[0.24em] text-gold/60 mb-2 print:text-black/60">Verification Receipt</div>
              <div className="font-mono text-lg sm:text-xl tracking-widest text-gold break-all print:text-black">{confirmation.receiptCode}</div>
              <div className="mt-3 text-[9px] text-white/35 break-all print:text-black/50">Audit fingerprint: {ballot.election.auditFingerprint}</div>
            </div>
            <ReceiptActions />
          </>
        ) : (
          <>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-8">
              Your ballot has been submitted. For privacy, receipt details are shown only once immediately after voting.
            </p>
            <a href="/verify" className="inline-block px-6 py-3 border border-white/15 text-white/70 text-xs tracking-[0.16em] uppercase">Verify a Receipt</a>
          </>
        )}
        <p className="font-body text-mid/30 text-[11px] mt-8 print:text-black/40">OLPS COMELEC · Our Lady of Peace School</p>
      </div>
    </div>
  );
}
