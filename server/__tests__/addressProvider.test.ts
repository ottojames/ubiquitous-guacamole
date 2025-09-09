import { normalizeAddress } from "../services/addressProvider";

describe("normalizeAddress", () => {
  it("creates a label when missing", () => {
    const res = normalizeAddress({
      id: 99,
      line1: "1 High Street",
      city: "Testville",
      postcode: "AA1 1AA",
    });
    expect(res.label).toBe("1 High Street, Testville, AA1 1AA");
    expect(res.id).toBe("99");
  });
});
