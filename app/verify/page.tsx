import { PublicEmptyState } from "@/app/_components/PublicEmptyState";
import { PublicFooter } from "@/app/_components/PublicFooter";
import { PublicNav } from "@/app/_components/PublicNav";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import { hasOpenElection } from "./actions";
import { VerifyForm } from "./VerifyForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  // Read-only gate: verification is available under the same rule as casting a
  // vote — at least one open (non-archived) election exists. No verification is
  // performed on this GET render; the actual check + one-time `verifiedAt` write
  // happens only via the POST server action in VerifyForm, so bots/prefetchers
  // cannot consume a receipt and codes never land in the URL/logs.
  if (!(await hasOpenElection())) {
    return (
      <div className="min-h-screen flex flex-col text-white overflow-x-hidden" style={PUBLIC_PAGE_BACKGROUND}>
        <PublicNav label="Verify" />
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <PublicEmptyState
            title="Verification Closed"
            message="Receipt verification is available only while an election is open. Please check back when polls are open."
          />
        </main>
        <PublicFooter note="Ballot Verification" />
      </div>
    );
  }

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

          <VerifyForm />
        </div>
      </main>

      <PublicFooter note="Ballot Verification" />
    </div>
  );
}
