import { describe, expect, it } from "vitest";
import { parseCsv } from "./csvParser";
import { parseCollectionCsv } from "./csvValidators";

describe("parseCsv", () => {
  it("handles quoted commas and escaped quotes", () => {
    const csv = 'name,note\n"B-Done","doppio, ritiro"\n"Jesi","ok ""vero"""';
    const parsed = parseCsv("test.csv", csv, ["name", "note"]);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.rows[0].values.note).toBe("doppio, ritiro");
    expect(parsed.value.rows[1].values.note).toBe('ok "vero"');
  });

  it("returns readable errors for malformed rows", () => {
    const parsed = parseCsv("broken.csv", "a,b\n1,2,3", ["a", "b"]);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors[0].message).toContain("Numero colonne");
  });
});

describe("parseCollectionCsv", () => {
  it("validates dates, zones, booleans and duplicates", () => {
    const csv = [
      "date,zona,rifiuto,note,is_variazione,is_doppio_ritiro",
      "2026-07-04,residenziale,organico,,false,false",
      "2026-07-04,residenziale,carta,,false,false",
      "bad,residenziale,carta,,false,false",
      "2026-07-06,altro,carta,,false,false",
      "2026-07-07,residenziale,carta,,no,false",
    ].join("\n");

    const parsed = parseCollectionCsv("raccolte.csv", csv);

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors.map((error) => error.message).join(" ")).toContain("duplicato");
    expect(parsed.errors.map((error) => error.message).join(" ")).toContain("Data non valida");
    expect(parsed.errors.map((error) => error.message).join(" ")).toContain("Zona non valida");
    expect(parsed.errors.map((error) => error.message).join(" ")).toContain("is_variazione");
  });
});
