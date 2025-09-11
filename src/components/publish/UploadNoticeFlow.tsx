import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import FileDropOCR from '@/components/upload/FileDropOCR';
import PreviewCard from '@/components/publish/RightRail/PreviewCard';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import { lookupCouncilByPostcode } from '@/lib/councilLookup';
import { runMandatoryChecks, calcRepsDeadline } from '@/lib/licensing/checks';
import * as UI from '@/styles/ui';
import type { NoticeDraft } from '@/types/notice';
import { sha256Hex } from '@/lib/hash';

export default function UploadNoticeFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<NoticeDraft>({
    id: '',
    createdAt: '',
    noticeType: 'Premises Licence',
    applicantName: '',
    applicantEmail: '',
    premisesAddress: '',
    postcode: '',
    councilName: '',
    councilEmail: '',
    councilAddress: '',
    blueNoticeUploads: [],
    status: 'Draft',
    applicationDate: '',
  });
  const [confirmA, setConfirmA] = useState(false);
  const [confirmB, setConfirmB] = useState(false);
  const lookedUpEmail = React.useRef('');
  const lookedUpName = React.useRef('');
  const lookedUpAddress = React.useRef('');
  const requiredOk =
    draft.applicantName.trim() &&
    draft.premisesAddress.trim() &&
    draft.councilName.trim() &&
    draft.councilEmail.trim() &&
    draft.councilAddress.trim() &&
    draft.applicationDate.trim();
  const canContinue = requiredOk && confirmA && confirmB;

  return (
    <div>
      <ProgressBar step={step} />
      <div className="grid md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
          {step === 1 && (
            <FileDropOCR
              onText={(t) => {
                setText(t);
                setDraft((d) => ({ ...d, finalText: t }));
              }}
              onMeta={(m) => setDraft((d) => ({ ...d, originalFileMeta: m }))}
            />
          )}
          {step === 2 && (
            <div className="space-y-6">
              <section className={UI.section}>
                <div>
                  <label htmlFor="noticeText" className={UI.label}>Notice text</label>
                  <textarea
                    id="noticeText"
                    className={UI.input + ' h-40'}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      setDraft((d) => ({ ...d, finalText: e.target.value }));
                    }}
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="applicantName" className={UI.label}>
                    Applicant name<span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="applicantName"
                    required
                    className={UI.input}
                    value={draft.applicantName}
                    onChange={(e) => setDraft({ ...draft, applicantName: e.target.value })}
                  />
                </div>
                <div id="premises-address" className="mt-4">
                  <AddressAutocomplete
                    label="Premises address"
                    onSelect={(a: AddressOption) => {
                      const addr = a.label || '';
                      const pc = a.postcode || '';
                      setDraft((d) => ({ ...d, premisesAddress: addr, postcode: pc }));
                      const res = lookupCouncilByPostcode(pc);
                      if (res) {
                        lookedUpEmail.current = res.councilEmail;
                        lookedUpName.current = res.councilName;
                        lookedUpAddress.current = res.councilAddress;
                        setDraft((d) => ({
                          ...d,
                          councilName: res.councilName,
                          councilEmail: res.councilEmail,
                          councilAddress: res.councilAddress,
                        }));
                      }
                    }}
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="councilName" className={UI.label}>
                    Council name<span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="councilName"
                    required
                    className={UI.input}
                    value={draft.councilName}
                    onChange={(e) => setDraft({ ...draft, councilName: e.target.value })}
                  />
                  {lookedUpName.current && draft.councilName !== lookedUpName.current && (
                    <p className="mt-1 text-xs text-amber-700">Value differs from council directory</p>
                  )}
                </div>
                <div className="mt-4">
                  <label htmlFor="councilEmail" className={UI.label}>
                    Council email<span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="councilEmail"
                    required
                    className={UI.input}
                    value={draft.councilEmail}
                    onChange={(e) => setDraft({ ...draft, councilEmail: e.target.value })}
                  />
                  {lookedUpEmail.current && draft.councilEmail !== lookedUpEmail.current && (
                    <p className="mt-1 text-xs text-amber-700">Value differs from council directory</p>
                  )}
                </div>
                <div className="mt-4">
                  <label htmlFor="councilAddress" className={UI.label}>
                    Council address<span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="councilAddress"
                    required
                    className={UI.input}
                    value={draft.councilAddress}
                    onChange={(e) => setDraft({ ...draft, councilAddress: e.target.value })}
                  />
                  {lookedUpAddress.current && draft.councilAddress !== lookedUpAddress.current && (
                    <p className="mt-1 text-xs text-amber-700">Value differs from council directory</p>
                  )}
                </div>
                <div className="mt-4">
                  <label htmlFor="applicationDate" className={UI.label}>
                    Date of submission<span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="applicationDate"
                    required
                    type="date"
                    className={UI.input}
                    value={draft.applicationDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft({ ...draft, applicationDate: v, repsDeadline: v ? calcRepsDeadline(v) : '' });
                    }}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="confirm-a"
                    type="checkbox"
                    checked={confirmA}
                    onChange={(e) => setConfirmA(e.target.checked)}
                  />
                  <label htmlFor="confirm-a" className="text-sm">
                    I confirm the above text is a true and accurate copy of the notice published/displayed.
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="confirm-b"
                    type="checkbox"
                    checked={confirmB}
                    onChange={(e) => setConfirmB(e.target.checked)}
                  />
                  <label htmlFor="confirm-b" className="text-sm">
                    I understand that supplying false information is an offence.
                  </label>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-md border px-4 py-2"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="rounded-md border px-4 py-2"
                    disabled={!canContinue}
                    onClick={async () => {
                      const hash = await sha256Hex((draft.originalFileMeta?.sha256 || '') + (draft.finalText || ''));
                      setDraft((d) => ({ ...d, proofHash: hash }));
                      setStep(3);
                    }}
                  >
                    Continue to Pay
                  </button>
                </div>
              </section>
            </div>
          )}
          {step === 3 && <div>Pay step.</div>}
          {step === 1 && (
            <div>
              <button
                className="rounded-md border px-4 py-2"
                disabled={!text}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          )}
        </main>
        <aside className="md:col-span-1 space-y-4">
          <PreviewCard text={text} />
          <ComplianceCard items={runMandatoryChecks(draft)} />
          <KeyDatesCard
            applicationDate={draft.applicationDate}
            representationDeadline={draft.repsDeadline || ''}
            consultationDays={28}
          />
          <CostCard cost={0} canSubmit={canContinue && step === 2} />
        </aside>
      </div>
    </div>
  );
}
