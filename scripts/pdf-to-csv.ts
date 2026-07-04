import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

type OutputRow = {
  date: string;
  zona: string;
  rifiuto: string;
  note: string;
  is_variazione: string;
  is_doppio_ritiro: string;
};

const [, , inputArg, outputArg = "data/raccolte_jesi_2026.generated.csv"] = process.argv;

if (!inputArg) {
  console.error("Uso: pnpm convert:pdf <calendario.pdf|calendario.txt> [output.csv]");
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);

if (!existsSync(inputPath)) {
  console.error(`File non trovato: ${inputPath}`);
  process.exit(1);
}

const text = readInputText(inputPath);
const rows = parseCalendarText(text);

if (rows.length === 0) {
  console.error("Nessuna riga calendario riconosciuta. Verifica il testo estratto dal PDF.");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, toCsv(rows), "utf8");
console.log(`Creato ${outputPath} con ${rows.length} righe. Verifica manualmente prima della pubblicazione.`);

function readInputText(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".txt" || extension === ".csv") {
    return readFileSync(path, "utf8");
  }

  if (extension === ".pdf") {
    try {
      return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" });
    } catch {
      console.error(
        `Impossibile leggere ${basename(path)}. Installa Poppler/pdftotext oppure passa un .txt già estratto dal PDF.`,
      );
      process.exit(1);
    }
  }

  console.error("Formato non supportato. Usa PDF o TXT.");
  process.exit(1);
}

function parseCalendarText(text: string): OutputRow[] {
  const rows: OutputRow[] = [];
  const datePattern = /(\d{1,2})[\/.-](\d{1,2})[\/.-](2026)\s+(.+)/i;

  for (const line of text.split(/\r?\n/)) {
    const normalized = line.replace(/\s+/g, " ").trim();
    if (!normalized) continue;

    const match = normalized.match(datePattern);
    if (!match) continue;

    const [, day, month, year, rest] = match;
    const wasteTypes = detectWasteTypes(rest);
    if (wasteTypes.length === 0) continue;

    const zone = detectZone(rest);
    const isDoublePickup = wasteTypes.length > 1;

    rows.push({
      date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      zona: zone,
      rifiuto: wasteTypes.join(","),
      note: "generato da pdf-to-csv: verificare manualmente",
      is_variazione: /variaz|festiv|anticip|posticip/i.test(rest) ? "true" : "false",
      is_doppio_ritiro: String(isDoublePickup),
    });
  }

  return rows;
}

function detectWasteTypes(text: string): string[] {
  const value = text.toLowerCase();
  const matches = [
    ["organico", /organico|umido/],
    ["carta", /carta|cartone/],
    ["plastica", /plastica|multimateriale/],
    ["vetro", /vetro/],
    ["secco", /secco|indifferenziato/],
  ] as const;

  return matches.filter(([, pattern]) => pattern.test(value)).map(([waste]) => waste);
}

function detectZone(text: string): string {
  const value = text.toLowerCase();
  if (/industrial/.test(value)) return "industriale";
  if (/periferia|ovest|montecappone|tabano|coppara/.test(value)) return "periferia_ovest";
  return "residenziale";
}

function toCsv(rows: OutputRow[]): string {
  const headers = ["date", "zona", "rifiuto", "note", "is_variazione", "is_doppio_ritiro"] as const;
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    "",
  ].join("\n");
}

function escapeCsv(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
