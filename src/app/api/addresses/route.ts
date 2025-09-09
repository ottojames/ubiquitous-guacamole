import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 3) {
    return new Response(
      JSON.stringify({ suggestions: [] }),
      { status: 200 }
    );
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "gb");
    url.searchParams.set("limit", "5");

    const r = await fetch(url.toString(), {
      headers: { "User-Agent": "notices-portal/1.0" },
    });
    const data = await r.json();

    const suggestions = (data || []).map((item: any) => {
      const a = item.address || {};
      const postcode = a.postcode || "";
      const line1 =
        [a.house_number, a.road].filter(Boolean).join(" ") ||
        a.suburb ||
        a.village ||
        a.hamlet ||
        "";
      const city =
        a.city || a.town || a.county || a.state_district || "";

      return {
        id: item.place_id?.toString() ?? crypto.randomUUID(),
        display: [line1, city, postcode].filter(Boolean).join(", "),
        line1,
        line2: a.suburb || a.neighbourhood || "",
        city,
        postcode,
      };
    });

    return new Response(JSON.stringify({ suggestions }), { status: 200 });
  } catch (e) {
    return new Response(
      JSON.stringify({ suggestions: [] }),
      { status: 200 }
    );
  }
}