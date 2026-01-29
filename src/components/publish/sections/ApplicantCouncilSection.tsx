import React from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import AddressFields, { type AddressFieldsValue } from '@/components/AddressFields';
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
  const lookedUpWebsite = React.useRef('');

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
      <div className="mt-4 space-y-4">
        <AddressAutocomplete
          label="Applicant address"
          onSelect={(a: AddressOption) => {
            onChange({
              applicantAddressLine1: a.line1 || '',
              applicantAddressLine2: a.line2 || '',
              applicantCity: a.city || a.town || '',
              applicantPostcode: a.postcode || '',
            });
          }}
          inputTestId="input-applicant-address-lookup"
        />
        <AddressFields
          label=""
          namePrefix="applicant"
          testIdPrefix="applicant"
          required={false}
          value={{
            addressLine1: draft.applicantAddressLine1 || '',
            addressLine2: draft.applicantAddressLine2,
            city: draft.applicantCity || '',
            postcode: draft.applicantPostcode || '',
          }}
          onChange={(address) =>
            onChange({
              applicantAddressLine1: address.addressLine1,
              applicantAddressLine2: address.addressLine2,
              applicantCity: address.city,
              applicantPostcode: address.postcode,
            })
          }
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
              lookedUpWebsite.current = res.councilWebsite || '';
              onChange({
                councilName: res.councilName || draft.councilName,
                councilEmail: res.councilEmail || draft.councilEmail,
                councilAddress: res.councilAddress || draft.councilAddress,
                councilWebsite: res.councilWebsite || draft.councilWebsite,
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
      <div className="mt-4 space-y-4">
        <AddressAutocomplete
          label="Council address"
          onSelect={(a: AddressOption) => {
            onChange({
              councilAddressLine1: a.line1 || '',
              councilAddressLine2: a.line2 || '',
              councilCity: a.city || a.town || '',
              councilPostcode: a.postcode || '',
              // Update the legacy councilAddress field for backward compatibility
              councilAddress: [
                a.line1,
                a.line2,
                a.city || a.town,
                a.postcode,
              ]
                .filter(Boolean)
                .join(', '),
            });
          }}
          inputTestId="input-council-address-lookup"
        />
        <AddressFields
          label=""
          namePrefix="council"
          testIdPrefix="council"
          value={{
            addressLine1: draft.councilAddressLine1 || '',
            addressLine2: draft.councilAddressLine2,
            city: draft.councilCity || '',
            postcode: draft.councilPostcode || '',
          }}
          onChange={(address) =>
            onChange({
              councilAddressLine1: address.addressLine1,
              councilAddressLine2: address.addressLine2,
              councilCity: address.city,
              councilPostcode: address.postcode,
              // Update the legacy councilAddress field for backward compatibility
              councilAddress: [
                address.addressLine1,
                address.addressLine2,
                address.city,
                address.postcode,
              ]
                .filter(Boolean)
                .join(', '),
            })
          }
        />
        {lookedUpAddress.current && draft.councilAddress !== lookedUpAddress.current && (
          <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Value differs from council directory
          </span>
        )}
      </div>
      <div className="mt-4">
        <label htmlFor="councilWebsite" className={UI.label}>
          Council website (optional)
        </label>
        <input
          id="councilWebsite"
          type="url"
          className={UI.input}
          data-testid="input-council-website"
          value={draft.councilWebsite || ''}
          onChange={(e) => onChange({ councilWebsite: e.target.value })}
          placeholder="https://www.example.gov.uk/licensing"
        />
        {lookedUpWebsite.current && draft.councilWebsite !== lookedUpWebsite.current && (
          <span className="mt-1 inline-block rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            Value differs from council directory
          </span>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Where applicants can view their application online
        </p>
      </div>
    </>
  );
}

