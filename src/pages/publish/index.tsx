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
    <div className="grid grid-cols-[minmax(0,720px),340px] gap-8" data-testid="publish-layout">
      <main className="space-y-6">
        <ErrorSummary errors={issues} />
        <NoticeTypeSelect value={noticeType} onChange={setNoticeType} />
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
      <aside className="sticky top-6 w-[340px] space-y-4">
        <PreviewCard text={preview} />
        <ComplianceCard issues={issues} />
        <KeyDatesCard representationDeadline={representationDeadline} consultationDays={consultationDays} />
        <CostCard cost={cost} />
      </aside>
    </div>
  );
}
