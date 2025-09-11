import React, { useEffect, useState } from 'react';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

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
    <form onSubmit={submit} className="space-y-8" aria-describedby="gvol-desc">
      <ErrorSummary errors={errors} />

      <section className={UI.section}>
        <div className={UI.h2}>Applicant & Council</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="applicantEmail" className={UI.label}>
              Applicant email
            </label>
            <input id="applicantEmail" ref={autoFocusRef} type="email" value={form.applicantEmail} onChange={(e) => setField('applicantEmail', e.target.value)} className={UI.input + ' w-full'} />
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
          <div>
            <label htmlFor="councilEmail" className={UI.label}>
              Council email
            </label>
            <input
              id="councilEmail"
              type="email"
              value={form.councilEmail}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={UI.input}
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
            <label htmlFor="operator" className={UI.label}>
              Operator
            </label>
            <input id="operator" value={form.operator} onChange={(e) => setField('operator', e.target.value)} className={UI.input + ' w-full'} />
          </div>
          <div>
            <label htmlFor="vehicles" className={UI.label}>
              Vehicles
            </label>
            <input id="vehicles" type="number" value={form.vehicles} onChange={(e) => setField('vehicles', Number(e.target.value))} className={UI.input} />
          </div>
          <div>
            <label htmlFor="trailers" className={UI.label}>
              Trailers
            </label>
            <input id="trailers" type="number" value={form.trailers} onChange={(e) => setField('trailers', Number(e.target.value))} className={UI.input} />
          </div>
        </div>
      </section>

      <button type="submit" disabled={saving} className={UI.pillBtn}>
        {saving ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}
