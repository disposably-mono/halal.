import { prisma } from "@/lib/prisma";
import { PublicEmptyState } from "@/app/_components/PublicEmptyState";
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
        className="min-h-screen flex items-center justify-center px-[27px] text-white"
        style={PUBLIC_PAGE_BACKGROUND}
      >
        <PublicEmptyState
          title="No Results Yet"
          message="Public tallies will appear here once COMELEC releases an election for viewing."
        />
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
