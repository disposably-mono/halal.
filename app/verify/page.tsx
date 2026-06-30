import { prisma } from "@/lib/prisma";
import { PublicFooter } from "@/app/_components/PublicFooter";
import { PublicNav } from "@/app/_components/PublicNav";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import {
  decryptAuditKey,
  formatFingerprint,
  hashReceiptCode,
  normalizeReceiptCode,
  verifyBallotCommitment,
} from "@/lib/domain/ballot-audit";

export const dynamic = "force-dynamic";

type Verification =
  | { status: "valid"; electionName: string; fingerprint: string }
  | { status: "invalid" }
  | { status: "already_verified" }
  | { status: "compromised"; electionName: string; fingerprint: string };

async function verifyReceipt(code: string | undefined): Promise<Verification | null> {
  if (!code) return null;
  const normalized = normalizeReceiptCode(code);
  if (normalized.length !== 32) return { status: "invalid" };
  const ballot = await prisma.ballot.findUnique({
    where: { receiptHash: hashReceiptCode(normalized) },
    select: {
      nonce: true,
      commitment: true,
      receiptHash: true,
      electionId: true,
      verifiedAt: true,
      election: {
        select: { name: true, auditKeyEncrypted: true, auditFingerprint: true },
      },
      votes: { select: { electionId: true, positionId: true, candidateId: true, isAbstain: true } },
    },
  });
  if (!ballot || !ballot.election.auditKeyEncrypted || !ballot.election.auditFingerprint) {
    return { status: "invalid" };
  }
  if (ballot.verifiedAt !== null) {
    return { status: "already_verified" };
  }
  try {
    const valid = verifyBallotCommitment(
      ballot.commitment,
      decryptAuditKey(ballot.election.auditKeyEncrypted),
      ballot.electionId,
      ballot.nonce,
      ballot.receiptHash,
      ballot.votes.map((vote) => ({
        positionId: vote.positionId,
        candidateId: vote.isAbstain ? null : vote.candidateId,
      })),
    );
    const structurallyValid = ballot.votes.every((vote) => vote.electionId === ballot.electionId);
    const outcome = valid && structurallyValid ? "valid" : "compromised";

    if (outcome === "valid") {
      await prisma.ballot.update({
        where: { receiptHash: hashReceiptCode(normalized) },
        data: { verifiedAt: new Date() },
      });
    }

    return {
      status: outcome,
      electionName: ballot.election.name,
      fingerprint: ballot.election.auditFingerprint,
    };
  } catch {
    return {
      status: "compromised",
      electionName: ballot.election.name,
      fingerprint: ballot.election.auditFingerprint,
    };
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const result = await verifyReceipt(searchParams.code);
  return (
    <div className="min-h-screen flex flex-col text-white overflow-x-hidden" style={PUBLIC_PAGE_BACKGROUND}>
      <PublicNav label="Verify" />

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto w-full max-w-xl">
          {/* Header */}
          <p className="font-tagline text-white/35 text-sm italic mb-2">
            VOX POPULI VOX DEI
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-white uppercase tracking-wide mb-3">
            Verify Ballot Receipt
          </h1>
          <p className="font-body text-sm leading-6 text-white/55">
            Enter the code printed after voting. Verification confirms that the anonymous ballot remains included and unchanged; it never reveals voter choices. Each receipt can only be verified once.
          </p>

          {/* Gold rule */}
          <div className="mt-6 flex items-center gap-4">
            <div className="w-8 h-px bg-gold/40" />
            <span className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase">
              Receipt Verification
            </span>
          </div>

          {/* Form */}
          <form className="mt-6 flex flex-col gap-3 sm:flex-row" method="get">
            <input
              name="code"
              defaultValue={searchParams.code ?? ""}
              autoComplete="off"
              spellCheck={false}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="min-w-0 flex-1 rounded-sm border border-white/10 bg-navy px-4 py-3.5 font-mono text-sm uppercase tracking-wider text-white placeholder-white/15 outline-none transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25"
            />
            <button className="rounded-sm bg-gold px-6 py-3.5 font-heading text-sm font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90 active:bg-gold/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep">
              Verify
            </button>
          </form>

          {result?.status === "valid" && (
            <section className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/[0.07] p-5" role="status">
              <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-emerald-300">Ballot included and unchanged</h2>
              <p className="mt-2 font-body text-sm text-white/65">{result.electionName}</p>
              <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {formatFingerprint(result.fingerprint)}</p>
            </section>
          )}
          {result?.status === "already_verified" && (
            <section className="mt-6 rounded-sm border border-gold/30 bg-gold/[0.07] p-5" role="alert">
              <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-gold/90">Receipt already verified</h2>
              <p className="mt-2 font-body text-sm text-white/55">This receipt code has already been used for verification. Each code can only be verified once.</p>
            </section>
          )}
          {result?.status === "invalid" && (
            <section className="mt-6 rounded-sm border border-red-400/30 bg-red-400/[0.07] p-5" role="alert">
              <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-red-300">Receipt not found</h2>
              <p className="mt-2 font-body text-sm text-white/55">Check every character against the printed receipt. Receipt codes cannot be recovered.</p>
            </section>
          )}
          {result?.status === "compromised" && (
            <section className="mt-6 rounded-sm border border-red-400/40 bg-red-400/[0.08] p-5" role="alert">
              <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-red-300">Integrity check failed</h2>
              <p className="mt-2 font-body text-sm text-white/65">This ballot record may have changed. Retain your receipt and contact OLPS COMELEC.</p>
              <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {formatFingerprint(result.fingerprint)}</p>
            </section>
          )}
        </div>
      </main>

      <PublicFooter note="Ballot Verification" />
    </div>
  );
}
