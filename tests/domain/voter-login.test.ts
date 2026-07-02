import { describe, expect, it } from "vitest";
import {
  notOpenMessage,
  OTHER_OPEN_ELECTION_HINT,
} from "@/lib/domain/voter-login";

describe("notOpenMessage", () => {
  it("returns the plain closed message when no other open election exists", () => {
    expect(notOpenMessage("CLOSED", false)).toBe(
      "This election has already closed.",
    );
  });

  it("appends the hint when the student has another open, unvoted election", () => {
    expect(notOpenMessage("CLOSED", true)).toBe(
      "This election has already closed." + OTHER_OPEN_ELECTION_HINT,
    );
  });

  it("uses the scheduled message for SCHEDULED", () => {
    expect(notOpenMessage("SCHEDULED", false)).toBe(
      "Voting has not started yet. Check the schedule.",
    );
  });

  it("uses the draft message for DRAFT", () => {
    expect(notOpenMessage("DRAFT", false)).toBe(
      "This election has not been opened yet.",
    );
  });

  it("falls back to a generic message for an unknown status", () => {
    expect(notOpenMessage("WEIRD", false)).toBe(
      "This election is not currently open.",
    );
  });

  it("appends the hint even on the generic fallback", () => {
    expect(notOpenMessage("WEIRD", true)).toBe(
      "This election is not currently open." + OTHER_OPEN_ELECTION_HINT,
    );
  });
});
