import React from 'react';
import * as UI from '@/styles/ui';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import type { CouncilValue } from '../types';

type Props = {
  postcode: string;
  value: CouncilValue | null;
  onChange: (value: CouncilValue) => void;
  onManualEdit?: () => void;
};

const withDefaults = (base: CouncilValue | null | undefined): CouncilValue => ({
  name: base?.name ?? '',
  repEmail: base?.repEmail ?? '',
  repPostal: base?.repPostal ?? '',
  officeAddress: base?.officeAddress,
  website: base?.website,
  policy: base?.policy,
});

export default function CouncilContactAuto({ postcode, value, onChange, onManualEdit }: Props) {
  const [lookupState, setLookupState] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [message, setMessage] = React.useState<string>('');

  const runLookup = React.useCallback(() => {
    const trimmed = postcode.trim();
    if (!trimmed) {
      setMessage('Enter the premises postcode to look up the council.');
      setLookupState('error');
      return;
    }
    setLookupState('loading');
    try {
      const res = lookupCouncilByPostcode(trimmed);
      if (!res) {
        setLookupState('error');
        setMessage('We could not match this postcode. Enter the council manually.');
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
    } catch (error) {
      console.error('Council lookup failed', error);
      setLookupState('error');
      setMessage('Lookup failed. Enter the details manually.');
    }
  }, [onChange, postcode]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={`${UI.btnSecondary} h-10 px-4 text-sm`} onClick={runLookup}>
          Auto-fill from postcode
        </button>
        <button
          type="button"
          className="text-sm font-medium text-blue-700 underline underline-offset-2"
          onClick={onManualEdit}
        >
          Enter manually
        </button>
      </div>
      {lookupState !== 'idle' && (
        <p className={`text-sm ${lookupState === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>
          {message}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3">
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
      </div>
    </div>
  );
}
