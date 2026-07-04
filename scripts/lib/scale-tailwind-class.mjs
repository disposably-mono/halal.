export const SCALE_FACTOR = 1.12;
export const SPACING_UNIT_PX = 4; // Tailwind default: 1 spacing unit = 0.25rem = 4px

function scalePx(px, factor) {
  return Math.round(px * factor);
}

export function scaleArbitraryToken(prefix, px, factor = SCALE_FACTOR) {
  return `${prefix}-[${scalePx(Number(px), factor)}px]`;
}

export function scaleSemanticToken(prefix, n, factor = SCALE_FACTOR) {
  const px = Number(n) * SPACING_UNIT_PX;
  return `${prefix}-[${scalePx(px, factor)}px]`;
}

// Listed for clarity, not correctness — order does not change matching
// behavior. Tailwind's own naming avoids ambiguity (e.g. "p-4" requires a
// literal hyphen right after "p", which "px-4" does not have, so "p" and
// "px" never collide regardless of list order).
const PREFIXES = [
  "min-h", "max-h", "min-w", "max-w",
  "gap-x", "gap-y", "inset-x", "inset-y", "translate-x", "translate-y",
  "text", "leading", "rounded", "size", "gap", "inset",
  "top", "left", "right", "bottom",
  "h", "w",
  "px", "py", "pt", "pb", "pl", "pr", "p",
  "mx", "my", "mt", "mb", "ml", "mr", "m",
];

const ARBITRARY_RE = new RegExp(`\\b(${PREFIXES.join("|")})-\\[(\\d+)px\\]`, "g");

// "rounded" and "text" have no bare-number semantic form in Tailwind v4
// (rounded-lg/xl/full and text-sm/lg/xl are named tokens, never bare
// numbers), so both are excluded here — only handled above via the
// arbitrary-bracket pattern.
const SEMANTIC_PREFIXES = PREFIXES.filter((p) => p !== "rounded" && p !== "text");
const SEMANTIC_RE = new RegExp(
  `\\b(${SEMANTIC_PREFIXES.join("|")})-(\\d+(?:\\.\\d+)?)\\b(?!/)`,
  "g",
);

const SVG_ICON_RE = /style=\{\{\s*width:\s*(\d+),\s*height:\s*(\d+)/g;

export function scaleFileContents(source, factor = SCALE_FACTOR) {
  let result = source.replace(ARBITRARY_RE, (_match, prefix, px) =>
    scaleArbitraryToken(prefix, px, factor),
  );
  result = result.replace(SEMANTIC_RE, (_match, prefix, n) =>
    scaleSemanticToken(prefix, n, factor),
  );
  result = result.replace(
    SVG_ICON_RE,
    (_match, w, h) =>
      `style={{ width: ${scalePx(Number(w), factor)}, height: ${scalePx(Number(h), factor)}`,
  );
  return result;
}
