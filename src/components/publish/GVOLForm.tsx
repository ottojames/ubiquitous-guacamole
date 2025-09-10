import React, { useState, useEffect } from 'react';
import ErrorSummary from './ErrorSummary';

interface FormData {
  operator: string;
  councilEmail: string;
  applicantEmail: string;
  vehicles: number;
  trailers: number;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
}

export default function GVOLForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [form, setForm] = useState<FormData>({
    operator: '',
    councilEmail: '',
    applicantEmail: '',
    vehicles: 0,
    trailers: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    autoFocusRef.current?.focus();
  }, [autoFocusRef]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'vehicles' || name === 'trailers' ? Number(value) : value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.operator) next.operator = 'Operator is required';
    if (!form.councilEmail) next.councilEmail = 'Authority email is required';
    if (!form.applicantEmail) next.applicantEmail = 'Applicant email is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  }

  const errorList = Object.values(errors);

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" aria-describedby="gvol-desc">
      <ErrorSummary errors={errorList} />
      <p id="gvol-desc" className="sr-only">Goods vehicle operator licence placeholder form</p>
      <div data-error={!!errors.operator}>
        <label htmlFor="operator" className="block text-sm font-medium text-slate-700">Operator</label>
        <input id="operator" name="operator" ref={autoFocusRef} value={form.operator} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.operator && <p className="text-sm text-red-600 mt-1">{errors.operator}</p>}
      </div>
      <div data-error={!!errors.councilEmail}>
        <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">Authority email</label>
        <input id="councilEmail" name="councilEmail" type="email" value={form.councilEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.councilEmail && <p className="text-sm text-red-600 mt-1">{errors.councilEmail}</p>}
      </div>
      <div data-error={!!errors.applicantEmail}>
        <label htmlFor="applicantEmail" className="block text-sm font-medium text-slate-700">Applicant email</label>
        <input id="applicantEmail" name="applicantEmail" type="email" value={form.applicantEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.applicantEmail && <p className="text-sm text-red-600 mt-1">{errors.applicantEmail}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="vehicles" className="block text-sm font-medium text-slate-700">Vehicles</label>
          <input id="vehicles" name="vehicles" type="number" value={form.vehicles} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
        <div>
          <label htmlFor="trailers" className="block text-sm font-medium text-slate-700">Trailers</label>
          <input id="trailers" name="trailers" type="number" value={form.trailers} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
      </div>
      <button type="submit" disabled={saving} className="h-10 px-4 rounded bg-blue-600 text-white disabled:opacity-50">
        {saving ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
}
