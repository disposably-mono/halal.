import { requireCapabilityOrJsonError } from "@/lib/server/auth";
import { rowsToCsv } from "@/lib/domain/csv";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function unexpectedExportErrorResponse() {
  return NextResponse.json(
    { error: "Failed to export voters." },
    { status: 500 },
  );
}

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const guard = await requireCapabilityOrJsonError("voters:export");
    if (!guard.ok) return guard.response;

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

    const csv = rowsToCsv(rows);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="voters-${params.id}.csv"`,
      },
    });
  } catch (error) {
    console.error("[voters-export] unexpected error", error);
    return unexpectedExportErrorResponse();
  }
}
