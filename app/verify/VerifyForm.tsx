"use client";

import { useServerActionForm } from "@/lib/client/use-server-action-form";
import { verifyReceiptAction, type VerifyState } from "./actions";

const INITIAL: VerifyState = { status: "idle" };

/**
 * Receipt-entry form. Submits via a POST server action so the one-time
 * `verifiedAt` write never happens on a GET render / prefetch. The code lives
 * in the POST body, not the URL, so it stays out of logs and history.
 *
 * Uses an explicit submit handler instead of React's action-state hooks: the
 * installed React/ReactDOM (18.3.1 stable) do not export those hooks at runtime.
 */
export function VerifyForm({ defaultCode = "" }: { defaultCode?: string }) {
  const { state, isPending, handleSubmit } = useServerActionForm(
    verifyReceiptAction,
    INITIAL,
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          name="code"
          defaultValue={defaultCode}
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          className="min-w-0 flex-1 rounded-sm border border-white/10 bg-navy px-4 py-3.5 font-mono text-sm uppercase tracking-wider text-white placeholder-white/15 outline-none transition-all focus:border-gold/50 focus:ring-1 focus:ring-gold/20 focus-visible:ring-2 focus-visible:ring-gold/25"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm bg-gold px-6 py-3.5 font-heading text-sm font-bold uppercase tracking-[0.2em] text-navy transition-colors hover:bg-gold/90 active:bg-gold/80 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/35 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-deep"
        >
          {isPending ? "Verifying…" : "Verify"}
        </button>
      </form>

      {state.status === "valid" && (
        <section className="mt-6 rounded-sm border border-emerald-400/30 bg-emerald-400/[0.07] p-5" role="status">
          <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-emerald-300">Ballot included and unchanged</h2>
          <p className="mt-2 font-body text-sm text-white/65">{state.electionName}</p>
          <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {state.fingerprint}</p>
        </section>
      )}
      {state.status === "already_verified" && (
        <section className="mt-6 rounded-sm border border-gold/30 bg-gold/[0.07] p-5" role="alert">
          <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-gold/90">Receipt already verified</h2>
          <p className="mt-2 font-body text-sm text-white/55">This receipt code has already been used for verification. Each code can only be verified once.</p>
        </section>
      )}
      {state.status === "invalid" && (
        <section className="mt-6 rounded-sm border border-red-400/30 bg-red-400/[0.07] p-5" role="alert">
          <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-red-300">Receipt not found</h2>
          <p className="mt-2 font-body text-sm text-white/55">Check every character against the printed receipt. Receipt codes cannot be recovered.</p>
        </section>
      )}
      {state.status === "compromised" && (
        <section className="mt-6 rounded-sm border border-red-400/40 bg-red-400/[0.08] p-5" role="alert">
          <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-red-300">Integrity check failed</h2>
          <p className="mt-2 font-body text-sm text-white/65">This ballot record may have changed. Retain your receipt and contact OLPS COMELEC.</p>
          <p className="mt-3 break-all font-mono text-[10px] text-white/40">Audit fingerprint: {state.fingerprint}</p>
        </section>
      )}
      {state.status === "closed" && (
        <section className="mt-6 rounded-sm border border-white/15 bg-white/[0.04] p-5" role="alert">
          <h2 className="font-heading text-sm uppercase tracking-[0.15em] text-white/70">Verification closed</h2>
          <p className="mt-2 font-body text-sm text-white/55">Receipt verification is available only while an election is open. Please check back when polls are open.</p>
        </section>
      )}
    </>
  );
}
