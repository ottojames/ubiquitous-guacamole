import React, { useEffect, useMemo, useState, type ComponentProps } from "react";
import { generateNotice } from "../../lib/noticeTemplate";
import PremisesAddressPicker from "../PremisesAddressPicker";
import { councils, type Council } from "../../data/councils";
import { computeRepDeadline } from "../../lib/computeRepDeadline";
import type { PremisesAddress } from "../../types/address";

// Infer the picker prop types so TS matches whatever the component expects
type PickerProps = ComponentProps<typeof PremisesAddressPicker>;
type PickerValue = NonNullable<PickerProps["value"]>;

type ApplicationType =
  | "Grant of a Premises Licence"
  | "Variation of a Premises Licence"
  | "Minor Variation of a Premises Licence"
  | "Grant of a Club Premises Certificate"
  | "Variation of a Club Premises Certificate";

const applicationTypes: ApplicationType[] = [
  "Grant of a Premises Licence",
  "Variation of a Premises Licence",
  "Minor Variation of a Premises Licence",
  "Grant of a Club Premises Certificate",
  "Variation of a Club Premises Certificate",
];

const activityOptions = [
  "Supply of Alcohol",
  "Provision of Late Night Refreshment",
  "Live Music",
  "Recorded Music",
  "Performance of Dance",
  "Anything of a Similar Description",
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Hours {
  [day: string]: { start: string; end: string };
}

type AlcoholConsumption = "On" | "Off" | "Both" | "";

interface FormData {
  applicationType: ApplicationType;

  // Applicant & Premises
  premisesName: string;
  premisesAddress: string; // single-line composed view
  // structured fields kept for storage + generator
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressCounty?: string;
  addressPostcode?: string;
  premisesAddressObj?: PickerValue | null;

  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;

  // Activities & Hours
  activities: string[];
  activityHours: Record<string, Hours>;
  openingHours: Hours;

  // Alcohol extras
  alcoholConsumption: AlcoholConsumption;
  dpsName?: string;
  dpsAddress?: string;

  // Council & Statutory
  applicationDate: string; // ISO yyyy-mm-dd
  representationDeadline: string; // ISO
  councilId: string;
  councilName: string;
  councilEmail: string;
  councilPostalAddress: string;
  councilOfficeHours?: string;
  councilApplicationsUrl?: string;

  // Misc
  inspectionMethod: string;
  representationMethod: string;
  reference: string;
  variationSummary?: string;
  existingHours?: string;
  licenceNumber?: string;
  clubRules?: string;
  clubMembers?: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void> | void;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLElement>;
}

/** Exported so tests can import it directly */
export function WeeklyHoursInput({
  value,
  onChange,
  label,
}: {
  value: Hours;
  onChange: (h: Hours) => void;
  label?: string;
}) {
  // keep a local, always-updated copy so consecutive edits merge correctly
  const pendingRef = React.useRef<Hours>(value);
  React.useEffect(() => {
    pendingRef.current = value;
  }, [value]);

  function setDay(day: string, field: "start" | "end", val: string) {
    const next = {
      ...pendingRef.current,
      [day]: { ...(pendingRef.current[day] || {}), [field]: val },
    };
    pendingRef.current = next;
    onChange(next);
  }

  function setEveryDay(field: "start" | "end", val: string) {
    const next: Hours = { ...pendingRef.current };
    days.forEach((d) => {
      next[d] = { ...(next[d] || {}), [field]: val };
    });
    pendingRef.current = next;
    onChange(next);
  }

  const idFor = (day: string, which: "start" | "end") =>
    `${day.toLowerCase().replace(/\s+/g, "-")}-${which}-time`;

  return (
    <div className="space-y-1">
      {label && <p className="font-medium">{label}</p>}
      <table className="w-full text-sm">
        <tbody>
          {/* Every Day row */}
          <tr className="odd:bg-slate-50">
            <td className="pr-2 py-1 w-16">
              <span id="every-day-label">Every Day</span>
            </td>
            <td className="pr-2">
              <label htmlFor="every-day-start" className="sr-only">
                Start time
              </label>
              <input
                id="every-day-start"
                type="time"
                aria-label="Start time"
                aria-labelledby="every-day-label"
                onChange={(e) => setEveryDay("start", e.target.value)}
                className="w-full border rounded p-1"
              />
            </td>
            <td>
              <label htmlFor="every-day-end" className="sr-only">
                End time
              </label>
              <input
                id="every-day-end"
                type="time"
                aria-label="End time"
                aria-labelledby="every-day-label"
                onChange={(e) => setEveryDay("end", e.target.value)}
                className="w-full border rounded p-1"
              />
            </td>
          </tr>

          {/* Individual day rows */}
          {days.map((d) => (
            <tr key={d} className="odd:bg-slate-50">
              <td className="pr-2 py-1 w-16">
                <span id={`${idFor(d, "start")}-rowlabel`}>{d}</span>
              </td>
              <td className="pr-2">
                <label htmlFor={idFor(d, "start")} className="sr-only">
                  Start time
                </label>
                <input
                  id={idFor(d, "start")}
                  type="time"
                  aria-label="Start time"
                  aria-labelledby={`${idFor(d, "start")}-rowlabel`}
                  value={value[d]?.start || ""}
                  onChange={(e) => setDay(d, "start", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </td>
              <td>
                <label htmlFor={idFor(d, "end")} className="sr-only">
                  End time
                </label>
                <input
                  id={idFor(d, "end")}
                  type="time"
                  aria-label="End time"
                  aria-labelledby={`${idFor(d, "start")}-rowlabel`}
                  value={value[d]?.end || ""}
                  onChange={(e) => setDay(d, "end", e.target.value)}
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PremisesForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [form, setForm] = useState<FormData>({
    applicationType: "Grant of a Premises Licence",

    premisesName: "",
    premisesAddress: "",
    addressLine1: "",
    addressLine2: "",
    addressCity: "",
    addressCounty: "",
    addressPostcode: "",

    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",

    activities: [],
    activityHours: {},
    openingHours: {},

    alcoholConsumption: "",
    dpsName: "",
    dpsAddress: "",

    applicationDate: "",
    representationDeadline: "",
    councilId: "",
    councilName: "",
    councilEmail: "",
    councilPostalAddress: "",
    councilOfficeHours: "",
    councilApplicationsUrl: "",

    inspectionMethod: "",
    representationMethod: "",
    reference: "",
  });

  const isClub = form.applicationType.includes("Club");
  const isVariation = form.applicationType.includes("Variation");
  const isGrant = form.applicationType.includes("Grant");
  const alcoholSelected = form.activities.includes("Supply of Alcohol");
  const showDps = alcoholSelected && !isClub && (isGrant || isVariation);

  // populate council read-only details
  useEffect(() => {
    const c = councils.find((x) => x.id === form.councilId);
    if (!c) return;
    setForm((f) => ({
      ...f,
      councilName: c.name,
      councilEmail: c.licensingEmail ?? "",
      councilPostalAddress: c.postalAddress ?? "",
      councilApplicationsUrl: c.portalUrl ?? "",
      councilOfficeHours: c.officeHours ?? "",
    }));
  }, [form.councilId]);

  // derive reps deadline
  useEffect(() => {
    if (!form.applicationDate) return;
    setForm((f) => ({ ...f, representationDeadline: computeRepDeadline(form.applicationDate) }));
  }, [form.applicationDate]);

  function toggleActivity(a: string) {
    setForm((f) => {
      const activities = f.activities.includes(a) ? f.activities.filter((x) => x !== a) : [...f.activities, a];
      const activityHours = { ...f.activityHours };
      if (activities.includes(a) && !activityHours[a]) activityHours[a] = {};
      if (!activities.includes(a)) delete activityHours[a];
      const alcoholOn = activities.includes("Supply of Alcohol");
      return { ...f, activities, activityHours, ...(alcoholOn ? {} : { alcoholConsumption: "", dpsName: "", dpsAddress: "" }) };
    });
  }

  function updateActivityHours(activity: string, hours: Hours) {
    setForm((f) => ({ ...f, activityHours: { ...f.activityHours, [activity]: hours } }));
  }

  const alcoholHoursWarning = useMemo(() => {
    if (!alcoholSelected) return "";
    const anyDay = days.some((d) => form.openingHours[d]?.start && form.openingHours[d]?.end);
    return anyDay ? "" : "Supply of Alcohol selected, but opening hours are empty.";
  }, [form.openingHours, alcoholSelected]);

  const noticeText = useMemo(() => {
    try {
      return generateNotice(form as any);
    } catch (e) {
      return (e as Error).message;
    }
  }, [form]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  // Build value for the address picker. The picker expects PremisesAddress | null.
  const pickerValue: PremisesAddress | null = (() => {
    const lines = [form.addressLine1 ?? "", form.addressLine2 ?? ""].filter(Boolean) as string[];
    const hasAny = lines.length > 0 || !!form.addressCity || !!form.addressCounty || !!form.addressPostcode;
    if (!hasAny) return null;
    return {
      lines,
      town: form.addressCity || "",
      county: form.addressCounty || "",
      postcode: form.addressPostcode || "",
    } as PremisesAddress;
  })();

  return (
    <form onSubmit={submit} className="mt-6 space-y-6" aria-describedby="premises-desc">
      <p id="premises-desc" className="sr-only">Premises Licence application form</p>

      {/* Step: Application type */}
      <div className="space-y-2">
        <label htmlFor="applicationType" className="block text-sm font-medium text-slate-700">Application type</label>
        <select
          id="applicationType"
          name="applicationType"
          value={form.applicationType}
          onChange={handleChange}
          ref={autoFocusRef as React.RefObject<HTMLSelectElement>}
          className="w-full rounded border border-slate-300 p-2 bg-white"
        >
          {applicationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Step: Applicant & Premises */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="premisesName">Premises name</label>
          <input
            id="premisesName"
            name="premisesName"
            value={form.premisesName}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Premises address</label>
          <PremisesAddressPicker
            value={pickerValue}
            onChange={(addr) => {
              if (!addr) {
                setForm((f) => ({
                  ...f,
                  addressLine1: "",
                  addressLine2: "",
                  addressCity: "",
                  addressCounty: "",
                  addressPostcode: "",
                  premisesAddress: "",
                  premisesAddressObj: null,
                }));
                return;
              }
              const [l1 = "", l2 = ""] = addr.lines ?? [];
              const joined = [l1, l2, addr.town, addr.county, addr.postcode].filter(Boolean).join(", ");
              setForm((f) => ({
                ...f,
                addressLine1: l1,
                addressLine2: l2,
                addressCity: addr.town || "",
                addressCounty: addr.county || "",
                addressPostcode: addr.postcode || "",
                premisesAddress: joined,
                premisesAddressObj: addr as any,
              }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="applicantName">Applicant name</label>
          <input id="applicantName" name="applicantName" value={form.applicantName} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="applicantEmail">Applicant email</label>
          <input id="applicantEmail" name="applicantEmail" type="email" value={form.applicantEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" required />
          <p className="text-xs text-slate-500 mt-1">We’ll send a magic link to resume your draft.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="applicantPhone">Applicant phone (optional)</label>
          <input id="applicantPhone" name="applicantPhone" value={form.applicantPhone || ""} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
      </div>

      {/* Activities */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Licensable activities</legend>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {activityOptions.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input type="checkbox" checked={form.activities.includes(a)} onChange={() => toggleActivity(a)} />
              <span>{a}</span>
            </label>
          ))}
        </div>

        {/* Alcohol consumption + DPS */}
        {alcoholSelected && (
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Alcohol consumption</p>
              <div className="flex flex-wrap gap-4 mt-1">
                {(["On", "Off", "Both"] as AlcoholConsumption[]).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="alcoholConsumption"
                      value={opt}
                      checked={form.alcoholConsumption === opt}
                      onChange={handleChange}
                      required
                    />
                    <span>{opt === "On" ? "On the premises" : opt === "Off" ? "Off the premises" : "Both"}</span>
                  </label>
                ))}
              </div>
            </div>

            {showDps && (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="dpsName">DPS full name</label>
                  <input id="dpsName" name="dpsName" value={form.dpsName || ""} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="dpsAddress">DPS address</label>
                  <input id="dpsAddress" name="dpsAddress" value={form.dpsAddress || ""} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" required />
                </div>
              </div>
            )}
          </div>
        )}

        {alcoholHoursWarning && <p className="text-xs text-amber-700">{alcoholHoursWarning}</p>}
      </fieldset>

      {/* Hours */}
      {form.activities.map((a) => (
        <WeeklyHoursInput key={a} value={form.activityHours[a] || {}} onChange={(h) => updateActivityHours(a, h)} label={a} />
      ))}
      <WeeklyHoursInput value={form.openingHours} onChange={(h) => setForm((f) => ({ ...f, openingHours: h }))} label="Opening hours" />

      {/* Council & Statutory */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="applicationDate">Application date given to the authority</label>
          <input
            id="applicationDate"
            name="applicationDate"
            type="date"
            value={form.applicationDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
          <p className="text-xs text-slate-500 mt-1">Used to compute the last date for representations.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Representations deadline</label>
          <input
            value={form.representationDeadline ? new Date(form.representationDeadline).toLocaleString("en-GB", { timeZone: "Europe/London" }) : ""}
            readOnly
            className="w-full rounded border border-slate-200 bg-slate-50 p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="councilId">Council (licensing authority)</label>
          <select
            id="councilId"
            name="councilId"
            value={form.councilId}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2 bg-white"
            required
          >
            <option value="" disabled>Select council…</option>
            {councils.map((c: Council) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Read-only council details */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Licensing email</label>
          <input value={form.councilEmail} readOnly className="w-full rounded border border-slate-200 bg-slate-50 p-2" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Licensing postal address</label>
          <input value={form.councilPostalAddress} readOnly className="w-full rounded border border-slate-200 bg-slate-50 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Applications portal URL</label>
          <input value={form.councilApplicationsUrl || ""} readOnly className="w-full rounded border border-slate-200 bg-slate-50 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Office hours</label>
          <input value={form.councilOfficeHours || ""} readOnly className="w-full rounded border border-slate-200 bg-slate-50 p-2" />
        </div>
        <div className="col-span-2">
          <a href="mailto:support@yourservice.example?subject=Council%20details%20correction" className="text-xs text-slate-600 underline">
            Report incorrect details
          </a>
        </div>
      </div>

      {/* Preview (read-only) */}
      <div className="space-y-2">
        <label htmlFor="noticePreview" className="block text-sm font-medium text-slate-700">Generated Blue Notice (read-only)</label>
        <textarea id="noticePreview" value={noticeText} readOnly className="w-full h-56 rounded border border-slate-300 p-2 font-mono text-sm" />
        <div className="flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(noticeText)} className="px-3 py-2 text-sm rounded bg-slate-800 text-white">
            Copy
          </button>
          <button type="button" className="px-3 py-2 text-sm rounded border">Download Draft PDF</button>
        </div>
      </div>

      <div>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
          {saving ? "Saving…" : "Review & Pay"}
        </button>
      </div>
    </form>
  );
}

export default PremisesForm;
