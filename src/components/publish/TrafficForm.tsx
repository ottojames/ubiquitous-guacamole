import React, { useEffect, useState } from 'react';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

type TrafficFormData = {
  title: string;
  description: string;
  councilPack?: string;
  councilName?: string;
  councilEmail?: string;
  applicantEmail?: string;
  region?: string;
};

type Props = {
  value: TrafficFormData;
  onChange: (next: TrafficFormData) => void;
  saving?: boolean;
  autoFocusRef?: React.RefObject<HTMLInputElement | null>;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
};

const inputClass =
  'h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600';

export default function TrafficForm({
  value,
  onChange,
  saving = false,
  autoFocusRef,
  onAuthorityChange,
}: Props) {
  const [form, setForm] = useState<TrafficFormData>({
    title: '',
    description: '',
    councilPack: '',
    councilEmail: '',
    applicantEmail: '',
  });
  const [errors] = useState<ErrorItem[]>([]);
  const [pack, setPack] = useState<AuthorityPack | null>(null);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    autoFocusRef?.current?.focus();
  }, [autoFocusRef]);

  useEffect(() => {
    if (value && typeof value === 'object') {
      setForm((f) => ({ ...f, ...value }));
    }
  }, [value]);

  function selectPack(id: string) {
    const p = listAuthorityPacks().find((a) => a.id === id) || null;
    setPack(p);
    setOverride(false);

    setForm((prev) => {
      const next: TrafficFormData = {
        ...prev,
        councilPack: id,
        councilName: p?.name || '',
        councilEmail: p?.representation.email || '',
        region: (p?.region as any) || prev.region,
      };
      onChange(next);
      return next;
    });

    onAuthorityChange?.(p);
  }

  function setField<K extends keyof TrafficFormData>(key: K, v: TrafficFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: v };
      onChange(next);
      return next;
    });
    if (key === 'councilEmail' && pack) {
      setOverride((v as string) !== (pack.representation.email || ''));
    }
  }

  const packs = listAuthorityPacks();

  return (
    <form className="space-y-6" aria-describedby="traffic-desc">
      <ErrorSummary errors={errors} />

      <section className={UI.section}>
        <div className={UI.h2}>Applicant &amp; Council</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="applicantEmail" className="block text-sm font-medium text-slate-700">
              Applicant email
            </label>
            <input
              id="applicantEmail"
              ref={autoFocusRef as any}
              type="email"
              value={form.applicantEmail || ''}
              onChange={(e) => setField('applicantEmail', e.target.value)}
              className={inputClass + ' w-full'}
            />
          </div>

          <div>
            <label htmlFor="council" className="block text-sm font-medium text-slate-700">
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

          <div>
            <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">
              Council email
            </label>
            <input
              id="councilEmail"
              type="email"
              value={form.councilEmail || ''}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={inputClass}
            />
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
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              value={form.title || ''}
              onChange={(e) => setField('title', e.target.value)}
              className={inputClass + ' w-full'}
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description || ''}
              onChange={(e) => setField('description', e.target.value)}
              className="h-20 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
            />
          </div>
        </div>
      </section>
    </form>
  );
}
