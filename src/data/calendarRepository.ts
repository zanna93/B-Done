import collectionsCsv from "../../data/raccolte_jesi_2026.csv?raw";
import metaCsv from "../../data/meta.csv?raw";
import streetsCsv from "../../data/vie_jesi.csv?raw";
import type { MunicipalityDataset, ValidationIssue } from "../domain/models";
import { err, ok, type Result } from "../utils/result";
import { parseCollectionCsv, parseMetaCsv, parseStreetCsv } from "./csvValidators";

let cachedDataset: Result<MunicipalityDataset, ValidationIssue> | null = null;

export function loadJesiDataset(): Result<MunicipalityDataset, ValidationIssue> {
  if (cachedDataset) return cachedDataset;

  const collections = parseCollectionCsv("data/raccolte_jesi_2026.csv", collectionsCsv);
  const streets = parseStreetCsv("data/vie_jesi.csv", streetsCsv);
  const meta = parseMetaCsv("data/meta.csv", metaCsv);

  const errors = [
    ...(collections.ok ? [] : collections.errors),
    ...(streets.ok ? [] : streets.errors),
    ...(meta.ok ? [] : meta.errors),
  ];

  cachedDataset =
    errors.length > 0
      ? err(errors)
      : ok({
          collections: collections.ok ? collections.value : [],
          streets: streets.ok ? streets.value : [],
          meta: meta.ok
            ? meta.value
            : { municipality: "Jesi", year: 2026, version: "invalid", lastUpdated: "2026-01-01", source: "" },
        });

  return cachedDataset;
}
