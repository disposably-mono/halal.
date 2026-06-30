// Floating card used as the "unavailable / nothing here yet" state across the
// public voter-facing pages (results when there is nothing to show, vote and
// verify when no election is open). Pure presentational — safe in server or
// client trees.
export function PublicEmptyState({
  title,
  message,
  eyebrow = "OLPS COMELEC",
}: {
  title: string;
  message: string;
  eyebrow?: string;
}) {
  return (
    <div className="max-w-md rounded-sm border border-white/[0.08] bg-navy/[0.35] px-8 py-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <p className="font-body text-gold/50 text-[10px] tracking-[0.4em] uppercase mb-3">
        {eyebrow}
      </p>
      <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-4">
        {title}
      </h1>
      <p className="font-tagline text-white/40 text-sm italic">VOX POPULI VOX DEI</p>
      <p className="mt-5 font-body text-mid/[0.6] text-sm leading-6">{message}</p>
    </div>
  );
}
