import type { ReactNode } from "react";

/**
 * Wraps every case-insensitive occurrence of `query` inside `text` in a
 * <mark>, so every admin search box can highlight its own matches the same
 * way. Returns the original string unchanged when there's no active query
 * or no match, so callers can use it unconditionally.
 */
export function highlightMatch(text: string, query?: string): ReactNode {
  const needle = query?.trim().toLowerCase();
  if (!needle) return text;

  const haystack = text.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = haystack.indexOf(needle, cursor);

  if (index === -1) return text;

  let key = 0;
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index));
    parts.push(
      <mark key={key++} className="rounded-[2px] bg-gold px-[2px] text-admin-bg">
        {text.slice(index, index + needle.length)}
      </mark>,
    );
    cursor = index + needle.length;
    index = haystack.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return parts;
}
