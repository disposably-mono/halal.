import { describe, expect, test } from "vitest";
import { validateCreateElectionForm } from "@/app/(admin)/admin/elections/new/form-state";

describe("create election form state", () => {
  test("returns field errors for invalid form data", () => {
    const formData = new FormData();
    formData.set("name", "");
    formData.set("division", "NOPE");

    expect(validateCreateElectionForm(formData)).toEqual({
      success: false,
      errors: {
        division: "Select a valid division.",
        name: "Election name is required.",
      },
    });
  });

  test("accepts optional schedule fields", () => {
    const formData = new FormData();
    formData.set("name", "COMELEC Election");
    formData.set("division", "JHS");
    formData.set("scheduledOpen", "");
    formData.set("scheduledClose", "");

    expect(validateCreateElectionForm(formData)).toEqual({
      success: true,
      data: {
        division: "JHS",
        name: "COMELEC Election",
        scheduledClose: null,
        scheduledOpen: null,
      },
    });
  });
});
