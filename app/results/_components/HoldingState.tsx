"use client";

export function HoldingState({
  electionName,
  status,
}: {
  electionName: string;
  status: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 border border-white/10 rounded-sm flex items-center justify-center mx-auto mb-8">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#F5C000" strokeWidth="1.2" strokeOpacity="0.4" />
          <path d="M12 7v5l3 3" stroke="#F5C000" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
        </svg>
      </div>
      <p className="font-body text-gold/40 text-[10px] tracking-[0.3em] uppercase mb-3">
        {status === "OPEN" ? "Voting In Progress" : "Results Pending"}
      </p>
      <h2 className="font-display text-4xl text-white uppercase tracking-wide mb-3">
        {electionName}
      </h2>
      <p className="font-tagline text-white/25 text-sm italic mb-6">
        VOX POPULI VOX DEI
      </p>
      <p className="font-body text-white/40 text-sm max-w-xs leading-relaxed">
        {status === "OPEN"
          ? "Voting is currently in progress. Results will be published once polls close."
          : "Results will be available after this election closes."}
      </p>
    </div>
  );
}
