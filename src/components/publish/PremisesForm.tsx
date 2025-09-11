import React, { useEffect, useState } from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import UploadDropzone from '@/components/publish/UploadDropzone';
import ActivitiesHoursGrid, { defaultGrid, type GridRow } from '@/components/publish/ActivitiesHoursGrid';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

type Props = {
  value: any;
  onChange: (next: any) => void;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
  saving?: boolean;
  autoFocusRef?: React.RefObject<HTMLInputElement | null>;
};

const inputClass =
  'h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600';

// extend AddressOption so we can safely read uprn
type AddressWithUPRN = AddressOption & { uprn?: string };

export default function PremisesForm({
  value,
  onChange,
  saving = false,
  autoFocusRef,
  onAuthorityChange,
}: Props) {
  const [form, setForm] = useState<any>({
    applicantName: '',
    applicantAddress: '',
    applicantCity: '',
    applicantPostcode: '',
    applicantUprn: undefined as string | undefined,
    councilPack: '',
    councilEmail: '',
    premisesName: '',
    premisesAddress: '',
    city: '',
    postcode: '',
    uprn: undefined as string | undefined,
    applicationDate: '',
    activitiesGrid: defaultGrid(),
    activities: [] as any[],
  });
  const [prefilled, setPrefilled] = useState(false);
  const [errors] = useState<ErrorItem[]>([]);
  const [pack, setPack] = useState<AuthorityPack | null>(null);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    autoFocusRef?.current?.focus();
  }, [autoFocusRef]);

  useEffect(() => {
    if (value && typeof value === 'object') {
      setForm((f: any) => ({
        ...f,
        ...value,
        activitiesGrid: value.activitiesGrid || f.activitiesGrid,
      }));
    }
  }, [value]);

  function selectPack(id: string) {
    const p = listAuthorityPacks().find((a) => a.id === id) || null;
    setPack(p);
    setForm((f: any) => ({ ...f, councilPack: id, councilEmail: p?.representation.email || '' }));
    setOverride(false);
    onAuthorityChange?.(p);
    onChange({
      ...form,
      councilPack: id,
      councilName: p?.name || '',
      councilEmail: p?.representation.email || '',
      region: (p?.region as any) || form.region,
    });
  }

  function setField(key: string, v: any) {
    setForm((f: any) => ({ ...f, [key]: v }));
    if (key === 'councilEmail' && pack) setOverride(v !== pack.representation.email);
    onChange({ ...form, [key]: v });
  }

  function onAddressSelect(a: AddressWithUPRN) {
    const next = {
      ...form,
      premisesAddress: a.line1 || '',
      city: a.city || a.town || '',
      postcode: a.postcode || '',
      uprn: a.uprn, // now safe because we extended type
    };
    setForm(next);
    onChange(next);
  }

  function onApplicantAddressSelect(a: AddressWithUPRN) {
    const next = {
      ...form,
      applicantAddress: a.line1 || '',
      applicantCity: a.city || a.town || '',
      applicantPostcode: a.postcode || '',
      applicantUprn: a.uprn,
    };
    setForm(next);
    onChange(next);
  }

  function prefillFromText(t: string) {
    const nameMatch = t.match(/by\s+([^\n]+?)\s+of/i);
    if (nameMatch) setField('applicantName', nameMatch[1].trim());
    const addrMatch = t.match(/by[^\n]+? of ([^\n]+?) to/i);
    if (addrMatch) setField('applicantAddress', addrMatch[1].trim());
    const dateMatch = t.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) setField('applicationDate', dateMatch[1]);
    const premMatch = t.match(/Premises Licence at\s+([^\.\n]+)/i);
    if (premMatch) setField('premisesAddress', premMatch[1].trim());
  }

  function flattenActivities(rows: GridRow[]) {
    const activities: any[] = [];
    rows.forEach((row) => {
      (Object.entries(row.hours) as [string, { start: string; end: string } | null][]).forEach(
        ([day, h]) => {
          if (h && h.start && h.end)
            activities.push({ type: row.activity, days: [day], start: h.start, end: h.end });
        },
      );
    });
    return activities;
  }

  const packs = listAuthorityPacks();

  return (
    <form className="space-y-6">
      <ErrorSummary errors={errors} />
      <UploadDropzone
        onText={(t) => {
          prefillFromText(t);
          setPrefilled(true);
        }}
      />
      {prefilled && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
          Fields prefilled from upload — please verify
        </div>
      )}

      <section className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-medium">Applicant &amp; Council</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="applicantName" className={UI.label}>
              Applicant name
            </label>
            <input
              id="applicantName"
              ref={autoFocusRef as any}
              value={form.applicantName || ''}
              onChange={(e) => setField('applicantName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2" id="applicant-address">
            <AddressAutocomplete label="Applicant address" onSelect={onApplicantAddressSelect} />
          </div>
          <div>
            <label htmlFor="council" className={UI.label}>
              Council
            </label>
            <select
              id="council"
              value={form.councilPack || ''}
              onChange={(e) => selectPack(e.target.value)}
              className={inputClass}
            >
              <option value="">Select council</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label htmlFor="councilEmail" className={UI.label}>
              Council email
            </label>
            <input
              id="councilEmail"
              value={form.councilEmail || ''}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={inputClass + ' w-full'} // fixed: use inputClass not UI.input
            />
            {form.councilEmail && (
              <p className="mt-1 text-xs text-emerald-700">✅ Proof will be sent to {form.councilEmail}</p>
            )}
            {pack && (
              <p className="mt-1 text-xs text-slate-500">
                Council contact:{' '}
                {pack.representation.email ||
                  pack.representation.portal ||
                  pack.representation.postal}
                {override && <span className="ml-1 text-amber-700">Overrides applied</span>}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={UI.section}>
        <div className={UI.h2}>Application basics</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="premisesName" className={UI.label}>
              Premises name
            </label>
            <input
              id="premisesName"
              value={form.premisesName || ''}
              onChange={(e) => setField('premisesName', e.target.value)}
              className={inputClass + ' w-full'}
            />
          </div>
          <div className="col-span-2" id="premises-address">
            <AddressAutocomplete label="Premises address" onSelect={onAddressSelect} />
          </div>
          <div>
            <label htmlFor="applicationDate" className={UI.label}>
              Application date
            </label>
            <input
              id="applicationDate"
              type="date"
              value={form.applicationDate || ''}
              onChange={(e) => setField('applicationDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4 space-y-4">
        <ActivitiesHoursGrid
          value={form.activitiesGrid || defaultGrid()}
          onChange={(rows) => {
            const activities = flattenActivities(rows);
            const next = { ...form, activitiesGrid: rows, activities };
            setForm(next);
            onChange(next);
          }}
        />
      </section>
    </form>
  );
}
