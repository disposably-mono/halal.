import { describe, expect, test } from "vitest";
import type { ReactElement } from "react";
import { highlightMatch } from "@/components/admin/highlight";

function isElement(part: unknown): part is ReactElement<{ children: string }> {
  return typeof part === "object" && part !== null;
}

describe("highlightMatch", () => {
  test("returns the original text unchanged when there is no query", () => {
    expect(highlightMatch("Ali Borbe", undefined)).toBe("Ali Borbe");
    expect(highlightMatch("Ali Borbe", "")).toBe("Ali Borbe");
    expect(highlightMatch("Ali Borbe", "   ")).toBe("Ali Borbe");
  });

  test("returns the original text unchanged when nothing matches", () => {
    expect(highlightMatch("Ali Borbe", "xyz")).toBe("Ali Borbe");
  });

  test("wraps a single case-insensitive match in a <mark>, preserving original casing", () => {
    const result = highlightMatch("Ali Borbe", "ali") as (string | ReactElement)[];

    expect(result).toHaveLength(2);
    expect(isElement(result[0])).toBe(true);
    const mark = result[0] as ReactElement<{ children: string }>;
    expect(mark.type).toBe("mark");
    expect(mark.props.children).toBe("Ali");
    expect(result[1]).toBe(" Borbe");
  });

  test("highlights every occurrence of the query", () => {
    const result = highlightMatch("ana ana", "ana") as (string | ReactElement<{ children: string }>)[];
    const marks = result.filter(isElement);

    expect(marks).toHaveLength(2);
    expect(marks[0].props.children).toBe("ana");
    expect(marks[1].props.children).toBe("ana");
    expect(result).toEqual([marks[0], " ", marks[1]]);
  });

  test("matches a query that spans a case-mixed substring", () => {
    const result = highlightMatch("borbe_alejandromiguel@olps.edu.ph", "BORBE") as (string | ReactElement<{ children: string }>)[];

    expect(isElement(result[0])).toBe(true);
    expect((result[0] as ReactElement<{ children: string }>).props.children).toBe("borbe");
  });
});
