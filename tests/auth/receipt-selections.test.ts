import { describe, expect, test } from "vitest";
import { toVerifiedSelections } from "@/app/verify/verification-selections";

describe("receipt verification selections", () => {
  test("formats candidate choices and abstentions for display", () => {
    const selections = toVerifiedSelections([
      {
        isAbstain: false,
        positionId: "president",
        position: { title: "President" },
        candidate: { fullName: "Ana Reyes", gradeLevel: 12 },
      },
      {
        isAbstain: true,
        positionId: "secretary",
        position: { title: "Secretary" },
        candidate: null,
      },
    ]);

    expect(selections).toEqual([
      {
        positionId: "president",
        positionTitle: "President",
        choiceLabel: "Ana Reyes",
        detail: "Grade 12",
      },
      {
        positionId: "secretary",
        positionTitle: "Secretary",
        choiceLabel: "Abstain",
        detail: "No candidate selected",
      },
    ]);
  });
});
