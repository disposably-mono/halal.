"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { SecretInput } from "@/components/ui/secret-input";
import {
  unlockAdminHelp,
  type AdminHelpAccessState,
} from "./actions";

export function AdminHelpGate() {
  const [state, action] = useFormState<AdminHelpAccessState, FormData>(
    unlockAdminHelp,
    null,
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#070919]/85 px-5 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-labelledby="admin-help-title" className="w-full max-w-sm overflow-hidden rounded-2xl border border-gold/20 bg-[#151b36] shadow-2xl">
        <div className="border-b border-white/[0.07] px-6 py-5">
          <p className="text-[9px] uppercase tracking-[0.3em] text-gold/60">Officer Verification</p>
          <h2 id="admin-help-title" className="mt-2 font-heading text-lg font-bold text-white/90">Unlock the admin guide</h2>
          <p className="mt-2 text-xs leading-5 text-white/45">Enter any current COMELEC officer key. This only opens the help page and does not sign you into the admin panel.</p>
        </div>
        <form action={action} className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <label htmlFor="help-officer-key" className="text-[10px] uppercase tracking-[0.18em] text-white/45">Officer key</label>
            <SecretInput
              id="help-officer-key"
              name="officerKey"
              secretLabel="officer key"
              required
              minLength={6}
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(state?.error)}
              aria-describedby={state?.error ? "help-key-error" : undefined}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.05] px-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/50 focus:ring-2 focus:ring-gold/15"
              placeholder="Enter officer key"
            />
          </div>
          {state?.error && <p id="help-key-error" role="alert" className="rounded-lg border border-red-400/20 bg-red-400/[0.08] px-3 py-2 text-xs text-red-300">{state.error}</p>}
          <div className="flex gap-2.5">
            <Link href="/" className="flex h-10 flex-1 items-center justify-center rounded-lg border border-white/10 text-xs text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white/75">Back home</Link>
            <UnlockButton />
          </div>
        </form>
      </div>
    </div>
  );
}

function UnlockButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="h-10 flex-1 rounded-lg bg-gold text-xs font-bold text-navy-deep transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
      {pending ? "Checking..." : "Open guide"}
    </button>
  );
}
