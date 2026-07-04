import { describe, expect, it } from "vitest";
import type { CollectionEvent } from "./models";
import { getGamificationSummary, markMissionDone } from "./gamificationEngine";

const events: CollectionEvent[] = [
  { date: "2026-07-01", zone: "residenziale", wasteTypes: ["carta"], notes: "", isVariation: false, isDoublePickup: false },
  { date: "2026-07-03", zone: "residenziale", wasteTypes: ["plastica"], notes: "", isVariation: false, isDoublePickup: false },
  { date: "2026-07-04", zone: "residenziale", wasteTypes: ["organico"], notes: "", isVariation: false, isDoublePickup: false },
];

describe("gamificationEngine", () => {
  it("does not duplicate completed dates", () => {
    const state = markMissionDone({ completedDates: ["2026-07-04"] }, "2026-07-04");

    expect(state.completedDates).toEqual(["2026-07-04"]);
  });

  it("calculates streak and badges", () => {
    const summary = getGamificationSummary(
      { completedDates: ["2026-07-01", "2026-07-03", "2026-07-04"] },
      events,
      "residenziale",
      "2026-07-04",
    );

    expect(summary.streak).toBe(3);
    expect(summary.badges.find((badge) => badge.id === "perfect-week")?.unlocked).toBe(true);
  });
});
