import { prisma } from "@/lib/prisma";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import ResultsClient from "./ResultsClient";

export const dynamic = "force-dynamic";

const STATUS_PRIORITY: Record<string, number> = {
  CLOSED: 0,
  OPEN: 1,
  SCHEDULED: 2,
  DRAFT: 3,
};

export default async function ResultsPage() {
  const elections = await prisma.election.findMany({
    where: { archivedAt: null },
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
        style={PUBLIC_PAGE_BACKGROUND}
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
