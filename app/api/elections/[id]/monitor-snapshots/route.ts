import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCapabilityOrError } from "@/lib/server/auth";
import { permissionErrorMessage } from "@/lib/auth/permissions";
import { loadSnapshots } from "@/lib/server/monitor-snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Seeds the admin monitor's replay timeline from persisted snapshots so it
 * survives a page refresh and matches across devices. Returns the same
 * anonymous aggregate payloads already served by `/api/results/[id]?admin=1`
 * — no voter-identifying data — ascending by capture time.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const guard = await requireCapabilityOrError("admin:view");
  if (!guard.ok) {
    return NextResponse.json(
      { error: permissionErrorMessage(guard.error) },
      { status: guard.error === "Forbidden" ? 403 : 401 },
    );
  }

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
}
