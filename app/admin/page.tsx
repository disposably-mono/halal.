import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const statusColors: Record<string, string> = {
  DRAFT: "bg-white/10 text-white/50",
  SCHEDULED: "bg-blue-500/20 text-blue-300",
  OPEN: "bg-green-500/20 text-green-300",
  CLOSED: "bg-white/10 text-white/40",
};

const divisionLabels: Record<string, string> = {
  GS: "Grade School",
  JHS: "Junior High School",
  SHS: "Senior High School",
};

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const elections = await prisma.election.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          voters: true,
          votes: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0f1235]">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-[#1B1F5E]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">halal.</span>
            <span className="text-white/30 text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-sm">{session.user.name}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Elections</h1>
            <p className="text-white/40 text-sm mt-1">
              {elections.length === 0
                ? "No elections yet."
                : `${elections.length} election${elections.length !== 1 ? "s" : ""} total`}
            </p>
          </div>
          <Link href="/admin/elections/new">
            <Button className="bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold">
              + New Election
            </Button>
          </Link>
        </div>

        {/* Election list */}
        {elections.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-16 text-center">
              <p className="text-white/30 text-sm">No elections have been created yet.</p>
              <Link href="/admin/elections/new">
                <Button className="mt-4 bg-[#F5C000] text-[#1B1F5E] hover:bg-[#F5C000]/90 font-semibold">
                  Create your first election
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {elections.map((election) => (
              <Card
                key={election.id}
                className="border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-white text-base font-semibold">
                        {election.name}
                      </CardTitle>
                      <p className="text-white/40 text-sm">
                        {divisionLabels[election.division]}
                      </p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${statusColors[election.status]}`}>
                      {election.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm text-white/40">
                      <span>{election._count.voters} voters</span>
                      <span>{election._count.votes} votes cast</span>
                      {election.scheduledOpen && (
                        <span>
                          Opens{" "}
                          {new Date(election.scheduledOpen).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/elections/${election.id}/candidates`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white/60 hover:bg-white/10 text-xs"
                        >
                          Candidates
                        </Button>
                      </Link>
                      <Link href={`/admin/elections/${election.id}/voters`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white/60 hover:bg-white/10 text-xs"
                        >
                          Voters
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
