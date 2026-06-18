import { prisma } from "@/lib/prisma";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

const STATUS_PRIORITY: Record<string, number> = {
  CLOSED: 0,
  OPEN: 1,
  SCHEDULED: 2,
  DRAFT: 3,
};

const PAGE_BACKGROUND = {
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

export default async function ResultsPage() {
  const elections = await prisma.election.findMany({
    select: {
      id: true,
      name: true,
      division: true,
      status: true,
      scheduledClose: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (elections.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 text-white"
        style={PAGE_BACKGROUND}
      >
        <div className="max-w-md rounded-sm border border-white/[0.08] bg-navy/[0.35] px-8 py-10 text-center shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <p className="font-body text-gold/50 text-[10px] tracking-[0.4em] uppercase mb-3">
            OLPS COMELEC
          </p>
          <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-4">
            No Results Yet
          </h1>
          <p className="font-tagline text-white/40 text-sm italic">
            VOX POPULI VOX DEI
          </p>
          <p className="mt-5 font-body text-mid/[0.6] text-sm leading-6">
            Public tallies will appear here once elections are created and ready for viewing.
          </p>
        </div>
      </div>
    );
  }

  // Sort elections: CLOSED first, then by status priority, then most recent
  const sorted = [...elections].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    return pa !== pb ? pa - pb : 0;
  });

  return (
    <ResultsClient
      elections={sorted.map((e) => ({
        id: e.id,
        name: e.name,
        division: e.division,
        status: e.status,
      }))}
    />
  );
}
