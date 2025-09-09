// src/components/AddressFinder.tsx
import React, { useMemo, useState } from "react";
import debounce from "lodash.debounce";

export type NormalisedAddress = {
  lines: string[];
  postcode: string;
  uprn?: string;
  lat?: number;
  lng?: number;
  formatted: string; // single line for notices
};

type Props = {
  label?: string;
  value?: NormalisedAddress | null;
  onChange: (v: NormalisedAddress | null) => void;
};

export default function AddressFinder({ label = "Premises address", value, onChange }: Props) {
  const [postcode, setPostcode] = useState("");
  const [premNo, setPremNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"lookup" | "manual" | "picked">(value ? "picked" : "lookup");
  const [options, setOptions] = useState<NormalisedAddress[]>([]);
  const [pickIdx, setPickIdx] = useState<number | null>(null);

  const find = async (pc: string, number: string) => {
    const cleanPc = pc.trim().toUpperCase();
    if (!cleanPc) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/address-lookup?postcode=${encodeURIComponent(cleanPc)}&number=${encodeURIComponent(
          number || ""
        )}`
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const list: NormalisedAddress[] = (json.addresses || []).map((a: any) => {
        const lines = (a.lines || []).filter(Boolean);
        const formatted =
          a.formatted ||
          [a.building || a.line_1, a.line_2, a.town || a.city, a.county, a.postcode]
            .filter(Boolean)
            .join(", ");
        return {
          lines,
          postcode: a.postcode,
          uprn: a.uprn || a.udprn,
          lat: typeof a.lat === "number" ? a.lat : undefined,
          lng: typeof a.lng === "number" ? a.lng : undefined,
          formatted,
        };
      });
      setOptions(list);
      setMode("lookup");
    } finally {
      setLoading(false);
    }
  };

  const findDebounced = useMemo(() => debounce(find, 250), []);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

      {/* Lookup row */}
      <div className="mt-1 grid grid-cols-[120px_1fr_auto] gap-2">
        <input
          placeholder="Postcode"
          className="border rounded p-2"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
        />
        <input
          placeholder="House no./name"
          className="border rounded p-2"
          value={premNo}
          onChange={(e) => setPremNo(e.target.value)}
        />
        <button
          type="button"
          className="px-3 rounded bg-slate-800 text-white disabled:opacity-50"
          disabled={!postcode || loading}
          onClick={() => find(postcode, premNo)}
        >
          {loading ? "Finding…" : "Find address"}
        </button>
      </div>

      {/* Results / manual toggle */}
      <div className="mt-2 text-sm">
        <button
          type="button"
          className="underline text-slate-600"
          onClick={() => setMode(mode === "manual" ? "lookup" : "manual")}
        >
          {mode === "manual" ? "Back to lookup" : "Enter manually"}
        </button>
      </div>

      {/* Options dropdown */}
      {options.length > 0 && mode !== "manual" && (
        <div className="mt-2">
          <select
            className="w-full border rounded p-2"
            value={pickIdx ?? ""}
            onChange={(e) => {
              const idx = e.target.value === "" ? null : Number(e.target.value);
              setPickIdx(idx);
              if (idx === null) onChange(null);
              else {
                onChange(options[idx]);
                setMode("picked");
              }
            }}
          >
            <option value="">Select address…</option>
            {options.map((o, i) => (
              <option key={i} value={i}>
                {o.formatted}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual fields (progressive disclosure) */}
      {mode === "manual" && (
        <ManualAddressEditor
            initial={value}
            onChange={(v) => {
              onChange(v);
              setOptions([]);
              setPickIdx(null);
            }}
        />
      )}

      {/* Read-only preview once picked */}
      {mode === "picked" && value && (
        <div className="mt-2 text-sm text-slate-700">
          <div className="rounded border p-2 bg-slate-50">{value.formatted}</div>
          {value.uprn && <div className="mt-1 text-slate-500">UPRN: {value.uprn}</div>}
        </div>
      )}
    </div>
  );
}

function ManualAddressEditor({
  initial,
  onChange,
}: {
  initial?: NormalisedAddress | null;
  onChange: (v: NormalisedAddress) => void;
}) {
  const [l1, setL1] = useState(initial?.lines?.[0] ?? "");
  const [l2, setL2] = useState(initial?.lines?.[1] ?? "");
  const [city, setCity] = useState(initial?.lines?.[2] ?? "");
  const [county, setCounty] = useState(initial?.lines?.[3] ?? "");
  const [pc, setPc] = useState(initial?.postcode ?? "");

  const push = () =>
    onChange({
      lines: [l1, l2, city, county].filter(Boolean),
      postcode: pc.toUpperCase(),
      formatted: [l1, l2, city, county, pc].filter(Boolean).join(", "),
    });

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <input className="border rounded p-2 col-span-2" placeholder="Address line 1" value={l1} onChange={(e)=>setL1(e.target.value)} onBlur={push}/>
      <input className="border rounded p-2 col-span-2" placeholder="Address line 2 (optional)" value={l2} onChange={(e)=>setL2(e.target.value)} onBlur={push}/>
      <input className="border rounded p-2" placeholder="Town / City" value={city} onChange={(e)=>setCity(e.target.value)} onBlur={push}/>
      <input className="border rounded p-2" placeholder="County" value={county} onChange={(e)=>setCounty(e.target.value)} onBlur={push}/>
      <input className="border rounded p-2 col-span-2" placeholder="Postcode" value={pc} onChange={(e)=>setPc(e.target.value)} onBlur={push}/>
    </div>
  );
}
