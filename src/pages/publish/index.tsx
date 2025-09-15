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
      { id: 'applicant', label: 'Applicant name + postal address (incl. postcode)', ok: !!(d?.applicantName && postcodeRe.test(d?.applicantPostcode || '')) },
      { id: 'premises', label: 'Premises address (incl. postcode)', ok: !!(d?.premisesAddress && postcodeRe.test(d?.postcode || '')) },
      { id: 'council', label: 'Council selected + email present', ok: !!(d?.councilName && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(d?.councilEmail || '')) },
      { id: 'dates', label: 'Application date set + deadline computed correctly', ok: !!(d?.applicationDate && representationDeadline) },
      { id: 'activities', label: 'If any activity is enabled, weekly hours valid', ok: (d?.activities?.length || 0) > 0 && !issues.some((i) => /Activity.*invalid|licensable activity/i.test(i.message)) },
      { id: 'boilerplate', label: 'Statutory boilerplate present in preview', ok: /It is an offence to knowingly or recklessly make a false statement/i.test(preview) },
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

  return (
    <div className={`${UI.pageWrapLg} relative`} data-testid="publish-layout">
      {/* Hero header */}
      <div className={`${UI.container} pt-16 md:pt-20 pb-6`}>
        <h1 className={`${UI.heroH1} mb-2`}>Publish a notice</h1>
        <p className={`${UI.heroSub} mt-1`}>Guided, compliant, and instant proof</p>
        {/* Mode tabs on gradient */}
        <nav role="tablist" className="mt-4 flex gap-2">
          <button
            className={`rounded-xl bg-white text-blue-900 font-semibold ring-1 ring-white/60 shadow-sm px-4 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-transparent`}
            data-active={true}
            aria-label="Upload from Notice"
          >
            Upload from Notice
          </button>
          <button
            className={`rounded-xl bg-white/80 text-blue-800 hover:bg-white ring-1 ring-white/50 px-4 h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-transparent`}
            data-active={false}
            aria-label="Upload via Template"
          >
            Upload via Template
          </button>
        </nav>
      </div>
      {/* Main content on light canvas */}
      <div className={`${UI.container} ${UI.sectionY} grid md:grid-cols-12 gap-8 items-start`}>
        {issues.length > 0 && (
          <div className="md:col-span-12">
            <ErrorSummary errors={issues} />
          </div>
        )}

        <main className="md:col-span-8 space-y-6">
            {/* First form surface: Notice type selection as a real card */}
            <section className={`${UI.card} ${UI.cardHover} p-6`}>
              <header className="mb-3">
                <h2 className={UI.cardHeader}>Confirm notice type</h2>
                <p className="text-sm text-slate-600 mt-1">Start by confirming your notice type. You can change this later.</p>
              </header>

              <div className="space-y-3">
                <NoticeTypeSelect value={noticeType} onChange={setNoticeType} />
              </div>

              <footer className="mt-4 flex justify-end">
                <button className={`${UI.btnPrimary} h-10 py-0`}>Continue</button>
              </footer>
            </section>
            {noticeType === 'premises' && (
              <PremisesForm
                value={premisesData}
                onChange={setPremisesData}
                onAuthorityChange={handleAuthorityChange}
                saving={false}
                autoFocusRef={autoFocusRef}
              />
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

        <aside className="md:col-span-4 md:sticky md:top-[var(--headerH)] space-y-4">
          <PreviewCard text={preview} />
          <ComplianceCard items={checklist} />
          <KeyDatesCard applicationDate={premisesData?.applicationDate || ''} representationDeadline={representationDeadline} consultationDays={consultationDays} />
          <CostCard cost={cost} canSubmit={canSubmit} />
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
