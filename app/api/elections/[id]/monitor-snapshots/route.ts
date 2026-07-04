import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrJsonError } from "@/lib/server/auth";
import { loadSnapshots } from "@/lib/server/monitor-snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unexpectedSnapshotsErrorResponse() {
  return NextResponse.json(
    { error: "Failed to load snapshots." },
    { status: 500 },
  );
}

/**
 * Seeds the admin monitor's replay timeline from persisted snapshots so it
 * survives a page refresh and matches across devices. Returns the same
 * anonymous aggregate payloads already served by `/api/results/[id]?admin=1`
 * — no voter-identifying data — ascending by capture time.
 */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const guard = await requireCapabilityOrJsonError("admin:view");
    if (!guard.ok) return guard.response;

    const { id } = params;

    const election = await prisma.election.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    const snapshots = await loadSnapshots(id);

    return NextResponse.json({
      snapshots: snapshots.map((snapshot) => ({
        capturedAt: snapshot.capturedAt.toISOString(),
        payload: snapshot.payload,
      })),
    });
  } catch (error) {
    console.error("[monitor-snapshots] unexpected error", error);
    return unexpectedSnapshotsErrorResponse();
  }
}
