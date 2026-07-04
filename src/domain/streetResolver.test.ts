import { describe, expect, it } from "vitest";
import type { StreetRecord } from "./models";
import { resolveStreet } from "./streetResolver";

const streets: StreetRecord[] = [
  { street: "VIA MONTECAPPONE", zone: "periferia_ovest", notes: "" },
  { street: "VIA PIERALISI", zone: "industriale", notes: "" },
];

describe("resolveStreet", () => {
  it("matches case-insensitive input without street prefix", () => {
    const result = resolveStreet("montecappone", streets);

    expect(result.zone).toBe("periferia_ovest");
    expect(result.matchedStreet).toBe("VIA MONTECAPPONE");
  });

  it("falls back to residential zone when no CSV street matches", () => {
    const result = resolveStreet("Via Immaginaria", streets);

    expect(result.zone).toBe("residenziale");
    expect(result.confidence).toBe("fallback");
  });
});
