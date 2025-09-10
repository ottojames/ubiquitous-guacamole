import React, { useMemo } from 'react';
import AddressAutocomplete, { AddressOption } from '@/components/AddressAutocomplete';
import councils from '@/data/councils.json';

export type CouncilDirectoryItem = {
  id: string;
  name: string;
  licensingEmail: string;
  postal: string;
  postalAddress?: string;
  officeAddress?: string;
  licensingUrl?: string;
  repsEmail?: string;
  repsUrl?: string;
};

type Props = {
  applicantName: string;
  applicantEmail: string;
  councilName: string;
  councilEmail: string;
  address: { line1: string; line2?: string; line3?: string; city?: string; postcode?: string };
  onPatch: (patch: Partial<Props>) => void;
  onSelectAddress: (a: AddressOption) => void;
  onCouncilMeta?: (meta: CouncilDirectoryItem) => void;
};

export default function ApplicantPanel({ applicantName, applicantEmail, councilName, councilEmail, address, onPatch, onSelectAddress, onCouncilMeta }: Props) {
  const directory = councils as CouncilDirectoryItem[];
  const selected = useMemo(() => directory.find((d) => d.name === councilName), [directory, councilName]);

  function pickCouncil(id: string) {
    const c = directory.find((x) => x.id === id);
    if (!c) return;
    onPatch({ councilName: c.name, councilEmail: c.licensingEmail });
    onCouncilMeta?.(c);
  }

  const applicantOk = applicantName.trim().length >= 2;
  const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(applicantEmail);
  const councilOk = !!(councilName && councilEmail && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(councilEmail));
  const addressOk = !!(address?.line1 && address?.postcode);

  return (
    <div className="md:sticky md:top-24 space-y-4" aria-label="Applicant and council details">
      <div className="rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="space-y-4">
          <div data-error={!applicantOk}>
            <label htmlFor="applicantName" className="block text-sm font-medium">Applicant Name<span className="text-rose-600">*</span></label>
            <input
              id="applicantName"
              className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              value={applicantName}
              aria-describedby="applicant-name-help"
              onChange={(e) => onPatch({ applicantName: e.target.value })}
            />
            <p id="applicant-name-help" className="text-xs text-slate-500 mt-1">Your full legal name.</p>
          </div>
          <div data-error={!emailOk}>
            <label htmlFor="applicantEmail" className="block text-sm font-medium">Applicant Email<span className="text-rose-600">*</span></label>
            <input
              id="applicantEmail"
              type="email"
              className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              value={applicantEmail}
              aria-describedby="applicant-email-help"
              onChange={(e) => onPatch({ applicantEmail: e.target.value })}
            />
            <p id="applicant-email-help" className="text-xs text-slate-500 mt-1">We send your confirmation here.</p>
          </div>
          <div data-error={!councilOk}>
            <label htmlFor="council" className="block text-sm font-medium">Council<span className="text-rose-600">*</span></label>
            <select
              id="council"
              className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              value={selected?.id || ''}
              onChange={(e) => pickCouncil(e.target.value)}
              aria-describedby="council-help"
            >
              <option value="">Select council…</option>
              {directory.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p id="council-help" className="text-xs text-slate-500 mt-1">Auto‑fills council contact details.</p>
          </div>
          <div>
            <label htmlFor="councilEmail" className="block text-sm font-medium">Council Email</label>
            <input
              id="councilEmail"
              type="email"
              className="w-full rounded-lg border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              value={councilEmail}
              onChange={(e) => onPatch({ councilEmail: e.target.value })}
            />
          </div>

          <div data-error={!addressOk}>
            <AddressAutocomplete onSelect={onSelectAddress} />
            {address?.line1 && (
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
                  {[address.line1, address.line2, address.line3, address.city, address.postcode].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right rail intentionally shows only applicant/council summary */}
      <div className="rounded-2xl shadow-inner border border-slate-200 p-4 text-sm text-slate-700">
        <div><span className="font-medium">Applicant:</span> {applicantName || '—'}</div>
        <div><span className="font-medium">Email:</span> {applicantEmail || '—'}</div>
        <div><span className="font-medium">Council:</span> {councilName || '—'}</div>
        <div><span className="font-medium">Council email:</span> {councilEmail || '—'}</div>
      </div>
    </div>
  );
}
