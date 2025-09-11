import React, { useEffect, useState } from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import ActivitiesHoursGrid, { defaultGrid, type GridRow } from '@/components/publish/ActivitiesHoursGrid';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';

interface FormData {
  applicantName: string;
  councilPack: string;
  councilEmail: string;
  premisesName: string;
  address: AddressOption | null;
  activities: GridRow[];
}

interface Props {
  onSubmit: (data: any) => Promise<void> | void;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
}

const inputClass = 'h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600';

export default function PremisesForm({ onSubmit, saving, autoFocusRef, onAuthorityChange }: Props) {
  const [form, setForm] = useState<FormData>({
    applicantName: '',
    councilPack: '',
    councilEmail: '',
    premisesName: '',
    address: null,
    activities: defaultGrid(),
  });
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [pack, setPack] = useState<AuthorityPack | null>(null);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    autoFocusRef.current?.focus();
  }, [autoFocusRef]);

  function selectPack(id: string) {
    const p = listAuthorityPacks().find((a) => a.id === id) || null;
    setPack(p);
    setForm((f) => ({ ...f, councilPack: id, councilEmail: p?.representation.email || '' }));
    setOverride(false);
    onAuthorityChange?.(p);
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'councilEmail' && pack) {
      setOverride(value !== pack.representation.email);
    }
  }

  function validate(): boolean {
    const next: ErrorItem[] = [];
    if (!form.applicantName) next.push({ field: 'applicantName', message: 'Applicant name is required' });
    if (!form.councilPack) next.push({ field: 'council', message: 'Council is required' });
    if (!form.councilEmail) next.push({ field: 'councilEmail', message: 'Council email is required' });
    if (!form.premisesName) next.push({ field: 'premisesName', message: 'Premises name is required' });
    if (!form.address) next.push({ field: 'premises-address', message: 'Premises address is required' });
    setErrors(next);
    return next.length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const activities: any[] = [];
    form.activities.forEach((row) => {
      (Object.entries(row.hours) as [string, { start: string; end: string } | null][]).forEach(([day, h]) => {
        if (h) activities.push({ type: row.activity, days: [day], start: h.start, end: h.end });
      });
    });
    onSubmit({
      applicantName: form.applicantName,
      councilName: pack?.name || '',
      councilEmail: form.councilEmail,
      premisesName: form.premisesName,
      premisesAddress: form.address ? [form.address.line1, form.address.city, form.address.postcode].filter(Boolean).join(', ') : '',
      uprn: form.address?.uprn,
      activities,
    });
  }

  const packs = listAuthorityPacks();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorSummary errors={errors} />

      <div className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-medium">Applicant & Council</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="applicantName" className="block text-sm font-medium text-slate-700">
              Applicant name
            </label>
            <input id="applicantName" ref={autoFocusRef} value={form.applicantName} onChange={(e) => setField('applicantName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="council" className="block text-sm font-medium text-slate-700">
              Council
            </label>
            <select id="council" value={form.councilPack} onChange={(e) => selectPack(e.target.value)} className={inputClass}>
              <option value="">Select council</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">
              Council email
            </label>
            <input
              id="councilEmail"
              value={form.councilEmail}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={inputClass + ' w-full'}
            />
            {pack && (
              <p className="mt-1 text-xs text-slate-500">
                Council contact: {pack.representation.email || pack.representation.portal || pack.representation.postal}
                {override && <span className="text-amber-700 ml-1">Overrides applied</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-medium">Application basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="premisesName" className="block text-sm font-medium text-slate-700">
              Premises name
            </label>
            <input id="premisesName" value={form.premisesName} onChange={(e) => setField('premisesName', e.target.value)} className={inputClass + ' w-full'} />
          </div>
          <div className="col-span-2" id="premises-address">
            <AddressAutocomplete onSelect={(a) => setField('address', a)} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-4">
        <ActivitiesHoursGrid value={form.activities} onChange={(rows) => setField('activities', rows)} />
      </div>

      <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-blue-600 text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}
