import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { addVotersFromCSV, addVoterManual, removeVoter } from "./actions";

const divisionLabels: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
};

function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
}

export default async function VotersPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const election = await prisma.election.findUnique({
    where: { id: params.id },
    include: {
      voters: {
        orderBy: [
          { gradeLevel: "asc" },
          { section: "asc" },
          { voterCode: "asc" },
        ],
      },
    },
  });

  if (!election) notFound();

  const isLocked = election.status === "OPEN" || election.status === "CLOSED";
  const schoolYear = currentSchoolYear();
  const totalVoters = election.voters.length;
  const votedCount = election.voters.filter((v) => v.hasVoted).length;

  return (
    <div className="min-h-screen bg-[#0f1235]">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-[#1B1F5E]">
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
          <span className="text-white/70 text-sm">Voters</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{election.name}</h1>
            <p className="text-white/40 text-sm mt-1">
              {divisionLabels[election.division]} — Voter Management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLocked && (
              <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">
                Locked — election is {election.status}
              </Badge>
            )}
            {totalVoters > 0 && (
              <Link href={`/api/elections/${election.id}/voters/export`}>
                <Button
                  variant="outline"
                  className="border-white/20 text-white/60 hover:bg-white/10 text-sm"
                >
                  Export CSV
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        {totalVoters > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-white/10 bg-white/5">
              <CardContent className="py-4">
                <p className="text-white/40 text-xs">Total Voters</p>
                <p className="text-white text-2xl font-bold mt-1">{totalVoters}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="py-4">
                <p className="text-white/40 text-xs">Voted</p>
                <p className="text-green-400 text-2xl font-bold mt-1">{votedCount}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="py-4">
                <p className="text-white/40 text-xs">Turnout</p>
                <p className="text-[#F5C000] text-2xl font-bold mt-1">
                  {totalVoters > 0
                    ? Math.round((votedCount / totalVoters) * 100)
                    : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CSV Upload */}
        {!isLocked && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">
                Upload Voter List (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-white/40 text-xs">
                CSV must have a header row with columns:{" "}
                <span className="font-mono text-white/60">
                  studentId, gradeLevel, section
                </span>
              </p>
              <form action={addVotersFromCSV} className="space-y-3">
                <input type="hidden" name="electionId" value={election.id} />
                <input type="hidden" name="schoolYear" value={schoolYear} />
                <textarea
                  name="csvText"
                  rows={6}
                  placeholder={`studentId,gradeLevel,section\n2025-001,11,A\n2025-002,11,B\n2025-003,10,A`}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#F5C000]/50 resize-none"
                  required
                />
                <Button
                  type="submit"
                  className="bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold"
                >
                  Import Voters
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Manual add */}
        {!isLocked && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">
                Add Single Voter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addVoterManual} className="flex gap-2 flex-wrap">
                <input type="hidden" name="electionId" value={election.id} />
                <input type="hidden" name="schoolYear" value={schoolYear} />
                <Input
                  name="studentId"
                  placeholder="Student ID"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm h-9 flex-1 min-w-32"
                  required
                />
                <Input
                  name="gradeLevel"
                  placeholder="Grade"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm h-9 w-20"
                  required
                />
                <Input
                  name="section"
                  placeholder="Section"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm h-9 w-24"
                  required
                />
                <Button
                  type="submit"
                  className="bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold h-9"
                >
                  + Add
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Voter table */}
        {totalVoters > 0 && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">
                Registered Voters ({totalVoters})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-white/40 font-normal pb-2 pr-4">
                        Control No.
                      </th>
                      <th className="text-left text-white/40 font-normal pb-2 pr-4">
                        Student ID
                      </th>
                      <th className="text-left text-white/40 font-normal pb-2 pr-4">
                        Grade
                      </th>
                      <th className="text-left text-white/40 font-normal pb-2 pr-4">
                        Section
                      </th>
                      <th className="text-left text-white/40 font-normal pb-2 pr-4">
                        Status
                      </th>
                      {!isLocked && <th className="pb-2" />}
                    </tr>
                  </thead>
                  <tbody>
                    {election.voters.map((voter) => (
                      <tr key={voter.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 font-mono text-[#F5C000] text-xs">
                          {voter.voterCode}
                        </td>
                        <td className="py-2 pr-4 text-white/70 font-mono text-xs">
                          {voter.studentId}
                        </td>
                        <td className="py-2 pr-4 text-white/50">
                          {voter.gradeLevel}
                        </td>
                        <td className="py-2 pr-4 text-white/50">
                          {voter.section}
                        </td>
                        <td className="py-2 pr-4">
                          {voter.hasVoted ? (
                            <Badge className="bg-green-500/20 text-green-300 text-xs">
                              Voted
                            </Badge>
                          ) : (
                            <Badge className="bg-white/10 text-white/30 text-xs">
                              Pending
                            </Badge>
                          )}
                        </td>
                        {!isLocked && (
                          <td className="py-2 text-right">
                            <form action={removeVoter}>
                              <input
                                type="hidden"
                                name="voterId"
                                value={voter.id}
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
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {totalVoters === 0 && !isLocked && (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-16 text-center">
              <p className="text-white/30 text-sm">No voters registered yet.</p>
              <p className="text-white/20 text-xs mt-1">
                Upload a CSV or add a voter manually above.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
