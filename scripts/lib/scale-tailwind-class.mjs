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
