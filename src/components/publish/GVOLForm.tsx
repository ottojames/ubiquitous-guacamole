import React, { useEffect, useState } from 'react';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
import * as UI from '@/styles/ui';

type GVOLFormData = {
  operator: string;
  councilPack?: string;
  councilName?: string;
  councilEmail?: string;
  applicantEmail?: string;
  vehicles: number;
  trailers: number;
  region?: string;
};

type Props = {
  value: GVOLFormData;
  onChange: (next: GVOLFormData) => void;
  saving?: boolean;
  autoFocusRef?: React.RefObject<HTMLInputElement | null>;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
};

// fall back to a sensible input class if UI.input isn't present in this project
const inputClass = (UI as any).input ?? 'h-11 rounded-lg border border-slate-300 bg-white px-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600';

export default function GVOLForm({
  value,
  onChange,
  saving = false,
  autoFocusRef,
  onAuthorityChange,
}: Props) {
  const [form, setForm] = useState<GVOLFormData>({
    operator: '',
    councilPack: '',
    councilEmail: '',
    applicantEmail: '',
    vehicles: 0,
    trailers: 0,
  });
  const [errors] = useState<ErrorItem[]>([]);
  const [pack, setPack] = useState<AuthorityPack | null>(null);
  const [override, setOverride] = useState(false);

  // autofocus first input if provided
  useEffect(() => {
    autoFocusRef?.current?.focus?.();
  }, [autoFocusRef]);

  // keep local state in sync with parent-controlled value
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
      const next: GVOLFormData = {
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

  function setField<K extends keyof GVOLFormData>(key: K, v: GVOLFormData[K]) {
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
    <form className="space-y-6" aria-describedby="gvol-desc">
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
            <label htmlFor="operator" className="block text-sm font-medium text-slate-700">
              Operator
            </label>
            <input
              id="operator"
              value={form.operator || ''}
              onChange={(e) => setField('operator', e.target.value)}
              className={inputClass + ' w-full'}
            />
          </div>

          <div>
            <label htmlFor="vehicles" className="block text-sm font-medium text-slate-700">
              Vehicles
            </label>
            <input
              id="vehicles"
              type="number"
              value={form.vehicles ?? 0}
              onChange={(e) => setField('vehicles', Number(e.target.value))}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="trailers" className="block text-sm font-medium text-slate-700">
              Trailers
            </label>
            <input
              id="trailers"
              type="number"
              value={form.trailers ?? 0}
              onChange={(e) => setField('trailers', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="pt-2">
        <button type="submit" disabled={saving} className={UI.pillBtn}>
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
