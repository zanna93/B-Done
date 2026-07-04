import { describe, expect, it } from "vitest";
import { getCalendarPauseDay } from "./holidays";

describe("holidays", () => {
  it("marks Sundays as calendar pauses", () => {
    expect(getCalendarPauseDay("2026-07-05", "jesi")).toMatchObject({
      reason: "sunday",
      label: "Domenica",
    });
  });

  it("marks national and local holidays as calendar pauses", () => {
    expect(getCalendarPauseDay("2026-08-15", "jesi")).toMatchObject({
      reason: "holiday",
      label: "Ferragosto",
    });
    expect(getCalendarPauseDay("2026-09-22", "jesi")).toMatchObject({
      reason: "holiday",
      label: "San Settimio",
    });
    expect(getCalendarPauseDay("2026-10-04", "jesi")).toMatchObject({
      reason: "holiday",
      label: "San Francesco d'Assisi",
    });
  });

  it("returns null for ordinary weekdays", () => {
    expect(getCalendarPauseDay("2026-07-06", "jesi")).toBeNull();
  });
});

