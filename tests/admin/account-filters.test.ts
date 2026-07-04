import { describe, expect, test } from "vitest";
import {
  countActiveAccountFilters,
  filterAccounts,
  type AccountFilterState,
  type AccountFilterRow,
} from "@/app/(admin)/admin/accounts/account-filters";

const accounts: AccountFilterRow[] = [
  {
    id: "a1",
    email: "super@olps.edu",
    name: "Ana Admin",
    role: "SUPERADMIN",
    lastLogin: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "a2",
    email: "canvass@olps.edu",
    name: "Ben Canvasser",
    role: "CANVASSER",
    lastLogin: null,
  },
  {
    id: "a3",
    email: "officer@olps.edu",
    name: "Cara Officer",
    role: "OFFICER",
    lastLogin: "2026-07-02T10:00:00.000Z",
  },
];

const defaultFilters: AccountFilterState = {
  query: "",
  role: "ALL",
  loginState: "ALL",
};

describe("account filters", () => {
  test("filters accounts by name or email query", () => {
    expect(filterAccounts(accounts, { ...defaultFilters, query: "cara" }).map((account) => account.id)).toEqual(["a3"]);
    expect(filterAccounts(accounts, { ...defaultFilters, query: "canvass@" }).map((account) => account.id)).toEqual(["a2"]);
  });

  test("filters accounts by role and login state", () => {
    expect(filterAccounts(accounts, { ...defaultFilters, role: "OFFICER" }).map((account) => account.id)).toEqual(["a3"]);
    expect(filterAccounts(accounts, { ...defaultFilters, loginState: "NEVER" }).map((account) => account.id)).toEqual(["a2"]);
    expect(filterAccounts(accounts, { ...defaultFilters, loginState: "HAS_LOGIN" }).map((account) => account.id)).toEqual(["a1", "a3"]);
  });

  test("counts active filters", () => {
    expect(countActiveAccountFilters(defaultFilters)).toBe(0);
    expect(countActiveAccountFilters({ query: "ana", role: "SUPERADMIN", loginState: "HAS_LOGIN" })).toBe(3);
  });
});
