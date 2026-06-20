import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteCookie = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ delete: deleteCookie })),
}));

import { DELETE } from "@/app/api/ballot-confirmation/route";
import { BALLOT_CONFIRMATION_COOKIE } from "@/lib/ballot-confirmation";

describe("ballot confirmation cleanup", () => {
  beforeEach(() => {
    deleteCookie.mockClear();
  });

  it("expires the one-time receipt after the confirmation page renders", async () => {
    const response = await DELETE();

    expect(response.status).toBe(204);
    expect(deleteCookie).toHaveBeenCalledOnce();
    expect(deleteCookie).toHaveBeenCalledWith(BALLOT_CONFIRMATION_COOKIE);
  });
});
