import { composePremisesNotice } from "../utils/composePremisesNotice";

describe("composePremisesNotice", () => {
  it("builds a readable notice", () => {
    const text = composePremisesNotice({
      licenceType: "new",
      activities: ["sale of alcohol", "late night refreshment"],
      openingHours: "Mon-Fri 10:00-22:00",
      alcoholHours: "Mon-Fri 10:00-21:30",
      representationDeadline: "1 January 2030",
      representationText: "Send representations to the council.",
      seasonalVariations: undefined,
      supervisor: undefined,
    });
    expect(text).toContain("Licensing Act 2003");
    expect(text).toContain("sale of alcohol, late night refreshment");
    expect(text).toContain("Representations must be made by 1 January 2030");
  });
});
