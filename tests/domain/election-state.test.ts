import { describe, expect, it } from "vitest";
import {
  canAdvanceToScheduled,
  canArchive,
  canFinalizeUnlock,
  canManuallyClose,
  canManuallyOpen,
  canReschedule,
  canRestore,
  nextStatusForReschedule,
} from "@/lib/domain/election-state";

describe("canManuallyOpen", () => {
  it("allows opening from SCHEDULED", () => {
    expect(canManuallyOpen("SCHEDULED")).toEqual({ ok: true });
  });

  it("blocks reopening when already OPEN", () => {
    const r = canManuallyOpen("OPEN");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/already/i);
  });

  it("blocks reopening when CLOSED", () => {
    const r = canManuallyOpen("CLOSED");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/closed/i);
  });

  it("blocks opening directly from DRAFT (must advance to SCHEDULED first)", () => {
    const r = canManuallyOpen("DRAFT");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/draft/i);
  });
});

describe("canManuallyClose", () => {
  it("allows closing OPEN", () => {
    expect(canManuallyClose("OPEN")).toEqual({ ok: true });
  });

  it("blocks closing DRAFT/SCHEDULED/CLOSED", () => {
    expect(canManuallyClose("DRAFT").ok).toBe(false);
    expect(canManuallyClose("SCHEDULED").ok).toBe(false);
    expect(canManuallyClose("CLOSED").ok).toBe(false);
  });
});

describe("canReschedule", () => {
  const open = new Date("2026-05-09T08:00:00Z");
  const close = new Date("2026-05-09T17:00:00Z");

  it("allows valid window in non-CLOSED states", () => {
    expect(canReschedule("DRAFT", open, close)).toEqual({ ok: true });
    expect(canReschedule("SCHEDULED", open, close)).toEqual({ ok: true });
    expect(canReschedule("OPEN", open, close)).toEqual({ ok: true });
  });

  it("blocks reschedule of CLOSED elections", () => {
    const r = canReschedule("CLOSED", open, close);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/closed/i);
  });

  it("rejects open >= close", () => {
    const r = canReschedule("DRAFT", close, open);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/before close/i);
  });

  it("accepts null close (only open scheduled)", () => {
    expect(canReschedule("DRAFT", open, null)).toEqual({ ok: true });
  });

  it("accepts both null (clearing schedule)", () => {
    expect(canReschedule("DRAFT", null, null)).toEqual({ ok: true });
  });
});

describe("canAdvanceToScheduled", () => {
  const open = new Date("2026-05-09T08:00:00Z");

  it("allows DRAFT with scheduledOpen set", () => {
    expect(canAdvanceToScheduled("DRAFT", open)).toEqual({ ok: true });
  });

  it("blocks DRAFT without scheduledOpen", () => {
    const r = canAdvanceToScheduled("DRAFT", null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/scheduled open/i);
  });

  it("blocks non-DRAFT statuses", () => {
    expect(canAdvanceToScheduled("SCHEDULED", open).ok).toBe(false);
    expect(canAdvanceToScheduled("OPEN", open).ok).toBe(false);
    expect(canAdvanceToScheduled("CLOSED", open).ok).toBe(false);
  });
});

describe("nextStatusForReschedule", () => {
  it("returns SCHEDULED when an open time is set", () => {
    expect(nextStatusForReschedule(new Date())).toBe("SCHEDULED");
  });

  it("returns DRAFT when open time cleared", () => {
    expect(nextStatusForReschedule(null)).toBe("DRAFT");
  });
});

describe("canFinalizeUnlock", () => {
  it("allows unlock from DRAFT or SCHEDULED", () => {
    expect(canFinalizeUnlock("DRAFT")).toEqual({ ok: true });
    expect(canFinalizeUnlock("SCHEDULED")).toEqual({ ok: true });
  });

  it("blocks unlock once OPEN or CLOSED", () => {
    expect(canFinalizeUnlock("OPEN").ok).toBe(false);
    expect(canFinalizeUnlock("CLOSED").ok).toBe(false);
  });
});

describe("canArchive", () => {
  it("allows archiving a DRAFT election", () => {
    expect(canArchive("DRAFT", null)).toEqual({ ok: true });
  });
  it("allows archiving a CLOSED election", () => {
    expect(canArchive("CLOSED", null)).toEqual({ ok: true });
  });
  it("rejects archiving an OPEN election", () => {
    expect(canArchive("OPEN", null)).toEqual({
      ok: false,
      reason: "Close the election before archiving",
    });
  });
  it("rejects archiving a SCHEDULED election", () => {
    expect(canArchive("SCHEDULED", null)).toEqual({
      ok: false,
      reason: "Unschedule the election before archiving",
    });
  });
  it("rejects archiving an already-archived election", () => {
    expect(canArchive("CLOSED", new Date())).toEqual({
      ok: false,
      reason: "Already archived",
    });
  });
});

describe("canRestore", () => {
  it("allows restoring an archived election", () => {
    expect(canRestore(new Date())).toEqual({ ok: true });
  });
  it("rejects restoring a non-archived election", () => {
    expect(canRestore(null)).toEqual({
      ok: false,
      reason: "Election is not archived",
    });
  });
});
