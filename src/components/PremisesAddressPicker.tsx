import { useState } from "react";
import type { PremisesAddress, AddressCandidate } from "../types/address";


type Props = {
  value: PremisesAddress | null;
  onChange: (addr: PremisesAddress | null) => void;
};

export default function PremisesAddressPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<"postcode" | "manual">("postcode");
  const [pc, setPc] = useState("");
  const [num, setNum] = useState("");
  const [results, setResults] = useState<AddressCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function find() {
  if (!pc.trim()) { setErr("Enter a postcode"); return; }

  const TOKEN = import.meta.env.VITE_GETADDRESS_DOMAIN_TOKEN as string | undefined;
  if (!TOKEN) { setErr("Missing VITE_GETADDRESS_DOMAIN_TOKEN"); setMode("manual"); return; }

  const pcNorm = pc.trim().toUpperCase().replace(/\s+/g, "");
  const numNorm = num.trim();

  setLoading(true); setErr(""); setResults([]);
  try {
    const url =
      `https://api.getaddress.io/find/${encodeURIComponent(pcNorm)}/${encodeURIComponent(numNorm)}?api-key=${TOKEN}&expand=true&sort=true`;

    const resp = await fetch(url, { mode: "cors" });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.Message || data?.message || "Lookup failed");

    const out: AddressCandidate[] = (Array.isArray(data.addresses) ? data.addresses : []).map((a: any) => {
      let lines: string[] = [];
      let lat = data.latitude, lng = data.longitude;

      if (typeof a === "string") {
        lines = a.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (a && typeof a === "object") {
        const parts = [
          a.building_number || a.sub_building_name,
          a.building_name,
          a.thoroughfare,
          a.dependent_locality,
          a.post_town,
          a.county,
        ].filter(Boolean);
        lines = parts;
        lat = a.latitude ?? lat;
        lng = a.longitude ?? lng;
      }

      const postcodeOut = String(data.postcode || pcNorm);

      const confidenceStr: "high" | "low" =
  (a?.uprn != null || a?.udprn != null || lines.length >= 2) ? "high" : "low";

      const candidate: AddressCandidate = {
  lines,
  postcode: postcodeOut,
  uprn: a?.uprn != null ? String(a.uprn) : undefined,
  udprn: a?.udprn != null ? String(a.udprn) : undefined,
  lat: typeof lat === "number" ? lat : undefined,
  lng: typeof lng === "number" ? lng : undefined,
  formatted_single_line: `${lines.join(", ")}${lines.length ? ", " : ""}${postcodeOut}`,
  confidence: confidenceStr,   // only keep what the type expects
};

      return candidate;
    });

    setResults(out);
    if (!out.length) setErr("No results. Try just the building number/name.");
  } catch (e: any) {
    setErr(e?.message || "Lookup failed");
  } finally {
    setLoading(false);
  }
}

  // Manual fields
  const [m1, setM1] = useState(""); const [m2, setM2] = useState("");
  const [mt, setMT] = useState(""); const [mc, setMC] = useState(""); const [mp, setMP] = useState("");

  function commitManual() {
    const okPc = /^[A-Z]{1,2}\d[A-Z0-9]?\s?\d[A-Z]{2}$/i.test(mp.trim());
    if (!m1.trim() || !okPc) { setErr("Enter Address line 1 and a valid UK postcode."); return; }
    const lines = [m1, m2, mt, mc].filter(Boolean);
    const formatted = `${lines.join(", ")} ${mp}`.replace(/\s+/g, " ").trim();
    onChange({
      lines, town: mt || undefined, county: mc || undefined,
      postcode: mp.trim().toUpperCase(),
      formatted_single_line: formatted,
      source: "manual",
      confidence: "manual",
    });
  }

  const selected = value?.formatted_single_line;

  return (
    <fieldset className="rounded border p-3">
      <legend className="text-sm font-medium">Premises address</legend>

      {selected ? (
        <div className="space-y-2">
          <div className="rounded bg-slate-50 px-3 py-2 text-sm">{selected}</div>
          <div className="flex gap-3 text-sm">
            <button type="button" className="text-blue-700 underline" onClick={() => onChange(null)}>Change</button>
            <button type="button" className="text-blue-700 underline" onClick={() => { setMode("manual"); onChange(null); }}>Enter manually</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex gap-2 text-sm">
            <button type="button" onClick={() => setMode("postcode")}
              className={`px-3 py-1 rounded ${mode==="postcode"?"bg-slate-900 text-white":"bg-slate-100"}`}>
              Postcode + number
            </button>
            <button type="button" onClick={() => setMode("manual")}
              className={`px-3 py-1 rounded ${mode==="manual"?"bg-slate-900 text-white":"bg-slate-100"}`}>
              Enter manually
            </button>
          </div>

          {mode === "postcode" && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs mb-1">Postcode</label>
                <input className="w-full border rounded px-2 py-2" value={pc} onChange={e=>setPc(e.target.value)} placeholder="SW1A 1AA" />
              </div>
              <div>
                <label className="block text-xs mb-1">Number / name</label>
                <input className="w-full border rounded px-2 py-2" value={num} onChange={e=>setNum(e.target.value)} placeholder="10" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={find} className="w-full rounded bg-slate-900 text-white px-3 py-2">
                  {loading ? "Finding…" : "Find address"}
                </button>
              </div>

              <div className="col-span-3">
                {results.length > 0 && (
                  <ul className="mt-2 max-h-56 overflow-auto rounded border bg-white text-sm">
                    {results.map((c, i) => (
                      <li key={c.formatted_single_line + i}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer"
                          onClick={() => onChange(c)}>
                        {c.formatted_single_line}
                      </li>
                    ))}
                  </ul>
                )}
                {!!err && <p className="mt-2 text-sm text-red-600">{err}</p>}
              </div>
            </div>
          )}

          {mode === "manual" && (
            <div className="grid gap-2">
              <div>
                <label className="block text-xs mb-1">Address line 1</label>
                <input className="w-full border rounded px-2 py-2" value={m1} onChange={e=>setM1(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1">Address line 2 (optional)</label>
                <input className="w-full border rounded px-2 py-2" value={m2} onChange={e=>setM2(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1">Town / City</label>
                  <input className="w-full border rounded px-2 py-2" value={mt} onChange={e=>setMT(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1">County (optional)</label>
                  <input className="w-full border rounded px-2 py-2" value={mc} onChange={e=>setMC(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1">Postcode</label>
                <input className="w-full border rounded px-2 py-2" value={mp} onChange={e=>setMP(e.target.value)} placeholder="SW1A 1AA" />
              </div>
              <div>
                <button type="button" className="rounded bg-slate-900 text-white px-3 py-2" onClick={commitManual}>
                  Use this address
                </button>
              </div>
              {!!err && <p className="text-sm text-red-600">{err}</p>}
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}
