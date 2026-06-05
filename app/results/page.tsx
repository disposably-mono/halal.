import { prisma } from "@/lib/prisma";
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
      <div className="min-h-screen bg-navy-deep flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-body text-gold/50 text-[10px] tracking-[0.4em] uppercase mb-3">
            OLPS COMELEC
          </p>
          <h1 className="font-display text-5xl text-white uppercase tracking-wide mb-4">
            No Results Yet
          </h1>
          <p className="font-tagline text-white/30 text-sm italic">
            VOX POPULI VOX DEI
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
