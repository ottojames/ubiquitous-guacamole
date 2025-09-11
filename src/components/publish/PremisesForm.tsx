import React, { useEffect, useState } from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import ActivitiesHoursGrid, { defaultGrid, type GridRow } from '@/components/publish/ActivitiesHoursGrid';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

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

      <section className={UI.section}>
        <div className={UI.h2}>Applicant & Council</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="applicantName" className={UI.label}>
              Applicant name
            </label>
            <input id="applicantName" ref={autoFocusRef} value={form.applicantName} onChange={(e) => setField('applicantName', e.target.value)} className={UI.input} />
          </div>
          <div>
            <label htmlFor="council" className={UI.label}>
              Council
            </label>
            <select id="council" value={form.councilPack} onChange={(e) => selectPack(e.target.value)} className={UI.input}>
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
              value={form.councilEmail}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={UI.input + ' w-full'}
            />
            {pack && (
              <p className="mt-1 text-xs text-slate-500">
                Council contact: {pack.representation.email || pack.representation.portal || pack.representation.postal}
                {override && <span className="text-amber-700 ml-1">Overrides applied</span>}
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
            <input id="premisesName" value={form.premisesName} onChange={(e) => setField('premisesName', e.target.value)} className={UI.input + ' w-full'} />
          </div>
          <div className="col-span-2" id="premises-address">
            <AddressAutocomplete onSelect={(a) => setField('address', a)} />
          </div>
        </div>
      </section>

      <section className={UI.section}>
        <ActivitiesHoursGrid value={form.activities} onChange={(rows) => setField('activities', rows)} />
      </section>

      <button type="submit" disabled={saving} className={UI.pillBtn}>
        {saving ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}
