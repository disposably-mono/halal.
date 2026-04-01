import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { removeVoter } from "./actions";
import { CSVUploadForm, ManualAddForm } from "./VoterForms";

const divisionLabels: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
  HC: "House Council",
};

function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
}

export default async function VotersPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  // Next.js 14: params is NOT a promise
  const electionId = params.id;

  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: {
      voters: {
        orderBy: [{ gradeLevel: "asc" }, { section: "asc" }, { voterCode: "asc" }],
      },
    },
  });

  if (!election) notFound();

  const isLocked = election.status === "OPEN" || election.status === "CLOSED";
  const schoolYear = currentSchoolYear();
  const totalVoters = election.voters.length;
  const votedCount = election.voters.filter((v) => v.hasVoted).length;

  return (
    <div className="min-h-screen bg-navy-deep">
      <nav className="border-b border-white/10 bg-navy">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/admin" className="text-white/40 hover:text-white text-sm">← Elections</Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm">{election.name}</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-white text-2xl font-bold">{election.name}</h1>
            <p className="text-white/40 text-sm mt-1">{divisionLabels[election.division]} — Voters</p>
          </div>
          {isLocked && <Badge className="bg-yellow-500/20 text-yellow-300">Locked</Badge>}
        </div>

        {!isLocked && (
          <div className="space-y-6">
            <CSVUploadForm electionId={election.id} schoolYear={schoolYear} />
            <ManualAddForm electionId={election.id} schoolYear={schoolYear} />
          </div>
        )}

        <Card className="border-white/10 bg-white/5">
          <CardHeader><CardTitle className="text-white">Registered Voters ({totalVoters})</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="text-left pb-2">Control No.</th>
                  <th className="text-left pb-2">Student ID</th>
                  <th className="text-left pb-2">Grade</th>
                  <th className="text-left pb-2">Status</th>
                  {!isLocked && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody>
                {election.voters.map((voter) => (
                  <tr key={voter.id} className="border-b border-white/5">
                    <td className="py-2 font-mono text-gold">{voter.voterCode}</td>
                    <td className="py-2">{voter.studentId}</td>
                    <td className="py-2">{voter.gradeLevel}-{voter.section}</td>
                    <td className="py-2">
                      <Badge className={voter.hasVoted ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/30"}>
                        {voter.hasVoted ? "Voted" : "Pending"}
                      </Badge>
                    </td>
                    {!isLocked && (
                      <td className="py-2 text-right">
                        <form action={removeVoter}>
                          <input type="hidden" name="voterId" value={voter.id} />
                          <input type="hidden" name="electionId" value={election.id} />
                          <button type="submit" className="text-white/20 hover:text-red-400 text-xs">Remove</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
