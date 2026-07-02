import { describe, expect, test } from "vitest";
import {
  canAccessMonitor,
  getMonitorFallbackHref,
} from "@/app/(admin)/admin/elections/[id]/monitor/monitor-access";

describe("monitor access", () => {
  test("blocks monitor access before an election is available to monitor", () => {
    expect(canAccessMonitor("DRAFT")).toBe(false);
    expect(canAccessMonitor("SCHEDULED")).toBe(false);
  });

  test("allows monitor access once an election has live or final results", () => {
    expect(canAccessMonitor("OPEN")).toBe(true);
    expect(canAccessMonitor("CLOSED")).toBe(true);
  });

  test("routes unavailable monitor pages back to election control", () => {
    expect(getMonitorFallbackHref("election-123")).toBe("/admin/elections/election-123/control");
  });
});
