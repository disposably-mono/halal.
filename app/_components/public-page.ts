// Shared backdrop for the public voter-facing pages (results, vote, verify).
// Server-safe (plain object, no client imports) so server components can spread
// it directly. The layered gradient + faint grid is the signature look of the
// public results page; the vote and verify pages reuse it for visual unity.
export const PUBLIC_PAGE_BACKGROUND = {
  backgroundColor: "#0f1235",
  backgroundImage: [
    "radial-gradient(circle at 50% 16%, rgba(27,31,94,0.55) 0%, transparent 36rem)",
    "radial-gradient(circle at 12% 46%, rgba(107,26,26,0.18) 0%, transparent 28rem)",
    "radial-gradient(circle at 88% 82%, rgba(245,192,0,0.06) 0%, transparent 24rem)",
    "repeating-linear-gradient(135deg, transparent 0 34rem, rgba(107,26,26,0.18) 34rem 38rem, transparent 38rem 72rem)",
    "repeating-linear-gradient(135deg, transparent 0 50rem, rgba(27,31,94,0.26) 50rem 54rem, transparent 54rem 96rem)",
    "linear-gradient(rgba(245,192,0,0.035) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(245,192,0,0.035) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "auto, auto, auto, auto, auto, 48px 48px, 48px 48px",
  backgroundAttachment: "fixed",
};
