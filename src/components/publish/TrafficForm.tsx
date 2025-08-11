import React, { useState, useEffect } from 'react';

interface FormData {
  title: string;
  councilEmail: string;
  applicantEmail: string;
  description: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
}

export default function TrafficForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [form, setForm] = useState<FormData>({
    title: '',
    councilEmail: '',
    applicantEmail: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    autoFocusRef.current?.focus();
  }, [autoFocusRef]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.title) next.title = 'Title is required';
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

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" aria-describedby="traffic-desc">
      <p id="traffic-desc" className="sr-only">Traffic notice placeholder form</p>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
        <input id="title" name="title" ref={autoFocusRef} value={form.title} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">Authority email</label>
        <input id="councilEmail" name="councilEmail" type="email" value={form.councilEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.councilEmail && <p className="text-sm text-red-600 mt-1">{errors.councilEmail}</p>}
      </div>
      <div>
        <label htmlFor="applicantEmail" className="block text-sm font-medium text-slate-700">Applicant email</label>
        <input id="applicantEmail" name="applicantEmail" type="email" value={form.applicantEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        {errors.applicantEmail && <p className="text-sm text-red-600 mt-1">{errors.applicantEmail}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
        <textarea id="description" name="description" value={form.description} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
      </div>
      <button type="submit" disabled={saving} className="h-10 px-4 rounded bg-blue-600 text-white disabled:opacity-50">
        {saving ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
}
