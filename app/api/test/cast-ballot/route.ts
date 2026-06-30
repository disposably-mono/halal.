import { NextResponse } from "next/server";
import { castVerifiedBallot, type BallotSelection } from "@/lib/server/cast-ballot";
import { isTestEndpointEnabled } from "@/lib/server/test-endpoints";

export const dynamic = "force-dynamic";

/**
 * Test-only write endpoint for load / concurrency testing of the ballot path.
 *
 * It calls the exact same `castVerifiedBallot` transaction the real voter flow
 * uses, but takes a `voterId` directly instead of a signed session cookie, so
 * k6 can drive thousands of casts without scripting the Next server-action
 * protocol.
 *
 * GUARDED: returns 404 unless `ENABLE_TEST_ENDPOINTS=1`, so it is invisible in
 * any normal (including production) deployment. Never enable it on a real
 * election instance.
 */
export async function POST(req: Request) {
  if (!isTestEndpointEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { voterId?: unknown; selections?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.voterId !== "string" || body.voterId.length === 0) {
    return NextResponse.json({ error: "voterId is required" }, { status: 400 });
  }

  const selections =
    body.selections && typeof body.selections === "object"
      ? (body.selections as BallotSelection)
      : {};

  const result = await castVerifiedBallot({ voterId: body.voterId, selections });

  return NextResponse.json(result, { status: result.success ? 200 : 409 });
}
