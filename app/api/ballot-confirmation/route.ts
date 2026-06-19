import { cookies } from "next/headers";
import { BALLOT_CONFIRMATION_COOKIE } from "@/lib/ballot-confirmation";

export async function DELETE(): Promise<Response> {
  (await cookies()).delete(BALLOT_CONFIRMATION_COOKIE);
  return new Response(null, { status: 204 });
}
