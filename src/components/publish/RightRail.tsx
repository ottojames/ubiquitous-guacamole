import React, { useEffect, useMemo, useState } from 'react';
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
  editingAddress: boolean;
  onChange: (patch: Partial<Props>) => void;
  onSelectAddress: (a: AddressOption) => void;
  onToggleEditAddress: () => void;
  onCouncilMeta?: (meta: CouncilDirectoryItem) => void;
};

export default function RightRail({
  applicantName,
  applicantEmail,
  councilName,
  councilEmail,
  address,
  editingAddress,
  onChange,
  onSelectAddress,
  onToggleEditAddress,
  onCouncilMeta,
}: Props) {
  const [openCouncil, setOpenCouncil] = useState(false);
  const directory = councils as CouncilDirectoryItem[];

  // autosave on blur
  function saveDraft() {
    try {
      localStorage.setItem(
        'pn_draft_v1',
        JSON.stringify({ applicantName, applicantEmail, councilName, councilEmail, address }),
      );
    } catch {}
  }

  function pickCouncil(id: string) {
    const c = directory.find((x) => x.id === id);
    if (!c) return;
    onChange({ councilName: c.name, councilEmail: c.licensingEmail });
    onCouncilMeta?.(c);
  }

  return (
    <div className="space-y-3 md:sticky md:top-4">
      <div>
        <label className="block text-sm font-medium">
          Applicant Name<span className="text-rose-600 ml-0.5">*</span>
        </label>
        <input
          className="w-full border rounded p-2"
          value={applicantName}
          onChange={(e) => onChange({ applicantName: e.target.value })}
          onBlur={saveDraft}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">
          Applicant Email<span className="text-rose-600 ml-0.5">*</span>
        </label>
        <input
          type="email"
          className="w-full border rounded p-2"
          value={applicantEmail}
          onChange={(e) => onChange({ applicantEmail: e.target.value })}
          onBlur={saveDraft}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Council</label>
        <select
          className="w-full border rounded p-2"
          value={directory.find((d) => d.name === councilName)?.id || ''}
          onChange={(e) => pickCouncil(e.target.value)}
        >
          <option value="">Select council…</option>
          {directory.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Council Email</label>
        <input
          type="email"
          className="w-full border rounded p-2"
          value={councilEmail}
          onChange={(e) => onChange({ councilEmail: e.target.value })}
          onBlur={saveDraft}
        />
      </div>

      <div>
        <AddressAutocomplete onSelect={onSelectAddress} />
        {address.line1 && (
          <div className="mt-2 space-y-1">
            {(['line1', 'line2', 'line3', 'city', 'postcode'] as const).map((f) => (
              <input
                key={f}
                className="w-full border rounded p-2"
                value={(address as any)[f] || ''}
                readOnly={!editingAddress}
                placeholder={f}
                onChange={(e) => onChange({ address: { ...address, [f]: e.target.value } as any })}
                onBlur={saveDraft}
              />
            ))}
            <button type="button" className="text-xs underline" onClick={onToggleEditAddress}>
              {editingAddress ? 'Done' : 'Edit'}
            </button>
          </div>
        )}
      </div>

      {directory.find((d) => d.name === councilName) && (
        <details className="text-sm">
          <summary className="cursor-pointer">Council details (auto)</summary>
          <div className="mt-2 space-y-1 text-slate-700">
            <div>
              <span className="font-medium">Postal:</span>{' '}
              {directory.find((d) => d.name === councilName)!.postalAddress || directory.find((d) => d.name === councilName)!.postal}
            </div>
            {directory.find((d) => d.name === councilName)!.repsEmail && (
              <div>
                <span className="font-medium">Reps email:</span>{' '}
                {directory.find((d) => d.name === councilName)!.repsEmail}
              </div>
            )}
            {directory.find((d) => d.name === councilName)!.repsUrl && (
              <div>
                <span className="font-medium">Reps URL:</span>{' '}
                {directory.find((d) => d.name === councilName)!.repsUrl}
              </div>
            )}
            {directory.find((d) => d.name === councilName)!.officeAddress && (
              <div>
                <span className="font-medium">Office:</span>{' '}
                {directory.find((d) => d.name === councilName)!.officeAddress}
              </div>
            )}
            {directory.find((d) => d.name === councilName)!.licensingUrl && (
              <div>
                <span className="font-medium">Website:</span>{' '}
                {directory.find((d) => d.name === councilName)!.licensingUrl}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
