import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AddressBlock, { type Address } from '@/components/notice/AddressBlock';
import RequiredHint from '@/components/notice/RequiredHint';

export default function StepUpload() {
  const nav = useNavigate();
  const [address, setAddress] = React.useState<Address>({
    line1: '',
    line2: '',
    town: '',
    postcode: '',
    uprn: undefined,
    country: 'UK',
  });
  const [activeTab, setActiveTab] = React.useState<'notice' | 'template'>('notice');
  const [applicantName, setApplicantName] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload your Notice</h1>
      <div className="overflow-hidden rounded-xl border">
        <div className="flex border-b bg-muted/30">
          {(
            [
              { key: 'notice' as const, label: 'Upload from Notice' },
              { key: 'template' as const, label: 'Upload via Template' },
            ]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm transition ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="space-y-4 p-5">
          {activeTab === 'notice' ? (
            <div className="space-y-4">
              {/* TODO: Replace stub with the existing Upload-from-Notice implementation. */}
              <AddressBlock label="Premises address" value={address} onChange={setAddress} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="stub-applicant-name">
                    Applicant name
                  </label>
                  <input
                    id="stub-applicant-name"
                    className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. Smith & Co Ltd"
                    value={applicantName}
                    onChange={(event) => setApplicantName(event.target.value)}
                  />
                  {!applicantName.trim() && <RequiredHint />}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="stub-contact-email">
                    Contact email
                  </label>
                  <input
                    id="stub-contact-email"
                    type="email"
                    className="w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                  />
                  {!contactEmail.trim() && <RequiredHint />}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* TODO: Replace stub with the existing Upload-via-Template implementation. */}
              <p className="text-sm text-muted-foreground">
                Upload via Template stub — wire in the existing form fields during Step 3.
              </p>
              <AddressBlock label="Premises address" value={address} onChange={setAddress} required />
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <button className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={() => nav('/next/publish/confirm')}>Continue</button>
      </div>
    </div>
  );
}
