import { describe, expect, it } from "vitest";
import { normalizeOsPlaces, normalizeGetAddress, normalizeMapbox } from "../services/addressProvider";

describe("address normalizers", () => {
  it("normalizes OS Places record", () => {
    const raw = {
      DPA: {
        UPRN: "123",
        ADDRESS: "10 Downing Street, London, SW1A 2AA",
        BUILDING_NUMBER: "10",
        THOROUGHFARE_NAME: "Downing Street",
        POST_TOWN: "London",
        POSTCODE: "SW1A 2AA",
      },
    };
    const result = normalizeOsPlaces(raw);
    expect(result).toEqual({
      id: "123",
      label: "10 Downing Street, London, SW1A 2AA",
      line1: "10 Downing Street",
      line2: undefined,
      city: "London",
      postcode: "SW1A 2AA",
    });
  });

  it("normalizes getaddress.io record", () => {
    const raw = {
      id: "GB|12345",
      address: ["10 Downing Street", "Westminster", "London", "SW1A 2AA"],
    };
    const result = normalizeGetAddress(raw);
    expect(result).toEqual({
      id: "GB|12345",
      label: "10 Downing Street, Westminster, London, SW1A 2AA",
      line1: "10 Downing Street",
      line2: "Westminster",
      line3: "London",
      city: "London",
      postcode: "SW1A 2AA",
    });
  });

  it("normalizes Mapbox feature", () => {
    const raw = {
      id: "place.123",
      address: "10",
      text: "Downing Street",
      place_name: "10 Downing Street, London SW1A 2AA, United Kingdom",
      context: [
        { id: "postcode.123", text: "SW1A 2AA" },
        { id: "place.456", text: "London" },
      ],
    };
    const result = normalizeMapbox(raw);
    expect(result).toEqual({
      id: "place.123",
      label: "10 Downing Street, London SW1A 2AA, United Kingdom",
      line1: "10 Downing Street",
      line2: undefined,
      city: "London",
      postcode: "SW1A 2AA",
    });
  });
});
