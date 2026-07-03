import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
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
    const guard = await requireCapabilityOrError("voters:export");
    if (!guard.ok) {
      return NextResponse.json(
        { error: permissionErrorMessage(guard.error) },
        { status: guard.error === "Forbidden" ? 403 : 401 },
      );
    }

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
