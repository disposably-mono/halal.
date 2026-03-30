import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const voters = await prisma.voter.findMany({
    where: { electionId: params.id },
    orderBy: [
      { gradeLevel: "asc" },
      { section: "asc" },
      { voterCode: "asc" },
    ],
  });

  const rows = [
    ["controlNumber", "studentId", "gradeLevel", "section", "hasVoted"],
    ...voters.map((v) => [
      v.voterCode,
      v.studentId,
      v.gradeLevel,
      v.section,
      v.hasVoted ? "YES" : "NO",
    ]),
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="voters-${params.id}.csv"`,
    },
  });
}
