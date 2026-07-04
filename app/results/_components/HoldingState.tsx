"use client";

export function HoldingState({
  electionName,
  status,
  audit,
}: {
  electionName: string;
  status: string;
  audit: { receiptVerificationSupported: boolean; fingerprint: string | null };
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-[27px] py-[90px] text-center">
      <div className="mx-auto mb-[36px] flex h-[72px] w-[72px] items-center justify-center rounded-sm border border-gold/15 bg-navy/35 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.2" strokeOpacity="0.4" />
          <path d="M12 7v5l3 3" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        </svg>
      </div>
      <p className="font-body text-gold/40 text-[12px] tracking-[0.3em] uppercase mb-[14px]">
        {status === "OPEN" ? "Voting In Progress" : "Results Pending"}
      </p>
      <h2 className="font-display text-[41px] text-white uppercase tracking-wide mb-[14px]">
        {electionName}
      </h2>
      <p className="font-tagline text-white/35 text-[17px] italic mb-[27px]">
        VOX POPULI VOX DEI
      </p>
      <p className="font-body text-white/50 text-[17px] max-w-xs leading-relaxed">
        {status === "OPEN"
          ? "Voting is currently in progress. Results will be published once polls close."
          : "Results will be available after this election closes."}
      </p>
      {audit.fingerprint && (
        <p className="mt-[27px] max-w-md break-all font-mono text-[11px] text-white/25">
          Published audit fingerprint: {audit.fingerprint}
        </p>
      )}
    </div>
  );
}
