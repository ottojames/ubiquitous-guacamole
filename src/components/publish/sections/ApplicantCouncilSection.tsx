import React from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import * as UI from '@/styles/ui';
import type { NoticeDraft } from '@/types/notice';

type ApplicantCouncilProps = {
  draft: NoticeDraft;
  onChange: (p: Partial<NoticeDraft>) => void;
  refs?: {
    applicant?: React.RefObject<HTMLInputElement>;
    premisesAddress?: React.RefObject<HTMLInputElement>;
    councilName?: React.RefObject<HTMLInputElement>;
    councilEmail?: React.RefObject<HTMLInputElement>;
    councilAddress?: React.RefObject<HTMLInputElement>;
  };
};

export default function ApplicantCouncilSection(props: ApplicantCouncilProps) {
  const { draft, onChange, refs } = props;
  const lookedUpEmail = React.useRef('');
  const lookedUpName = React.useRef('');
  const lookedUpAddress = React.useRef('');

  return (
    <>
      <div>
        <label htmlFor="applicantName" className={UI.label}>
          Applicant name<span className="text-rose-600">*</span>
        </label>
        <input
          id="applicantName"
          className={UI.input}
          ref={refs?.applicant}
          data-testid="input-applicant-name"
          value={draft.applicantName}
          onChange={(e) => onChange({ applicantName: e.target.value })}
        />
      </div>
      <div id="premises-address" className="mt-4">
        <AddressAutocomplete
          // Keep label casing consistent with current Step 2 markup
          label="Premises address"
          onSelect={(a: AddressOption) => {
            const addr = a.label || '';
            const pc = a.postcode || '';
            onChange({ premisesAddress: addr, postcode: pc });
            const res = pc ? lookupCouncilByPostcode(pc) : undefined;
            if (res) {
              lookedUpEmail.current = res.councilEmail || '';
              lookedUpName.current = res.councilName || '';
              lookedUpAddress.current = res.councilAddress || '';
              onChange({
                councilName: res.councilName || draft.councilName,
                councilEmail: res.councilEmail || draft.councilEmail,
                councilAddress: res.councilAddress || draft.councilAddress,
              });
            }
          }}
          inputTestId="input-premises-address"
        />
      </div>
      <div className="mt-4">
        <label htmlFor="councilName" className={UI.label}>
          Council name<span className="text-rose-600">*</span>
        </label>
        <input
          id="councilName"
          className={UI.input}
          ref={refs?.councilName}
          data-testid="input-council-name"
          value={draft.councilName}
          onChange={(e) => onChange({ councilName: e.target.value })}
        />
        {lookedUpName.current && draft.councilName !== lookedUpName.current && (
          <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Value differs from council directory
          </span>
        )}
      </div>
      <div className="mt-4">
        <label htmlFor="councilEmail" className={UI.label}>
          Council email<span className="text-rose-600">*</span>
        </label>
        <input
          id="councilEmail"
          className={UI.input}
          ref={refs?.councilEmail}
          data-testid="input-council-email"
          value={draft.councilEmail}
          onChange={(e) => onChange({ councilEmail: e.target.value })}
        />
        {lookedUpEmail.current && draft.councilEmail !== lookedUpEmail.current && (
          <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Value differs from council directory
          </span>
        )}
      </div>
      <div className="mt-4">
        <label htmlFor="councilAddress" className={UI.label}>
          Council address<span className="text-rose-600">*</span>
        </label>
        <input
          id="councilAddress"
          className={UI.input}
          ref={refs?.councilAddress}
          data-testid="input-council-address"
          value={draft.councilAddress}
          onChange={(e) => onChange({ councilAddress: e.target.value })}
        />
        {lookedUpAddress.current && draft.councilAddress !== lookedUpAddress.current && (
          <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Value differs from council directory
          </span>
        )}
      </div>
    </>
  );
}

