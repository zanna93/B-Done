import type { ValidationIssue } from "../domain/models";
import { err, ok, type Result } from "../utils/result";

export interface CsvRow {
  line: number;
  values: Record<string, string>;
}

export interface CsvDocument {
  headers: string[];
  rows: CsvRow[];
}

export function parseCsv(file: string, text: string, expectedHeaders?: string[]): Result<CsvDocument, ValidationIssue> {
  const errors: ValidationIssue[] = [];
  const rawRows = readRows(file, text, errors);
  if (errors.length > 0) return err(errors);

  const nonEmptyRows = rawRows.filter((row) => row.values.some((value) => value.trim().length > 0));
  if (nonEmptyRows.length === 0) {
    return err({ file, line: 1, message: "Il CSV è vuoto." });
  }

  const headers = nonEmptyRows[0]?.values.map((header) => header.trim()) ?? [];
  if (expectedHeaders && headers.join(",") !== expectedHeaders.join(",")) {
    return err({
      file,
      line: nonEmptyRows[0]?.line ?? 1,
      message: `Intestazioni non valide. Attese: ${expectedHeaders.join(",")}.`,
    });
  }

  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) {
    return err({ file, line: 1, message: `Intestazione duplicata: ${duplicateHeader}.` });
  }

  const rows: CsvRow[] = [];
  for (const row of nonEmptyRows.slice(1)) {
    if (row.values.length !== headers.length) {
      errors.push({
        file,
        line: row.line,
        message: `Numero colonne non valido: trovate ${row.values.length}, attese ${headers.length}.`,
      });
      continue;
    }

    rows.push({
      line: row.line,
      values: Object.fromEntries(headers.map((header, index) => [header, row.values[index]?.trim() ?? ""])),
    });
  }

  return errors.length > 0 ? err(errors) : ok({ headers, rows });
}

function readRows(
  file: string,
  text: string,
  errors: ValidationIssue[],
): Array<{ line: number; values: string[] }> {
  const rows: Array<{ line: number; values: string[] }> = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let rowStartLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      row.push(field);
      rows.push({ line: rowStartLine, values: row });
      row = [];
      field = "";
      if (char === "\r" && next === "\n") index += 1;
      line += 1;
      rowStartLine = line;
      continue;
    }

    if (char === "\n" || char === "\r") {
      line += 1;
    }

    field += char;
  }

  if (inQuotes) {
    errors.push({ file, line, message: "Virgolette non chiuse nel CSV." });
    return rows;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push({ line: rowStartLine, values: row });
  }

  return rows;
}
