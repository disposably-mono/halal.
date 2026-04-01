import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  seedAllPositions,
  addSinglePosition,
  removePosition,
  addCandidate,
  removeCandidate,
} from "./actions";
import { DIVISION_POSITIONS } from "../../lib/constants";

const divisionLabels: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

export default async function CandidatesPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: {
      positions: {
        // Only render active positions
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          candidates: { orderBy: { fullName: "asc" } },
        },
      },
    },
  });

  if (!election) notFound();

  const isLocked = election.status === "OPEN" || election.status === "CLOSED";

  // All positions defined in PRD constants for this division
  const allDivisionPositions = DIVISION_POSITIONS[election.division] ?? [];
  const totalPositionCount = allDivisionPositions.length;

  // Titles that are currently active — used to filter the dropdown
  const activeTitles = new Set(election.positions.map((p) => p.title));

  // Positions available to add (not currently active)
  const availableToAdd = allDivisionPositions.filter(
    (p) => !activeTitles.has(p.title)
  );

  const activeCount = election.positions.length;
  const remainingCount = availableToAdd.length;

  return (
    <div className="min-h-screen bg-navy-deep">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-navy">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/admin"
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            ← Elections
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate">{election.name}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm">Candidates</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{election.name}</h1>
            <p className="text-white/40 text-sm mt-1">
              {divisionLabels[election.division]} — Candidate Encoder
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLocked && (
              <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                Locked — election is {election.status}
              </Badge>
            )}
            <Link href={`/admin/elections/${election.id}/voters`}>
              <Button
                variant="outline"
                className="border-white/20 text-white/60 hover:bg-white/10 text-sm"
              >
                Voters →
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. SEED ALL BANNER — shown only when no active positions exist */}
        {activeCount === 0 && !isLocked && (
          <Card className="border-gold/30 bg-gold/5">
            <CardContent className="py-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">No positions yet.</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Load the confirmed {divisionLabels[election.division]} ballot
                  positions from the PRD.
                </p>
              </div>
              <form action={seedAllPositions}>
                <input type="hidden" name="electionId" value={election.id} />
                <input type="hidden" name="division" value={election.division} />
                <Button
                  type="submit"
                  className="bg-gold text-navy hover:bg-gold/90 font-semibold shrink-0"
                >
                  Load {totalPositionCount} Positions
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 2. POSITION LIST */}
        {activeCount > 0 && (
          <div className="space-y-4">
            {election.positions.map((position) => (
              <Card key={position.id} className="border-white/10 bg-white/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <CardTitle className="text-white text-base">
                      {position.title}
                    </CardTitle>
                    <Badge className="bg-white/10 text-white/50 text-xs font-mono">
                      Grade {position.candidateGrade}
                    </Badge>
                    {position.eligibleGrades.length > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                        Grade {position.eligibleGrades.join(", ")} voters only
                      </Badge>
                    )}

                    {!isLocked && (
                      <form action={removePosition} className="ml-auto">
                        <input
                          type="hidden"
                          name="positionId"
                          value={position.id}
                        />
                        <input
                          type="hidden"
                          name="electionId"
                          value={election.id}
                        />
                        <button
                          type="submit"
                          className="text-white/20 hover:text-red-400 text-xs transition-colors"
                        >
                          Delete Position
                        </button>
                      </form>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Candidate list */}
                  {position.candidates.length > 0 && (
                    <div className="space-y-2">
                      {position.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2"
                        >
                          <div>
                            <p className="text-white text-sm font-medium">
                              {candidate.fullName}
                            </p>
                            <p className="text-white/40 text-xs">
                              Grade {candidate.gradeLevel}
                            </p>
                          </div>
                          {!isLocked && (
                            <form action={removeCandidate}>
                              <input
                                type="hidden"
                                name="candidateId"
                                value={candidate.id}
                              />
                              <input
                                type="hidden"
                                name="electionId"
                                value={election.id}
                              />
                              <button
                                type="submit"
                                className="text-white/20 hover:text-red-400 text-xs transition-colors"
                              >
                                Remove
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add candidate form */}
                  {!isLocked && (
                    <form action={addCandidate} className="flex gap-2 pt-1">
                      <input
                        type="hidden"
                        name="positionId"
                        value={position.id}
                      />
                      <input
                        type="hidden"
                        name="electionId"
                        value={election.id}
                      />
                      <input
                        type="hidden"
                        name="gradeLevel"
                        value={position.candidateGrade}
                      />
                      <Input
                        name="fullName"
                        placeholder="Full name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm h-9 flex-1"
                        required
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="bg-gold text-navy hover:bg-gold/90 font-semibold h-9 shrink-0"
                      >
                        + Add
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* 3. ADD SINGLE POSITION DROPDOWN
                Only shown when there are still positions available to add.
                Active titles are excluded from the options. */}
            {!isLocked && availableToAdd.length > 0 && (
              <Card className="border-white/10 bg-transparent border-dashed">
                <CardContent className="py-4">
                  <form
                    action={addSinglePosition}
                    className="flex items-center gap-3"
                  >
                    <input
                      type="hidden"
                      name="electionId"
                      value={election.id}
                    />
                    <input
                      type="hidden"
                      name="division"
                      value={election.division}
                    />
                    <select
                      name="title"
                      defaultValue=""
                      className="bg-navy border border-white/20 text-white text-sm rounded-md h-9 px-3 flex-1"
                      required
                    >
                      <option value="" disabled>
                        Add position ({remainingCount} remaining)...
                      </option>
                      {availableToAdd.map((p) => (
                        <option key={p.title} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 shrink-0 h-9"
                    >
                      + Add Position
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* All positions are active — no more to add */}
            {!isLocked && availableToAdd.length === 0 && (
              <p className="text-white/20 text-xs text-center py-2">
                All {totalPositionCount} positions are active.
              </p>
            )}
          </div>
        )}

        {/* Bottom nav */}
        {activeCount > 0 && (
          <div className="flex justify-end pt-4">
            <Link href={`/admin/elections/${election.id}/voters`}>
              <Button className="bg-gold text-navy hover:bg-gold/90 font-semibold">
                Continue to Voters →
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
