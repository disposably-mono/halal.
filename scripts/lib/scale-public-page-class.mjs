export const SMALL_SCALE_FACTOR = 1.2;
export const LARGE_SCALE_FACTOR = 1.13;
export const BALLOT_SCALE_FACTOR = 1.13;
export const ADMIN_SCALE_FACTOR = 1.12;
export const SMALL_SIZE_THRESHOLD_PX = 16;
export const SPACING_UNIT_PX = 4;

const SEMANTIC_TEXT_PX = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
};

function selectScaleFactor(px) {
  return px <= SMALL_SIZE_THRESHOLD_PX ? SMALL_SCALE_FACTOR : LARGE_SCALE_FACTOR;
}

function scalePx(px) {
  return Math.round(px * selectScaleFactor(px));
}

function scaleFixedPx(px, factor) {
  return Math.round(px * factor);
}

export function scalePublicArbitraryToken(prefix, px) {
  return `${prefix}-[${scalePx(Number(px))}px]`;
}

export function scalePublicSemanticToken(prefix, n) {
  const px = Number(n) * SPACING_UNIT_PX;
  return `${prefix}-[${scalePx(px)}px]`;
}

export function scalePublicSemanticTextToken(token) {
  const px = SEMANTIC_TEXT_PX[token];
  if (px === undefined) return `text-${token}`;
  return `text-[${scalePx(px)}px]`;
}

const PREFIXES = [
  "min-h", "max-h", "min-w", "max-w",
  "gap-x", "gap-y", "space-x", "space-y", "inset-x", "inset-y", "translate-x", "translate-y",
  "text", "leading", "rounded", "size", "gap", "inset",
  "top", "left", "right", "bottom",
  "h", "w",
  "px", "py", "pt", "pb", "pl", "pr", "p",
  "mx", "my", "mt", "mb", "ml", "mr", "m",
];

const TOKEN_START = "(?<=^|[\\s\"'\\`:])";

const ARBITRARY_RE = new RegExp(
  `${TOKEN_START}(-?)(${PREFIXES.join("|")})-\\[(\\d+(?:\\.\\d+)?)px\\]`,
  "g",
);

const SEMANTIC_PREFIXES = PREFIXES.filter((prefix) => prefix !== "rounded" && prefix !== "text");
const SEMANTIC_RE = new RegExp(
  `${TOKEN_START}(-?)(${SEMANTIC_PREFIXES.join("|")})-(\\d+(?:\\.\\d+)?)\\b(?!/)`,
  "g",
);

const SEMANTIC_TEXT_RE = new RegExp(
  `${TOKEN_START}text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\\b`,
  "g",
);

const SVG_SIZE_RE = /(<svg[^>]*\swidth=")(\d+)("\s+height=")(\d+)(")/g;

function scaleFileContents(source, scaleTokenPx) {
  let result = source.replace(ARBITRARY_RE, (_match, sign, prefix, px) =>
    `${sign}${prefix}-[${scaleTokenPx(Number(px))}px]`,
  );
  result = result.replace(SEMANTIC_TEXT_RE, (_match, token) =>
    `text-[${scaleTokenPx(SEMANTIC_TEXT_PX[token])}px]`,
  );
  result = result.replace(SEMANTIC_RE, (_match, sign, prefix, n) =>
    `${sign}${prefix}-[${scaleTokenPx(Number(n) * SPACING_UNIT_PX)}px]`,
  );
  result = result.replace(SVG_SIZE_RE, (_match, start, width, middle, height, end) =>
    `${start}${scaleTokenPx(Number(width))}${middle}${scaleTokenPx(Number(height))}${end}`,
  );
  return result;
}

export function scalePublicFileContents(source) {
  return scaleFileContents(source, scalePx);
}

export function scaleBallotFileContents(source) {
  return scaleFileContents(source, (px) => scaleFixedPx(px, BALLOT_SCALE_FACTOR));
}

export function scaleAdminLoginFileContents(source) {
  return scaleFileContents(source, (px) => scaleFixedPx(px, ADMIN_SCALE_FACTOR));
}
