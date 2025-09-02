export type AddressOption = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  postcode: string;
};

/** Normalise an OS Places API record. */
export function normalizeOsPlaces(raw: any): AddressOption {
  const d = raw.DPA || {};
  const line1 = [d.BUILDING_NUMBER, d.THOROUGHFARE_NAME]
    .filter(Boolean)
    .join(" ");
  const line2 = d.DEPENDENT_LOCALITY || d.DOUBLE_DEPENDENT_LOCALITY || undefined;
  const city = d.POST_TOWN || "";
  const postcode = d.POSTCODE || "";
  const label = d.ADDRESS || [line1, city, postcode].filter(Boolean).join(", ");
  return {
    id: d.UPRN?.toString() || crypto.randomUUID(),
    label,
    line1,
    line2,
    city,
    postcode,
  };
}

/** Normalise a getaddress.io record. */
export function normalizeGetAddress(raw: { id: string; address: string[] }): AddressOption {
  const parts = (raw.address || []).filter(Boolean);
  const line1 = parts[0] || "";
  const line2 = parts[1];
  const line3 = parts[2];
  const postcode = parts[parts.length - 1] || "";
  const city = parts[parts.length - 2] || "";
  const label = parts.join(", ");
  return {
    id: raw.id,
    label,
    line1,
    line2,
    line3,
    city,
    postcode,
  };
}

/** Normalise a Mapbox geocoding feature. */
export function normalizeMapbox(raw: any): AddressOption {
  const line1 = [raw.address, raw.text].filter(Boolean).join(" ");
  const context = raw.context || [];
  const postcode = context.find((c: any) => c.id?.startsWith("postcode"))?.text || "";
  const city =
    context.find((c: any) => c.id?.startsWith("place"))?.text ||
    context.find((c: any) => c.id?.startsWith("locality"))?.text ||
    context.find((c: any) => c.id?.startsWith("district"))?.text ||
    "";
  const line2 = context.find((c: any) => c.id?.startsWith("neighborhood"))?.text;
  const label = raw.place_name || [line1, city, postcode].filter(Boolean).join(", ");
  return {
    id: raw.id,
    label,
    line1,
    line2,
    city,
    postcode,
  };
}

/** Mock provider just echoes the object. */
export function normalizeMock(raw: AddressOption): AddressOption {
  return raw;
}
