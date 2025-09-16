import { useRef, useState, useMemo, useEffect } from 'react';
import NoticeTypeSelect, { type NoticeType } from '@/components/publish/NoticeTypeSelect';
import PremisesForm from '@/components/publish/PremisesForm';
import GVOLForm from '@/components/publish/GVOLForm';
import TrafficForm from '@/components/publish/TrafficForm';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import PreviewCard from '@/components/publish/RightRail/PreviewCard';
import ComplianceCard from '@/components/publish/RightRail/ComplianceCard';
import KeyDatesCard from '@/components/publish/RightRail/KeyDatesCard';
import CostCard from '@/components/publish/RightRail/CostCard';
import { renderPremisesLicence } from '../../../templates/premises-licence.template';
import { renderGVOL } from '../../../templates/gvol.template';
import { renderTrafficOrder } from '../../../templates/traffic-order.template';
import { validatePremisesLicence } from '../../../schemas/rules/premises-licence.rules';
import { validateGVOL } from '../../../schemas/rules/gvol.rules';
import { validateTrafficOrder } from '../../../schemas/rules/traffic-order.rules';
import * as UI from '@/styles/ui';

/* CN:FIX-START */
function focusAndFlash(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (el as HTMLInputElement | HTMLTextAreaElement | null)?.focus?.();
  el.classList.add('outline','outline-2','outline-blue-300');
  setTimeout(() => el.classList.remove('outline','outline-2','outline-blue-300'), 700);
}
/* CN:FIX-END */

function useDebounce<T>(val: T, ms = 250) {
  const [v, setV] = useState(val);
  useEffect(() => { const id = setTimeout(() => setV(val), ms); return () => clearTimeout(id); }, [val, ms]);
  return v;
}

