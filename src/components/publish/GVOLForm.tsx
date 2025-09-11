import React, { useEffect, useState } from 'react';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';

interface FormData {
  operator: string;
  councilPack: string;
  councilEmail: string;
  applicantEmail: string;
  vehicles: number;
  trailers: number;
}

interface Props {
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
}

const inputClass = 'h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600';

export default function GVOLForm({ onSubmit, saving, autoFocusRef, onAuthorityChange }: Props) {
  const [form, setForm] = useState<FormData>({
    operator: '',
    councilPack: '',
    councilEmail: '',
    applicantEmail: '',
    vehicles: 0,
    trailers: 0,
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
    if (key === 'councilEmail' && pack) setOverride(value !== pack.representation.email);
  }

  function validate(): boolean {
    const next: ErrorItem[] = [];
    if (!form.operator) next.push({ field: 'operator', message: 'Operator is required' });
    if (!form.councilPack) next.push({ field: 'council', message: 'Council is required' });
    if (!form.councilEmail) next.push({ field: 'councilEmail', message: 'Council email is required' });
    if (!form.applicantEmail) next.push({ field: 'applicantEmail', message: 'Applicant email is required' });
    setErrors(next);
    return next.length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      operator: form.operator,
      councilName: pack?.name || '',
      councilEmail: form.councilEmail,
      applicantEmail: form.applicantEmail,
      vehicles: form.vehicles,
      trailers: form.trailers,
    });
  }

  const packs = listAuthorityPacks();

  return (
    <form onSubmit={submit} className="space-y-6" aria-describedby="gvol-desc">
      <ErrorSummary errors={errors} />

      <div className="rounded-2xl border p-4 space-y-4">
        <h2 className="text-lg font-medium">Applicant & Council</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="applicantEmail" className="block text-sm font-medium text-slate-700">
              Applicant email
            </label>
            <input id="applicantEmail" ref={autoFocusRef} type="email" value={form.applicantEmail} onChange={(e) => setField('applicantEmail', e.target.value)} className={inputClass + ' w-full'} />
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
          <div>
            <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">
              Council email
            </label>
            <input
              id="councilEmail"
              type="email"
              value={form.councilEmail}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={inputClass}
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
            <label htmlFor="operator" className="block text-sm font-medium text-slate-700">
              Operator
            </label>
            <input id="operator" value={form.operator} onChange={(e) => setField('operator', e.target.value)} className={inputClass + ' w-full'} />
          </div>
          <div>
            <label htmlFor="vehicles" className="block text-sm font-medium text-slate-700">
              Vehicles
            </label>
            <input id="vehicles" type="number" value={form.vehicles} onChange={(e) => setField('vehicles', Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="trailers" className="block text-sm font-medium text-slate-700">
              Trailers
            </label>
            <input id="trailers" type="number" value={form.trailers} onChange={(e) => setField('trailers', Number(e.target.value))} className={inputClass} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="h-10 px-4 rounded-lg bg-blue-600 text-white disabled:opacity-50">
        {saving ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}
