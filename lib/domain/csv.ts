/**
 * CSV serialization with spreadsheet-injection defenses.
 *
 * Two concerns are handled per cell:
 *  1. RFC 4180 quoting — a value containing a comma, double quote, CR, or LF is
 *     wrapped in double quotes with any internal quotes doubled.
 *  2. Formula injection — a value a spreadsheet would execute as a formula
 *     (leading `= + - @`, or a leading tab/CR) is prefixed with an apostrophe so
 *     Excel/Sheets/LibreOffice render it as inert text instead of running it.
 *
 * Quoting is applied after neutralization so the apostrophe is preserved inside
 * any quotes that quoting then adds.
 */

const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

export function escapeCsvCell(value: string | number): string {
  let cell = String(value);

  if (cell.length > 0 && FORMULA_TRIGGERS.has(cell[0]!)) {
    cell = `'${cell}`;
  }

  if (/[",\r\n]/.test(cell)) {
    cell = `"${cell.replace(/"/g, '""')}"`;
  }

  return cell;
}

export function rowsToCsv(
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
): string {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}
