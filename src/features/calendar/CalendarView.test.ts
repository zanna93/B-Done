import { describe, expect, it } from "vitest";
import type { CollectionEvent } from "../../domain/models";
import { buildCalendarItems } from "./CalendarView";

const events: CollectionEvent[] = [
  {
    date: "2026-07-13",
    zone: "residenziale",
    wasteTypes: ["plastica"],
    notes: "",
    isVariation: false,
    isDoublePickup: false,
  },
  {
    date: "2026-07-15",
    zone: "residenziale",
    wasteTypes: ["organico"],
    notes: "",
    isVariation: false,
    isDoublePickup: false,
  },
];

describe("buildCalendarItems", () => {
  it("keeps ordinary days without collection in the all-days calendar", () => {
    const items = buildCalendarItems(events, "jesi", "residenziale", "2026-07-13");

    expect(items).toHaveLength(31);
    expect(items[0]).toMatchObject({ kind: "collection", date: "2026-07-13" });
    expect(items[1]).toMatchObject({ kind: "empty", date: "2026-07-14" });
    expect(items[2]).toMatchObject({ kind: "collection", date: "2026-07-15" });
    expect(items.find((item) => item.date === "2026-07-19")).toMatchObject({ kind: "pause" });
  });
});
