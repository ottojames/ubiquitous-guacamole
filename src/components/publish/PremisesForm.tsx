import React, { useEffect, useRef, useState } from 'react';

interface AddressResult {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
}

interface FormData {
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  activities: string[];
  open_start: string;
  open_end: string;
  councilEmail: string;
  applicantEmail: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
}

const activityOptions = [
  'Sale of alcohol on/off the premises',
  'Live music',
  'Recorded music',
  'Late night refreshment',
];

export default function PremisesForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [form, setForm] = useState<FormData>({
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    activities: [],
    open_start: '',
    open_end: '',
    councilEmail: '',
    applicantEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // address autocomplete
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/addresses?q=${encodeURIComponent(query)}&country=GB`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: AddressResult[]) => setSuggestions(data))
      .catch(() => setSuggestions([]));
    return () => ctrl.abort();
  }, [query]);

  const suggestionsRef = useRef<HTMLUListElement>(null);

  function selectAddress(a: AddressResult) {
    setForm(f => ({
      ...f,
      address_line1: a.line1,
      address_line2: a.line2,
      city: a.city,
      postcode: a.postcode,
    }));
    setQuery(`${a.line1}, ${a.postcode}`);
    setSuggestions([]);
  }

  function toggleActivity(v: string) {
    setForm(f => {
      const activities = f.activities.includes(v)
        ? f.activities.filter(a => a !== v)
        : [...f.activities, v];
      return { ...f, activities };
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.address_line1) next.address_line1 = 'Address is required';
    if (!form.postcode) next.postcode = 'Postcode is required';
    if (!form.open_start || !form.open_end) next.open_start = 'Opening hours required';
    if (!form.councilEmail) next.councilEmail = 'Council email is required';
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
    <form onSubmit={submit} className="mt-6 space-y-5" aria-describedby="premises-desc">
      <p id="premises-desc" className="sr-only">Premises Licence application form</p>

      <div className="space-y-2">
        <label htmlFor="addressSearch" className="block text-sm font-medium text-slate-700">
          Address
        </label>
        <input
          id="addressSearch"
          ref={autoFocusRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-slate-300 p-2"
          placeholder="Start typing address"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            role="listbox"
            className="mt-1 rounded border border-slate-300 bg-white shadow max-h-48 overflow-auto"
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-slate-100"
                  onClick={() => selectAddress(s)}
                >
                  {s.line1}, {s.postcode}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="address_line1">Line 1</label>
          <input id="address_line1" name="address_line1" value={form.address_line1} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
          {errors.address_line1 && <p className="text-sm text-red-600 mt-1">{errors.address_line1}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="address_line2">Line 2</label>
          <input id="address_line2" name="address_line2" value={form.address_line2} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="city">City</label>
          <input id="city" name="city" value={form.city} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="postcode">Postcode</label>
          <input id="postcode" name="postcode" value={form.postcode} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
          {errors.postcode && <p className="text-sm text-red-600 mt-1">{errors.postcode}</p>}
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">Licensable activities</legend>
        {activityOptions.map((a) => (
          <label key={a} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activities.includes(a)}
              onChange={() => toggleActivity(a)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">{a}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="open_start" className="block text-sm font-medium text-slate-700">Opening time</label>
          <input id="open_start" name="open_start" type="time" value={form.open_start} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
        <div>
          <label htmlFor="open_end" className="block text-sm font-medium text-slate-700">Closing time</label>
          <input id="open_end" name="open_end" type="time" value={form.open_end} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
        </div>
      </div>
      {errors.open_start && <p className="text-sm text-red-600">{errors.open_start}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="councilEmail" className="block text-sm font-medium text-slate-700">Council email</label>
          <input id="councilEmail" name="councilEmail" type="email" value={form.councilEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
          {errors.councilEmail && <p className="text-sm text-red-600 mt-1">{errors.councilEmail}</p>}
        </div>
        <div>
          <label htmlFor="applicantEmail" className="block text-sm font-medium text-slate-700">Applicant email</label>
          <input id="applicantEmail" name="applicantEmail" type="email" value={form.applicantEmail} onChange={handleChange} className="w-full rounded border border-slate-300 p-2" />
          {errors.applicantEmail && <p className="text-sm text-red-600 mt-1">{errors.applicantEmail}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="h-10 px-4 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
}
