import { prisma } from "@/lib/prisma";
import { PublicEmptyState } from "@/app/_components/PublicEmptyState";
import { PublicFooter } from "@/app/_components/PublicFooter";
import { PublicNav } from "@/app/_components/PublicNav";
import { PUBLIC_PAGE_BACKGROUND } from "@/app/_components/public-page";
import { VoteForm } from "./_components/VoteForm";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  // Voting is available under the same rule as the landing CTA: at least one
  // open (non-archived) election exists. Otherwise show the floating card.
  const openCount = await prisma.election.count({
    where: { status: "OPEN", archivedAt: null },
  });

  return (
    <div className="min-h-screen flex flex-col text-white overflow-x-hidden" style={PUBLIC_PAGE_BACKGROUND}>
      <PublicNav label="Vote" />

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {openCount === 0 ? (
          <PublicEmptyState
            title="Voting Not Open"
            message="There is no election open for voting right now. Please check back when polls are open."
          />
        ) : (
          <VoteForm />
        )}
      </main>

      <PublicFooter note="Cast Your Vote" />
    </div>
  );
}
