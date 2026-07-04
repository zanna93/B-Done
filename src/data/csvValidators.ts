import {
  DEFAULT_ZONE,
  WASTE_TYPES,
  ZONES,
  type CollectionEvent,
  type DataMeta,
  type IsoDate,
  type StreetRecord,
  type ValidationIssue,
  type WasteType,
  type ZoneId,
} from "../domain/models";
import { isIsoDate } from "../utils/date";
import { err, ok, type Result } from "../utils/result";
import { normalizeStreetName } from "../utils/text";
import { parseCsv } from "./csvParser";

const COLLECTION_HEADERS = ["date", "zona", "rifiuto", "note", "is_variazione", "is_doppio_ritiro"];
const STREET_HEADERS = ["via", "zona", "note"];
const META_HEADERS = ["comune", "anno", "versione", "ultimo_aggiornamento", "fonte"];

export function parseCollectionCsv(file: string, text: string): Result<CollectionEvent[], ValidationIssue> {
  const parsed = parseCsv(file, text, COLLECTION_HEADERS);
  if (!parsed.ok) return parsed;

  const errors: ValidationIssue[] = [];
  const seenByDateAndZone = new Set<string>();
  const events: CollectionEvent[] = [];

  for (const row of parsed.value.rows) {
    const lineErrorCount = errors.length;
    const rawDate = row.values.date ?? "";
    const rawZone = row.values.zona ?? "";
    const rawWaste = row.values.rifiuto ?? "";
    const rawVariation = row.values.is_variazione ?? "";
    const rawDoublePickup = row.values.is_doppio_ritiro ?? "";

    const date: IsoDate | null = isIsoDate(rawDate) ? rawDate : null;
    const zone: ZoneId | null = isZone(rawZone) ? rawZone : null;
    const wasteTypes = rawWaste
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const typedWasteTypes = wasteTypes.filter(isWasteType);
    const variation = isBooleanString(rawVariation) ? rawVariation : null;
    const doublePickup = isBooleanString(rawDoublePickup) ? rawDoublePickup : null;

    if (!date) {
      errors.push({ file, line: row.line, message: `Data non valida: "${rawDate}". Usa YYYY-MM-DD.` });
    }

    if (!zone) {
      errors.push({ file, line: row.line, message: `Zona non valida: "${rawZone}".` });
    }

    if (wasteTypes.length === 0 || typedWasteTypes.length !== wasteTypes.length) {
      errors.push({ file, line: row.line, message: `Rifiuto non valido: "${rawWaste}".` });
    }

    if (!variation) {
      errors.push({ file, line: row.line, message: "is_variazione deve essere true o false." });
    }

    if (!doublePickup) {
      errors.push({ file, line: row.line, message: "is_doppio_ritiro deve essere true o false." });
    }

    if (date && zone) {
      const duplicateKey = `${date}|${zone}`;
      if (seenByDateAndZone.has(duplicateKey)) {
        errors.push({ file, line: row.line, message: `Ritiro duplicato per ${date} in zona ${zone}.` });
      }
      seenByDateAndZone.add(duplicateKey);
    }

    if (errors.length > lineErrorCount || !date || !zone || !variation || !doublePickup) continue;

    events.push({
      date,
      zone,
      wasteTypes: typedWasteTypes,
      notes: row.values.note ?? "",
      isVariation: variation === "true",
      isDoublePickup: doublePickup === "true",
    });
  }

  return errors.length > 0 ? err(errors) : ok(events.sort((a, b) => a.date.localeCompare(b.date)));
}

export function parseStreetCsv(file: string, text: string): Result<StreetRecord[], ValidationIssue> {
  const parsed = parseCsv(file, text, STREET_HEADERS);
  if (!parsed.ok) return parsed;

  const errors: ValidationIssue[] = [];
  const seen = new Set<string>();
  const streets: StreetRecord[] = [];

  for (const row of parsed.value.rows) {
    const lineErrorCount = errors.length;
    const street = row.values.via ?? "";
    const rawZone = row.values.zona ?? DEFAULT_ZONE;
    const zone: ZoneId | null = isZone(rawZone) ? rawZone : null;
    const normalized = normalizeStreetName(street);

    if (normalized.length === 0) {
      errors.push({ file, line: row.line, message: "La via non puo essere vuota." });
    }

    if (!zone) {
      errors.push({ file, line: row.line, message: `Zona non valida: "${rawZone}".` });
    }

    if (seen.has(normalized)) {
      errors.push({ file, line: row.line, message: `Via duplicata: "${street}".` });
    }
    seen.add(normalized);

    if (errors.length > lineErrorCount || !zone || normalized.length === 0) continue;
    streets.push({ street, zone, notes: row.values.note ?? "" });
  }

  return errors.length > 0 ? err(errors) : ok(streets);
}

export function parseMetaCsv(file: string, text: string): Result<DataMeta, ValidationIssue> {
  const parsed = parseCsv(file, text, META_HEADERS);
  if (!parsed.ok) return parsed;

  const first = parsed.value.rows[0];
  if (!first) return err({ file, line: 2, message: "meta.csv deve contenere almeno una riga." });

  const year = Number(first.values.anno);
  const rawLastUpdated = first.values.ultimo_aggiornamento ?? "";
  const lastUpdated: IsoDate | null = isIsoDate(rawLastUpdated) ? rawLastUpdated : null;
  const errors: ValidationIssue[] = [];

  if (!Number.isInteger(year)) {
    errors.push({ file, line: first.line, message: `Anno non valido: "${first.values.anno}".` });
  }

  if (!lastUpdated) {
    errors.push({ file, line: first.line, message: `ultimo_aggiornamento non valido: "${rawLastUpdated}".` });
  }

  if (!first.values.comune || !first.values.versione || !first.values.fonte) {
    errors.push({ file, line: first.line, message: "Comune, versione e fonte sono obbligatori." });
  }

  if (errors.length > 0 || !lastUpdated) return err(errors);

  return ok({
    municipality: first.values.comune,
    year,
    version: first.values.versione,
    lastUpdated,
    source: first.values.fonte,
  });
}

function isZone(value: string): value is ZoneId {
  return ZONES.includes(value as ZoneId);
}

function isWasteType(value: string): value is WasteType {
  return WASTE_TYPES.includes(value as WasteType);
}

function isBooleanString(value: string): value is "true" | "false" {
  return value === "true" || value === "false";
}