import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { FilterGroup } from "@/components/admin/filter-panel";

type TestFilterGroupProps = Omit<ComponentProps<typeof FilterGroup>, "children"> & {
  children?: ComponentProps<typeof FilterGroup>["children"];
};

const TestFilterGroup = FilterGroup as ComponentType<TestFilterGroupProps>;

function renderFilterGroup(defaultOpen?: boolean) {
  return renderToStaticMarkup(
    createElement(
      TestFilterGroup,
      {
        icon: createElement("span", { "aria-hidden": true }, "I"),
        label: "Status",
        value: "All statuses",
        defaultOpen,
      },
      createElement("button", { type: "button" }, "All"),
    ),
  );
}

describe("FilterGroup", () => {
  test("starts folded in by default", () => {
    expect(renderFilterGroup()).toContain('aria-expanded="false"');
  });

  test("can still opt into an expanded initial state", () => {
    expect(renderFilterGroup(true)).toContain('aria-expanded="true"');
  });
});
