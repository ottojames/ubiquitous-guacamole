import { NextRequest } from "next/server";
import { AddressSchema, normalizePostcode } from "@/utils/address";

type ProviderAddress = {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  uprn?: string;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
};

type NominatimItem = {
  place_id?: number;
  address?: NominatimAddress;
  display_name?: string;
};

const fallbackAddresses: ProviderAddress[] = [
  {
    line1: "45 Lionel Park Road",
    line2: "",
    town: "Brentford",
    postcode: normalizePostcode("TW8 9QR"),
    uprn: "UPRN-123",
  },
  {
    line1: "1 High Street",
    line2: "",
    town: "London",
    postcode: normalizePostcode("SW1A 1AA"),
    uprn: "UPRN-10",
  },
];

function deriveLine1(addr: NominatimAddress): string {
  const parts = [addr.house_number, addr.road].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return (
    addr.neighbourhood ||
    addr.suburb ||
    addr.village ||
    addr.hamlet ||
    addr.town ||
    addr.city ||
    ""
  );
}

function deriveTown(addr: NominatimAddress): string {
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    addr.county ||
    addr.state_district ||
    addr.state ||
    ""
  );
}

function toAddress(item: NominatimItem): ProviderAddress | null {
  const raw = item.address;
  if (!raw) return null;
  const line1 = deriveLine1(raw).trim();
  const line2 = (raw.suburb || raw.neighbourhood || "").trim();
  const town = deriveTown(raw).trim();
  const postcode = normalizePostcode(raw.postcode || "");
  if (!line1 || !town || !postcode) return null;
  return {
    line1,
    line2,
    town,
    postcode,
    uprn: item.place_id ? `PLACE-${item.place_id}` : undefined,
  };
}

async function fetchProviderResults(query: string): Promise<ProviderAddress[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("limit", "6");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "notices-app/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    const addresses = data
      .map((item) => toAddress(item as NominatimItem))
      .filter(Boolean) as ProviderAddress[];
    return addresses;
  } catch {
    return [];
  }
}

function matchesQuery(address: ProviderAddress, query: string): boolean {
  const haystack = [address.line1, address.line2, address.town, address.postcode]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function dedupe(addresses: ProviderAddress[]): ProviderAddress[] {
  const seen = new Map<string, ProviderAddress>();
  for (const item of addresses) {
    const key = [item.line1, item.line2, item.town, item.postcode]
      .map((part) => part.trim().toUpperCase())
      .join("|");
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const provider = await fetchProviderResults(q);
  const fallbacks = fallbackAddresses.filter((addr) => matchesQuery(addr, q));
  const merged = provider.length > 0 ? provider : fallbacks.length > 0 ? fallbacks : fallbackAddresses;
  const unique = dedupe(merged);

  const parsed = AddressSchema.array().safeParse(unique);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "ADDRESS_PARSE_ERROR" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ results: parsed.data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
