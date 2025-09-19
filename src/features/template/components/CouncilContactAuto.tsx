import React from 'react';
import * as UI from '@/styles/ui';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import type { CouncilValue } from '../types';

type Props = {
  postcode: string;
  value: CouncilValue | null;
  onChange: (value: CouncilValue) => void;
};

const withDefaults = (base: CouncilValue | null | undefined): CouncilValue => ({
  name: base?.name ?? '',
  repEmail: base?.repEmail ?? '',
  repPostal: base?.repPostal ?? '',
  officeAddress: base?.officeAddress,
  website: base?.website,
  policy: base?.policy,
});

export default function CouncilContactAuto({ postcode, value, onChange }: Props) {
  const [lookupState, setLookupState] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = React.useState('');
  const [manualOpen, setManualOpen] = React.useState(false);

  const runLookup = React.useCallback(() => {
    const trimmed = postcode.trim();
    if (!trimmed) {
      setMessage('Enter the premises postcode to look up the council.');
      setLookupState('error');
      setManualOpen(true);
      return;
    }
    setLookupState('loading');
    try {
      const res = lookupCouncilByPostcode(trimmed);
      if (!res) {
        setLookupState('error');
        setMessage('We could not match this postcode. Enter the council manually.');
        setManualOpen(true);
        return;
      }
      const next: CouncilValue = {
        ...withDefaults(value),
        name: res.councilName,
        repEmail: res.councilEmail,
        repPostal: res.councilAddress,
      };
      onChange(next);
      setLookupState('success');
      setMessage('Council details loaded from directory.');
      setManualOpen(false);
    } catch (error) {
      console.error('Council lookup failed', error);
      setLookupState('error');
      setMessage('Lookup failed. Enter the details manually.');
      setManualOpen(true);
    }
  }, [onChange, postcode, value]);

  const hasSummary = Boolean((value?.name ?? '').trim() || (value?.repEmail ?? '').trim());

  React.useEffect(() => {
    if (!hasSummary) {
      setManualOpen(true);
    }
  }, [hasSummary]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={`${UI.btnSecondary} h-10 px-4 text-sm`} onClick={runLookup}>
          Auto-fill from postcode
        </button>
        <button
          type="button"
          className="text-sm font-medium text-blue-700 underline underline-offset-2"
          onClick={() => setManualOpen((prev) => !prev)}
        >
          {manualOpen ? 'Hide manual entry' : 'Edit manually'}
        </button>
      </div>
      {lookupState === 'error' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
          {message || 'We could not match this postcode. Enter the council manually.'}
        </div>
      )}
      {lookupState === 'success' && message && !manualOpen && (
        <p className="text-sm text-emerald-700">{message}</p>
      )}
      {!manualOpen && hasSummary && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Based on your premises address, this notice will be sent to{' '}
          <strong>{value?.name || 'the council'}</strong> at <strong>{value?.repEmail || '—'}</strong>.
        </div>
      )}
      {(manualOpen || !hasSummary) && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <label htmlFor="council-name" className="text-sm font-medium text-slate-700">
              Council name
            </label>
            <input
              id="council-name"
              className={`${UI.input} mt-1 w-full`}
              value={value?.name ?? ''}
              onChange={(event) => onChange({ ...withDefaults(value), name: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="council-email" className="text-sm font-medium text-slate-700">
              Representation email
            </label>
            <input
              id="council-email"
              className={`${UI.input} mt-1 w-full`}
              value={value?.repEmail ?? ''}
              onChange={(event) => onChange({ ...withDefaults(value), repEmail: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="council-postal" className="text-sm font-medium text-slate-700">
              Postal address for representations
            </label>
            <textarea
              id="council-postal"
              className={`${UI.input} mt-1 w-full min-h-[80px]`}
              value={value?.repPostal ?? ''}
              onChange={(event) => onChange({ ...withDefaults(value), repPostal: event.target.value })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="council-office" className="text-sm font-medium text-slate-700">
                Council office address (optional)
              </label>
              <input
                id="council-office"
                className={`${UI.input} mt-1 w-full`}
                value={value?.officeAddress ?? ''}
                onChange={(event) => onChange({ ...withDefaults(value), officeAddress: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="council-website" className="text-sm font-medium text-slate-700">
                Council website (optional)
              </label>
              <input
                id="council-website"
                className={`${UI.input} mt-1 w-full`}
                value={value?.website ?? ''}
                onChange={(event) => onChange({ ...withDefaults(value), website: event.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
