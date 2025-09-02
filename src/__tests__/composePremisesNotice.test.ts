import { describe, expect, it } from "vitest";
import { composePremisesNotice, Builder, Hours } from "../utils/composePremisesNotice";

describe("composePremisesNotice", () => {
  const base: Builder = {
    appType: "new",
    premisesName: "The Test Pub",
    premisesAddress: {
      line1: "1 High St",
      city: "Testville",
      postcode: "AB1 2CD",
    },
    activities: ["sale of alcohol"],
    openingHours: {
      Mon: "10:00-22:00",
      Tue: "10:00-22:00",
      Wed: "10:00-22:00",
      Thu: "10:00-22:00",
      Fri: "10:00-23:00",
      Sat: "10:00-23:00",
      Sun: "12:00-22:00",
    },
    repDeadline: "2025-01-01",
  };

  it("produces a basic notice", () => {
    const text = composePremisesNotice(base);
    expect(text).toContain("APPLICATION FOR A NEW PREMISES LICENCE");
    expect(text).toContain("The Test Pub has applied to the Licensing Authority");
    expect(text).toContain("sale of alcohol");
  });

  it("includes optional fields when provided", () => {
    const b: Builder = {
      ...base,
      alcoholHours: base.openingHours,
      seasonal: "Closed on Christmas Day",
      dps: "Jane Doe",
      howToRep: "Email licensing@test.gov",
    };
    const text = composePremisesNotice(b);
    expect(text).toContain("Hours for the sale of alcohol");
    expect(text).toContain("Seasonal variations: Closed on Christmas Day");
    expect(text).toContain("Designated premises supervisor: Jane Doe");
    expect(text).toContain("Email licensing@test.gov");
  });
});
