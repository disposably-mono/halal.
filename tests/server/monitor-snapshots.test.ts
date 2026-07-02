import { describe, expect, it } from "vitest";
import { bucketFor, pruneCutoffIndex, SNAPSHOT_RETENTION } from "@/lib/server/monitor-snapshots";
import { POLL_INTERVAL } from "@/app/(admin)/admin/elections/[id]/monitor/_components/monitor-shared";

describe("bucketFor", () => {
  it("maps an exact bucket-boundary epoch to that bucket number", () => {
    expect(bucketFor(0)).toBe(0);
    expect(bucketFor(POLL_INTERVAL)).toBe(1);
    expect(bucketFor(POLL_INTERVAL * 42)).toBe(42);
  });

  it("floors sub-bucket offsets into the containing bucket", () => {
    expect(bucketFor(1)).toBe(0);
    expect(bucketFor(POLL_INTERVAL - 1)).toBe(0);
    expect(bucketFor(POLL_INTERVAL + 1)).toBe(1);
    expect(bucketFor(POLL_INTERVAL * 2 - 1)).toBe(1);
  });

  it("handles large, real-world epoch millisecond values", () => {
    const now = Date.parse("2026-07-02T12:00:00.000Z");
    const bucket = bucketFor(now);
    expect(bucket).toBe(Math.floor(now / POLL_INTERVAL));
    expect(Number.isSafeInteger(bucket)).toBe(true);
  });

  it("maps two timestamps in the same 30s window to the same bucket", () => {
    const base = Date.parse("2026-07-02T12:00:00.000Z");
    const early = base;
    const late = base + POLL_INTERVAL - 1;
    expect(bucketFor(early)).toBe(bucketFor(late));
  });

  it("maps timestamps in adjacent 30s windows to different buckets", () => {
    const base = Date.parse("2026-07-02T12:00:00.000Z");
    const thisWindow = base;
    const nextWindow = base + POLL_INTERVAL;
    expect(bucketFor(thisWindow)).not.toBe(bucketFor(nextWindow));
    expect(bucketFor(nextWindow)).toBe(bucketFor(thisWindow) + 1);
  });
});

describe("pruneCutoffIndex", () => {
  it("returns null when there are fewer rows than the retention limit", () => {
    const timestamps = [1000, 2000, 3000];
    expect(pruneCutoffIndex(timestamps, 10)).toBeNull();
  });

  it("returns null when the row count exactly equals the retention limit", () => {
    const timestamps = [1000, 2000, 3000];
    expect(pruneCutoffIndex(timestamps, 3)).toBeNull();
  });

  it("returns the timestamp of the oldest row to keep when over the limit", () => {
    // 5 rows, keep newest 3 → cutoff should be the 3rd-newest timestamp (3000).
    const timestamps = [5000, 4000, 3000, 2000, 1000];
    expect(pruneCutoffIndex(timestamps, 3)).toBe(3000);
  });

  it("is order-independent (unsorted input still finds the correct cutoff)", () => {
    const timestamps = [2000, 5000, 1000, 4000, 3000];
    expect(pruneCutoffIndex(timestamps, 3)).toBe(3000);
  });

  it("uses SNAPSHOT_RETENTION as a sane default scale (~2h at 30s buckets)", () => {
    expect(SNAPSHOT_RETENTION).toBe(240);
    const timestamps = Array.from({ length: SNAPSHOT_RETENTION + 1 }, (_, i) => i * 1000);
    // Oldest is 0ms; with retention N out of N+1 rows, cutoff keeps the newest N,
    // pruning exactly the single oldest row (timestamp 0).
    expect(pruneCutoffIndex(timestamps, SNAPSHOT_RETENTION)).toBe(1000);
  });
});
