import { describe, expect, test } from "vitest";
import {
  filterLoginHistory,
  summarizeLoginHistory,
  type HistoryDateFilter,
  type HistoryPersonFilter,
  type LoginHistoryIndexRow,
} from "@/app/(admin)/admin/history/history-index";

const baseNow = new Date("2026-07-03T08:00:00.000Z");

const rows: LoginHistoryIndexRow[] = [
  {
    id: "history-1",
    createdAt: "2026-07-03T07:30:00.000Z",
    officerName: "Ana Santos",
    officerEmail: "ana@olps.edu.ph",
    verifierName: "Ben Cruz",
    verifierEmail: "ben@olps.edu.ph",
  },
  {
    id: "history-2",
    createdAt: "2026-06-29T02:00:00.000Z",
    officerName: "Carlo Reyes",
    officerEmail: "carlo@olps.edu.ph",
    verifierName: "Ana Santos",
    verifierEmail: "ana@olps.edu.ph",
  },
  {
    id: "history-3",
    createdAt: "2026-05-20T10:00:00.000Z",
    officerName: "Dina Lim",
    officerEmail: "dina@olps.edu.ph",
    verifierName: "Eli Tan",
    verifierEmail: "eli@olps.edu.ph",
  },
];

describe("history index helpers", () => {
  test("summarizes visible login history without mutating rows", () => {
    const summary = summarizeLoginHistory(rows);

    expect(summary).toEqual({
      total: 3,
      uniqueOfficers: 3,
      uniqueVerifiers: 3,
    });
    expect(rows[0]).toEqual({
      id: "history-1",
      createdAt: "2026-07-03T07:30:00.000Z",
      officerName: "Ana Santos",
      officerEmail: "ana@olps.edu.ph",
      verifierName: "Ben Cruz",
      verifierEmail: "ben@olps.edu.ph",
    });
  });

  test("filters by query, person role, and date window", () => {
    const filtered = filterLoginHistory(rows, {
      query: "ana",
      person: "VERIFIER",
      date: "7D",
      now: baseNow,
    });

    expect(filtered.map((row) => row.id)).toEqual(["history-2"]);
  });

  test.each([
    ["ALL", ["history-1", "history-2", "history-3"]],
    ["TODAY", ["history-1"]],
    ["7D", ["history-1", "history-2"]],
    ["30D", ["history-1", "history-2"]],
  ] satisfies [HistoryDateFilter, string[]][])("filters %s date ranges", (date, expectedIds) => {
    expect(filterLoginHistory(rows, { query: "", person: "ALL", date, now: baseNow }).map((row) => row.id)).toEqual(expectedIds);
  });

  test.each([
    ["ALL", ["history-1", "history-2"]],
    ["OFFICER", ["history-1"]],
    ["VERIFIER", ["history-2"]],
  ] satisfies [HistoryPersonFilter, string[]][])("searches %s people", (person, expectedIds) => {
    expect(filterLoginHistory(rows, { query: "ana", person, date: "ALL", now: baseNow }).map((row) => row.id)).toEqual(expectedIds);
  });

  test("excludes future rows from rolling date windows", () => {
    const filtered = filterLoginHistory(
      [
        ...rows,
        {
          id: "history-future",
          createdAt: "2026-07-04T08:00:00.000Z",
          officerName: "Future Officer",
          officerEmail: "future@olps.edu.ph",
          verifierName: "Time Verifier",
          verifierEmail: "time@olps.edu.ph",
        },
      ],
      { query: "", person: "ALL", date: "7D", now: baseNow },
    );

    expect(filtered.map((row) => row.id)).not.toContain("history-future");
  });

  test("excludes same-day future rows from the today filter", () => {
    const filtered = filterLoginHistory(
      [
        ...rows,
        {
          id: "history-future-today",
          createdAt: "2026-07-03T09:00:00.000Z",
          officerName: "Future Officer",
          officerEmail: "future-today@olps.edu.ph",
          verifierName: "Time Verifier",
          verifierEmail: "time-today@olps.edu.ph",
        },
      ],
      { query: "", person: "ALL", date: "TODAY", now: baseNow },
    );

    expect(filtered.map((row) => row.id)).not.toContain("history-future-today");
  });
});
