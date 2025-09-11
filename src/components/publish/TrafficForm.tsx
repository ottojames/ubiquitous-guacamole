import React, { useEffect, useState } from 'react';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

interface FormData {
  title: string;
  description: string;
  councilPack: string;
  councilEmail: string;
  applicantEmail: string;
}

interface Props {
  onSubmit: (data: any) => Promise<void>;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
}

export default function TrafficForm({ onSubmit, saving, autoFocusRef, onAuthorityChange }: Props) {
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    councilPack: '',
    councilEmail: '',
    applicantEmail: '',
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
    if (!form.title) next.push({ field: 'title', message: 'Title is required' });
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
      title: form.title,
      description: form.description,
      councilName: pack?.name || '',
      councilEmail: form.councilEmail,
      applicantEmail: form.applicantEmail,
    });
  }

  const packs = listAuthorityPacks();

  return (
    <form onSubmit={submit} className="space-y-6" aria-describedby="traffic-desc">
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
            <label htmlFor="title" className={UI.label}>
              Title
            </label>
            <input id="title" value={form.title} onChange={(e) => setField('title', e.target.value)} className={UI.input + ' w-full'} />
          </div>
          <div className="col-span-2">
            <label htmlFor="description" className={UI.label}>
              Description
            </label>
            <textarea id="description" value={form.description} onChange={(e) => setField('description', e.target.value)} className={UI.input + ' h-20 w-full'} />
          </div>
        </div>
      </section>

      <button type="submit" disabled={saving} className={UI.pillBtn}>
        {saving ? 'Saving…' : 'Submit'}
      </button>
    </form>
  );
}
