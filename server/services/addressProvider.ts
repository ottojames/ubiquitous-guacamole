export interface AddressResult {
  id: string;
  label: string;
  line1: string;
  line2: string;
  line3: string;
  city: string;
  postcode: string;
}

/**
 * Normalize provider-specific address shape into AddressResult.
 */
export function normalizeAddress(raw: any): AddressResult {
  return {
    id: String(raw.id ?? raw.uprn ?? ''),
    label:
      raw.label ??
      [raw.line1, raw.city, raw.postcode].filter(Boolean).join(', '),
    line1: raw.line1 ?? raw.address1 ?? '',
    line2: raw.line2 ?? raw.address2 ?? '',
    line3: raw.line3 ?? raw.address3 ?? '',
    city: raw.city ?? raw.town ?? raw.post_town ?? '',
    postcode: raw.postcode ?? raw.post_code ?? '',
  };
}

const mockData: AddressResult[] = [
  {
    id: '1',
    label: '10 Downing Street, London SW1A 2AA',
    line1: '10 Downing Street',
    line2: '',
    line3: '',
    city: 'London',
    postcode: 'SW1A 2AA',
  },
];

/**
 * Simple address search adapter. In production this would proxy to
 * an external provider based on the ADDRESS_PROVIDER env variable.
 */
export async function searchAddress(query: string): Promise<AddressResult[]> {
  const provider = process.env.ADDRESS_PROVIDER || 'mock';
  if (provider !== 'mock') {
    throw new Error(`Address provider "${provider}" not implemented`);
  }
  return mockData.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()),
  );
}
