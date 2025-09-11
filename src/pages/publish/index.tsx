import { useRef, useState } from 'react';
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

export default function PublishPage() {
  const [noticeType, setNoticeType] = useState<NoticeType>('premises');
  const [preview, setPreview] = useState('');
  const [issues, setIssues] = useState<ErrorItem[]>([]);
  const [representationDeadline, setRepresentationDeadline] = useState('');
  const [cost, setCost] = useState(49.99);
  const [consultationDays, setConsultationDays] = useState(28);
  const autoFocusRef = useRef<HTMLInputElement>(null);

  const handleAuthorityChange = (pack: any | null) => {
    setCost(pack?.costOverride ?? 49.99);
    setConsultationDays(pack?.consultationLength ?? 28);
  };

  const handlePremisesSubmit = async (data: any) => {
    const payload: any = {
      applicant: data.applicantName,
      premises: data.premisesName,
      address: { line1: data.premisesAddress, city: '', postcode: '', uprn: data.uprn },
      activities: [],
      applicationDate: new Date().toISOString().slice(0, 10),
      council: data.councilName,
      region: 'england_wales',
      representation: { method: 'email', value: data.councilEmail },
    };
    const { issues: rawIssues, representationDeadline } = validatePremisesLicence(payload as any);
    setPreview(renderPremisesLicence(payload as any, { region: payload.region }));
    setIssues(rawIssues.map((m) => ({ field: 'activities-grid', message: m })));
    setRepresentationDeadline(representationDeadline);
  };

  const handleGVOLSubmit = async (data: any) => {
    const payload: any = {
      operator: data.operator,
      address: data.address || { line1: '', city: '', postcode: '' },
      vehicles: data.vehicles,
      trailers: data.trailers,
      applicationDate: new Date().toISOString().slice(0, 10),
      council: data.councilName,
      region: 'england_wales',
    };
    const { issues: rawIssues, representationDeadline } = validateGVOL(payload as any);
    setPreview(
      renderGVOL(payload as any, {
        id: '',
        name: data.councilName,
        region: payload.region,
        representation: { email: data.councilEmail },
      } as any),
    );
    setIssues(rawIssues.map((m) => ({ field: m.includes('Vehicle') ? 'vehicles' : 'form', message: m })));
    setRepresentationDeadline(representationDeadline);
  };

  const handleTrafficSubmit = async (data: any) => {
    const payload: any = {
      roadName: data.title,
      restriction: data.description,
      duration: '',
      applicationDate: new Date().toISOString().slice(0, 10),
      council: data.councilName,
      region: 'england_wales',
    };
    const { issues: rawIssues, representationDeadline } = validateTrafficOrder(payload as any);
    setPreview(
      renderTrafficOrder(payload as any, {
        id: '',
        name: data.councilName,
        region: payload.region,
        representation: { email: data.councilEmail },
      } as any),
    );
    setIssues(rawIssues.map((m) => ({ field: 'title', message: m })));
    setRepresentationDeadline(representationDeadline);
  };

  return (
    <div className={UI.gradientBg}>
      <div className={UI.container + ' py-8 md:py-10'}>
        <div className="mb-6 flex items-center justify-between">
          <h1 className={UI.h2}>Publish a notice</h1>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className={UI.ghostPill}>Upload Blue Notice</span>
            <span className="text-slate-400">/</span>
            <span className={UI.ghostPill}>Build from Template</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8" data-testid="publish-layout">
          <main className="md:col-span-2 space-y-6">
            <ErrorSummary errors={issues} />
            <section className={UI.section}>
              <label htmlFor="notice-type" className={UI.label + ' mb-2'}>
                What type of notice do you require?
              </label>
              <NoticeTypeSelect value={noticeType} onChange={setNoticeType} />
            </section>
            {noticeType === 'premises' && (
              <PremisesForm onSubmit={handlePremisesSubmit} saving={false} autoFocusRef={autoFocusRef} onAuthorityChange={handleAuthorityChange} />
            )}
            {noticeType === 'gvol' && (
              <GVOLForm onSubmit={handleGVOLSubmit} saving={false} autoFocusRef={autoFocusRef} onAuthorityChange={handleAuthorityChange} />
            )}
            {noticeType === 'traffic' && (
              <TrafficForm onSubmit={handleTrafficSubmit} saving={false} autoFocusRef={autoFocusRef} onAuthorityChange={handleAuthorityChange} />
            )}
          </main>
          <aside className="md:col-span-1 space-y-4">
            <div className={UI.railCard + ' hover:shadow-[0_10px_34px_rgba(2,8,23,.10)]'}>
              <PreviewCard text={preview} />
            </div>
            <div className={UI.railCard + ' hover:shadow-[0_10px_34px_rgba(2,8,23,.10)]'}>
              <ComplianceCard issues={issues} />
            </div>
            <div className={UI.railCard + ' hover:shadow-[0_10px_34px_rgba(2,8,23,.10)]'}>
              <KeyDatesCard representationDeadline={representationDeadline} consultationDays={consultationDays} />
            </div>
            <div className={UI.railCard + ' hover:shadow-[0_10px_34px_rgba(2,8,23,.10)]'}>
              <CostCard cost={cost} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