export default function PublishPage() {
  const [noticeType, setNoticeType] = useState<NoticeType>('premises');

  // 🔹 Lifted, controlled form state (one per notice type)
  const [premisesData, setPremisesData] = useState<any>({});
  const [gvolData, setGvolData] = useState<any>({});
  const [trafficData, setTrafficData] = useState<any>({});

  const activeData = useMemo(
    () => (noticeType === 'premises' ? premisesData : noticeType === 'gvol' ? gvolData : trafficData),
    [noticeType, premisesData, gvolData, trafficData]
  );
  const debounced = useDebounce(activeData, 300);

  // Right-rail state
  const [preview, setPreview] = useState('');
  const [issues, setIssues] = useState<ErrorItem[]>([]);
  const [representationDeadline, setRepresentationDeadline] = useState('');
  const [cost, setCost] = useState<number>(49.99);
  const [consultationDays, setConsultationDays] = useState<number>(28);
  const checklist = useMemo(() => {
    const d = premisesData;
    const postcodeRe = /[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/i;
    return [
      {
        id: 'applicant',
        label: 'Applicant name + postal address (incl. postcode)',
        ok: !!(d?.applicantName && postcodeRe.test(d?.applicantPostcode || '')),
        target: 'applicantName',
      },
      {
        id: 'premises',
        label: 'Premises address (incl. postcode)',
        ok: !!(d?.premisesAddress && postcodeRe.test(d?.postcode || '')),
        target: 'premisesAddressLine1',
      },
      {
        id: 'council',
        label: 'Council selected + email present',
        ok: !!(d?.councilName && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(d?.councilEmail || '')),
        target: 'councilEmail',
      },
      {
        id: 'dates',
        label: 'Application date set + deadline computed correctly',
        ok: !!(d?.applicationDate && representationDeadline),
        target: 'applicationDate',
      },
      /* CN:STEP2-COMPLIANCE-UPGRADE-START */
      /* CN:FIX-START */
      {
        id: 'applicationSummary',
        label: 'Application summary present (if OCR missing)',
        ok: d?.ocrTextPresent ? true : ((d?.applicationSummary ?? '').trim().length > 0),
        fix: () => focusAndFlash('applicationSummary'),
        target: 'applicationSummary',
      },
      /* CN:FIX-END */
      /* CN:STEP2-COMPLIANCE-UPGRADE-END */
      {
        id: 'activities',
        label: 'If any activity is enabled, weekly hours valid',
        ok: (d?.activities?.length || 0) > 0 && !issues.some((i) => /Activity.*invalid|licensable activity/i.test(i.message)),
        target: 'activities-grid',
      },
      {
        id: 'boilerplate',
        label: 'Statutory boilerplate present in preview',
        ok: /It is an offence to knowingly or recklessly make a false statement/i.test(preview),
        target: 'notice-preview',
      },
    ];
  }, [premisesData, representationDeadline, issues, preview]);
  const canSubmit = checklist.every((c) => c.ok);

  // Authority pack hook (be lenient with keys)
  const handleAuthorityChange = (pack: any | null) => {
    setCost(typeof pack?.costOverride === 'number' ? pack.costOverride : 49.99);
    setConsultationDays(
      typeof pack?.consultationDays === 'number' ? pack.consultationDays :
      typeof pack?.consultationLength === 'number' ? pack.consultationLength : 28
    );
  };

  // 🔹 LIVE recompute (template + validators) as the user types
  useEffect(() => {
    try {
      if (noticeType === 'premises') {
        const payload = mapPremisesToPayload(debounced);
        const { issues: raw, representationDeadline: rd } = validatePremisesLicence(payload as any);
        setPreview(renderPremisesLicence(payload as any, { region: payload.region }));
        setIssues((raw || []).map((m: string) => ({ field: inferPremisesField(m), message: m })));
        setRepresentationDeadline(rd || '');
      } else if (noticeType === 'gvol') {
        const payload = mapGVOLToPayload(debounced);
        const { issues: raw, representationDeadline: rd } = validateGVOL(payload as any);
        setPreview(renderGVOL(payload as any, councilFromGVOL(debounced)));
        setIssues((raw || []).map((m: string) => ({ field: /vehicle/i.test(m) ? 'vehicles' : 'form', message: m })));
        setRepresentationDeadline(rd || '');
      } else {
        const payload = mapTrafficToPayload(debounced);
        const { issues: raw, representationDeadline: rd } = validateTrafficOrder(payload as any);
        setPreview(renderTrafficOrder(payload as any, councilFromTraffic(debounced)));
        setIssues((raw || []).map((m: string) => ({ field: 'title', message: m })));
        setRepresentationDeadline(rd || '');
      }
    } catch {
      // keep UI resilient
    }
  }, [noticeType, debounced]);

  const autoFocusRef = useRef<HTMLInputElement>(null);
  const handleNoticeTypeChange = (next: NoticeType) => {
    setNoticeType(next);
    setTimeout(() => {
      autoFocusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      autoFocusRef.current?.focus?.();
    }, 0);
  };
  const heroSteps: Array<{ label: string; status: 'current' | 'upcoming' }> = [
    { label: 'Confirm notice type', status: 'current' },
    { label: 'Fill notice details', status: 'upcoming' },
    { label: 'Review & publish', status: 'upcoming' },
  ];
  const noticeTypeHelpId = 'notice-type-help';

  return (
    <div className={`${UI.pageWrapLg} relative`} data-testid="publish-layout">
      {/* Hero header */}
      <div className={`${UI.container} pt-16 md:pt-20 pb-4`}>
        <h1 className={`${UI.heroH1} mb-2`}>Publish a notice</h1>
        <p className={`${UI.heroSub} mt-1`}>Guided, compliant, and instant proof</p>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2" aria-hidden>
              <div className={`${UI.stepperTrack}`} />
            </div>
            <ol
              className="relative z-10 flex w-full flex-wrap items-start justify-between gap-6 text-white/90"
              aria-label="Publish steps"
            >
              {heroSteps.map((step, idx) => {
                const isCurrent = step.status === 'current';
                return (
                  <li
                    key={step.label}
                    className="flex min-w-[120px] flex-1 flex-col items-center gap-2 text-center"
                  >
                    <button
                      type="button"
                      className={`${UI.stepDot} ${isCurrent ? UI.stepDotActive : ''} transition-all duration-200`}
                      aria-current={isCurrent ? 'step' : undefined}
                      aria-label={`Step ${idx + 1}: ${step.label}`}
                    >
                      {idx + 1}
                    </button>
                    <p className={`text-xs ${isCurrent ? 'font-medium text-white' : 'text-white/80'}`}>
                      {step.label}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
      {/* Main content on light canvas */}
      <div className={`${UI.container} ${UI.sectionY} pt-12 md:pt-16 lg:pt-20 grid md:grid-cols-12 gap-8 items-start`}>
        {issues.length > 0 && (
          <div className="md:col-span-12">
            <ErrorSummary errors={issues} />
          </div>
        )}

        <main className="md:col-span-8 space-y-6">
          <section className={UI.section}>
            <div className="space-y-2">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-blue-900">Confirm notice type</h2>
                  <p className="mt-1 text-sm text-slate-600">You can change this later.</p>
                </div>
                <button type="button" className={`${UI.btnPrimary} h-10 shrink-0 py-0`}>
                  Continue
                </button>
              </header>

              <div>
                <NoticeTypeSelect value={noticeType} onChange={handleNoticeTypeChange} helperTextId={noticeTypeHelpId} />
                <p
                  id={noticeTypeHelpId}
                  className="mt-2 text-[13px] leading-5 text-slate-600"
                >
                  We'll tailor the form to this type.
                </p>
              </div>
            </div>
          </section>
          {noticeType === 'premises' && (
            <>
              {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
              <PremisesForm
                value={premisesData}
                onChange={setPremisesData}
                onAuthorityChange={handleAuthorityChange}
                saving={false}
                autoFocusRef={autoFocusRef}
                representationDeadline={representationDeadline}
              />
              {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
            </>
          )}
          {noticeType === 'gvol' && (
            <GVOLForm
              value={gvolData}
              onChange={setGvolData}
              onAuthorityChange={handleAuthorityChange}
              saving={false}
              autoFocusRef={autoFocusRef}
            />
          )}
          {noticeType === 'traffic' && (
            <TrafficForm
              value={trafficData}
              onChange={setTrafficData}
              onAuthorityChange={handleAuthorityChange}
              saving={false}
              autoFocusRef={autoFocusRef}
            />
          )}
        </main>

        <aside className="md:col-span-4 md:sticky md:top-24 space-y-4">
          {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
          <PreviewCard text={preview} statusMessage={issues.length ? 'Some fields are missing or invalid. Complete the form to render the full notice.' : undefined} />
          {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
          <ComplianceCard items={checklist} onFix={(id) => id && focusAndFlash(id)} />
          <KeyDatesCard
            applicationDate={premisesData?.applicationDate || ''}
            representationDeadline={representationDeadline}
            consultationDays={consultationDays}
          />
          {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
          <CostCard cost={cost} canSubmit={canSubmit} label="Proceed to confirmation" />
          {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
        </aside>
      </div>
    </div>
  );
}

/* -------- mapping helpers (defensive) -------- */
function mapPremisesToPayload(d: any) {
  return {
    applicant: d?.applicantName || '',
    applicantAddress: {
      line1: d?.applicantAddress || '',
      city: d?.applicantCity || '',
      postcode: d?.applicantPostcode || '',
      uprn: d?.applicantUprn,
    },
    premises: d?.premisesName || '',
    address: {
      line1: d?.premisesAddress || '',
      city: d?.city || '',
      postcode: d?.postcode || '',
      uprn: d?.uprn,
    },
    activities: Array.isArray(d?.activities) ? d.activities : [],
    applicationDate: d?.applicationDate || new Date().toISOString().slice(0, 10),
    /* CN:STEP2-COMPLIANCE-UPGRADE-START */
    applicationSummary: d?.applicationSummary || '',
    /* CN:STEP2-COMPLIANCE-UPGRADE-END */
    council: d?.councilName || '',
    region: d?.region || 'england_wales',
    representation: { method: 'email', value: d?.councilEmail || '' },
  };
}
const inferPremisesField = (m: string) => (/activity|hour/i.test(m) ? 'activities-grid' : 'form');

function mapGVOLToPayload(d: any) {
  return {
    operator: d?.operator || '',
    address: d?.address || { line1: '', city: '', postcode: '' },
    vehicles: d?.vehicles ?? 0,
    trailers: d?.trailers ?? 0,
    applicationDate: d?.applicationDate || new Date().toISOString().slice(0, 10),
    council: d?.councilName || '',
    region: d?.region || 'england_wales',
    representation: { method: 'email', value: d?.councilEmail || '' },
  };
}
const councilFromGVOL = (d: any) => ({ id: '', name: d?.councilName || '', region: d?.region || 'england_wales', representation: { email: d?.councilEmail || '' } });

function mapTrafficToPayload(d: any) {
  return {
    roadName: d?.title || '',
    restriction: d?.description || '',
    duration: d?.duration || '',
    applicationDate: d?.applicationDate || new Date().toISOString().slice(0, 10),
    council: d?.councilName || '',
    region: d?.region || 'england_wales',
    representation: { method: 'email', value: d?.councilEmail || '' },
  };
}
const councilFromTraffic = (d: any) => ({ id: '', name: d?.councilName || '', region: d?.region || 'england_wales', representation: { email: d?.councilEmail || '' } });
