import { describe, expect, it } from "vitest";
import {
  canAdvanceToScheduled,
  canArchive,
  canEditCandidateRoster,
  canEditVoterRoster,
  canFinalizeUnlock,
  canManuallyClose,
  canManuallyOpen,
  canReschedule,
  canRestore,
  nextStatusForReschedule,
} from "@/lib/domain/election-state";

describe("canManuallyOpen", () => {
  it("allows opening from SCHEDULED", () => {
    expect(canManuallyOpen("SCHEDULED", null)).toEqual({ ok: true });
  });

  it("blocks reopening when already OPEN", () => {
    const r = canManuallyOpen("OPEN", null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/already/i);
  });

  it("blocks reopening when CLOSED", () => {
    const r = canManuallyOpen("CLOSED", null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/closed/i);
  });

  it("blocks opening directly from DRAFT (must advance to SCHEDULED first)", () => {
    const r = canManuallyOpen("DRAFT", null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/draft/i);
  });

  it("blocks opening an archived election", () => {
    const r = canManuallyOpen("SCHEDULED", new Date());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/restore.*archive/i);
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
    expect(canReschedule("DRAFT", open, close, null)).toEqual({ ok: true });
    expect(canReschedule("SCHEDULED", open, close, null)).toEqual({ ok: true });
    expect(canReschedule("OPEN", open, close, null)).toEqual({ ok: true });
  });

  it("blocks reschedule of CLOSED elections", () => {
    const r = canReschedule("CLOSED", open, close, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/closed/i);
  });

  it("rejects open >= close", () => {
    const r = canReschedule("DRAFT", close, open, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/before close/i);
  });

  it("accepts null close (only open scheduled)", () => {
    expect(canReschedule("DRAFT", open, null, null)).toEqual({ ok: true });
  });

  it("accepts both null (clearing schedule)", () => {
    expect(canReschedule("DRAFT", null, null, null)).toEqual({ ok: true });
  });

  it("blocks reschedule of an archived election", () => {
    const r = canReschedule("DRAFT", open, close, new Date());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/restore.*archive/i);
  });
});

describe("canAdvanceToScheduled", () => {
  const open = new Date("2026-05-09T08:00:00Z");

  it("allows DRAFT with scheduledOpen set", () => {
    expect(canAdvanceToScheduled("DRAFT", open, null)).toEqual({ ok: true });
  });

  it("blocks DRAFT without scheduledOpen", () => {
    const r = canAdvanceToScheduled("DRAFT", null, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/scheduled open/i);
  });

  it("blocks non-DRAFT statuses", () => {
    expect(canAdvanceToScheduled("SCHEDULED", open, null).ok).toBe(false);
    expect(canAdvanceToScheduled("OPEN", open, null).ok).toBe(false);
    expect(canAdvanceToScheduled("CLOSED", open, null).ok).toBe(false);
  });

  it("blocks advancing an archived election", () => {
    const r = canAdvanceToScheduled("DRAFT", open, new Date());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/restore.*archive/i);
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

describe("canEditCandidateRoster", () => {
  it("allows candidate edits only while unlocked before voting opens", () => {
    expect(canEditCandidateRoster("DRAFT", false)).toEqual({ ok: true });
    expect(canEditCandidateRoster("SCHEDULED", false)).toEqual({ ok: true });
  });

  it("blocks candidate edits after finalization", () => {
    expect(canEditCandidateRoster("DRAFT", true)).toEqual({
      ok: false,
      reason: "Candidate list is finalized and cannot be modified.",
    });
  });

  it("blocks candidate edits once voting has opened or closed", () => {
    expect(canEditCandidateRoster("OPEN", false).ok).toBe(false);
    expect(canEditCandidateRoster("CLOSED", false).ok).toBe(false);
  });
});

describe("canEditVoterRoster", () => {
  it("allows voter edits only while unlocked before voting opens", () => {
    expect(canEditVoterRoster("DRAFT", false)).toEqual({ ok: true });
    expect(canEditVoterRoster("SCHEDULED", false)).toEqual({ ok: true });
  });

  it("blocks voter edits after finalization", () => {
    expect(canEditVoterRoster("DRAFT", true)).toEqual({
      ok: false,
      reason: "Voter list is finalized and cannot be modified.",
    });
  });

  it("blocks voter edits once voting has opened or closed", () => {
    expect(canEditVoterRoster("OPEN", false).ok).toBe(false);
    expect(canEditVoterRoster("CLOSED", false).ok).toBe(false);
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
