import Link from "next/link";
import { prisma } from "@/lib/prisma";
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
      election: {
        select: { name: true, auditKeyEncrypted: true, auditFingerprint: true },
      },
      votes: { select: { electionId: true, positionId: true, candidateId: true, isAbstain: true } },
    },
  });
  if (!ballot || !ballot.election.auditKeyEncrypted || !ballot.election.auditFingerprint) {
    return { status: "invalid" };
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
    return {
      status: valid && structurallyValid ? "valid" : "compromised",
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
    <main className="min-h-screen bg-navy-deep text-white px-6 py-16">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-[11px] uppercase tracking-[0.18em] text-white/40 hover:text-gold">← Home</Link>
        <p className="mt-12 text-gold/60 text-[10px] tracking-[0.35em] uppercase">OLPS COMELEC</p>
        <h1 className="mt-3 font-display text-5xl uppercase tracking-wide">Verify Ballot Receipt</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">
          Enter the code printed after voting. Verification confirms that the anonymous ballot remains included and unchanged; it never reveals voter choices.
        </p>
        <form className="mt-8 flex flex-col gap-3 sm:flex-row" method="get">
          <input
            name="code"
            defaultValue={searchParams.code ?? ""}
            autoComplete="off"
            spellCheck={false}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            className="min-w-0 flex-1 rounded-sm border border-white/15 bg-white/[0.05] px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-gold/50"
          />
          <button className="rounded-sm bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-navy-deep">Verify</button>
        </form>

        {result?.status === "valid" && (
          <section className="mt-6 border border-emerald-400/30 bg-emerald-400/[0.07] p-5" role="status">
            <h2 className="font-semibold text-emerald-300">Ballot included and unchanged</h2>
            <p className="mt-2 text-sm text-white/65">{result.electionName}</p>
            <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {formatFingerprint(result.fingerprint)}</p>
          </section>
        )}
        {result?.status === "invalid" && (
          <section className="mt-6 border border-red-400/30 bg-red-400/[0.07] p-5" role="alert">
            <h2 className="font-semibold text-red-300">Receipt not found</h2>
            <p className="mt-2 text-sm text-white/55">Check every character against the printed receipt. Receipt codes cannot be recovered.</p>
          </section>
        )}
        {result?.status === "compromised" && (
          <section className="mt-6 border border-red-400/40 bg-red-400/[0.08] p-5" role="alert">
            <h2 className="font-semibold text-red-300">Integrity check failed</h2>
            <p className="mt-2 text-sm text-white/65">This ballot record may have changed. Retain your receipt and contact OLPS COMELEC.</p>
            <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {formatFingerprint(result.fingerprint)}</p>
          </section>
        )}
      </div>
    </main>
  );
}
