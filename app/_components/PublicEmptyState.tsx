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
    <div className="max-w-md rounded-sm border border-white/8 bg-navy/35 px-[36px] py-[45px] text-center shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
      <p className="font-body text-gold/50 text-[12px] tracking-[0.4em] uppercase mb-[14px]">
        {eyebrow}
      </p>
      <h1 className="font-display text-[54px] text-white uppercase tracking-wide mb-[19px]">
        {title}
      </h1>
      <p className="font-tagline text-white/40 text-[17px] italic">VOX POPULI VOX DEI</p>
      <p className="mt-[23px] font-body text-mid/60 text-[17px] leading-[27px]">{message}</p>
    </div>
  );
}
