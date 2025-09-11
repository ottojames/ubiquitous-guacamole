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
    <div className="px-4 md:px-6 lg:px-8" data-testid="publish-layout">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <NoticeTypeSelect value={noticeType} onChange={setNoticeType} />
        <div className="text-sm text-slate-600">
          Mode:&nbsp;
          <span className="inline-flex items-center gap-2">
            <span className="rounded-md border px-2 py-1">Upload Blue Notice</span>
            <span className="text-slate-400">/</span>
            <span className="rounded-md border px-2 py-1">Build from Template</span>
          </span>
        </div>
      </div>

      {issues.length > 0 && <ErrorSummary errors={issues} />}

      <div className="grid md:grid-cols-3 gap-8">
        <main className="md:col-span-2 space-y-6">
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

        <aside className="md:col-span-1 sticky top-6 space-y-4">
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
