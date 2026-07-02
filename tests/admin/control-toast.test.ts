import { describe, expect, test } from "vitest";
import { getControlSuccessToast } from "@/app/(admin)/admin/elections/[id]/control/toast-messages";

describe("control success toasts", () => {
  test("uses non-error variants for successful lifecycle actions", () => {
    expect(getControlSuccessToast("open")).toEqual({
      msg: "Election is now OPEN",
      variant: "success",
    });
    expect(getControlSuccessToast("close")).toEqual({
      msg: "Election closed",
      variant: "warning",
    });
    expect(getControlSuccessToast("archive")).toEqual({
      msg: "Election archived",
      variant: "warning",
    });
  });
});
