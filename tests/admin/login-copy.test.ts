import { describe, expect, test } from "vitest";
import { getOfficerKeyFailure } from "../../app/admin/login/login-copy";

describe("admin login copy helpers", () => {
  test("maps primary credential failure to a step reset", () => {
    expect(getOfficerKeyFailure("primary")).toEqual({
      field: "credentials",
      message: "Incorrect email or password. Please try again.",
      shouldResetToCredentials: true,
    });
  });

  test("maps officer-key failures to safe messages", () => {
    expect(getOfficerKeyFailure("ownOfficerKey")).toMatchObject({
      field: "officerKey",
      message: "You cannot use your own officer key. Ask another COMELEC officer to verify.",
    });
    expect(getOfficerKeyFailure("unknown")).toMatchObject({
      field: "officerKey",
      message: "That key does not match another COMELEC officer. Please try again.",
    });
  });
});
