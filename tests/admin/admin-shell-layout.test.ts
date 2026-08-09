import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { AdminShell } from "@/app/(admin)/admin/_components/AdminShell";
import type { NavSectionModel } from "@/app/(admin)/admin/_components/nav-model";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

const sections: NavSectionModel[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        iconKey: "dashboard",
        exact: true,
      },
    ],
  },
];

type TestAdminShellProps = Omit<ComponentProps<typeof AdminShell>, "children"> & {
  children?: ComponentProps<typeof AdminShell>["children"];
};

const TestAdminShell = AdminShell as ComponentType<TestAdminShellProps>;

function renderAdminShell() {
  return renderToStaticMarkup(
    createElement(
      TestAdminShell,
      {
        sections,
        adminName: "Admin",
        adminInitial: "A",
        signOutForm: createElement("form", null),
      },
      createElement("section", null, "Dashboard content"),
    ),
  );
}

describe("AdminShell desktop layout", () => {
  test("keeps the shell body, sidebar, and main scroller aligned below the 63px topbar", () => {
    const markup = renderAdminShell();

    expect(markup).toContain("h-[63px]");
    expect(markup).not.toContain("lg:h-[calc(100vh-3.5rem)]");
    expect(markup.match(/lg:h-\[calc\(100vh-63px\)\]/g)).toHaveLength(3);
  });
});
