import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AccordionCard } from "@/components/admin/accordion-card";

function renderAccordionCard(defaultOpen?: boolean) {
  return renderToStaticMarkup(
    createElement(
      AccordionCard,
      {
        title: "Recent sign-ins",
        meta: createElement("span", null, "2 shown"),
        defaultOpen,
      },
      createElement("p", null, "Rows go here"),
    ),
  );
}

describe("AccordionCard", () => {
  test("starts folded in by default", () => {
    expect(renderAccordionCard()).toContain('aria-expanded="false"');
  });

  test("can opt into an expanded initial state", () => {
    expect(renderAccordionCard(true)).toContain('aria-expanded="true"');
  });
});
