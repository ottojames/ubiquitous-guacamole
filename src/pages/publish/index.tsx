import { useRef, useState } from 'react';
import type { AddressOption } from '@/components/AddressAutocomplete';
import AppShell from '@/components/publish/AppShell';
import ApplicantPanel from '@/components/publish/ApplicantPanel';
import NoticeTypeSelect, { type NoticeType } from '@/components/publish/NoticeTypeSelect';
import PremisesForm from '@/components/publish/PremisesForm';
import GVOLForm from '@/components/publish/GVOLForm';
import TrafficForm from '@/components/publish/TrafficForm';
import RightRail from '@/components/publish/RightRail';
import ErrorSummary from '@/components/publish/ErrorSummary';
import { renderPremisesLicence } from '../../../templates/premises-licence.template';
import { renderGVOL } from '../../../templates/gvol.template';
import { renderTrafficOrder } from '../../../templates/traffic-order.template';
import { validatePremisesLicence } from '../../../schemas/rules/premises-licence.rules';
import { validateGVOL } from '../../../schemas/rules/gvol.rules';
import { validateTrafficOrder } from '../../../schemas/rules/traffic-order.rules';

export default function PublishPage() {
  const [noticeType, setNoticeType] = useState<NoticeType>('premises');
  const [preview, setPreview] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [representationDeadline, setRepresentationDeadline] = useState('');
  const autoFocusRef = useRef<HTMLInputElement>(null);

  const [applicant, setApplicant] = useState({
    applicantName: '',
    applicantEmail: '',
    councilName: '',
    councilEmail: '',
    address: { line1: '', city: '', postcode: '', uprn: '' },
    region: '',
    representationEmail: '',
    representationUrl: '',
    representationPostal: '',
    consultationDays: 0,
  });

  const patchApplicant = (patch: Partial<typeof applicant>) =>
    setApplicant((a) => ({ ...a, ...patch }));

  const handleAddress = (a: AddressOption) => {
    setApplicant((f) => ({
      ...f,
      address: {
        line1: a.line1 || a.lines?.[0] || '',
        line2: a.line2 || a.lines?.[1],
        line3: a.line3 || a.lines?.[2],
        city: a.city || a.town || '',
        postcode: a.postcode || '',
        uprn: a.uprn,
      },
    }));
  };

  const handlePremisesSubmit = async (data: any) => {
    const payload: any = {
      applicant: data.applicantName,
      premises: data.premisesName,
      address: { line1: data.premisesAddress, city: '', postcode: '', uprn: applicant.address.uprn },
      activities: [],
      applicationDate: new Date().toISOString().slice(0, 10),
      council: data.councilName,
      region: applicant.region || 'england_wales',
      representation: { method: 'email', value: data.councilEmail || applicant.representationEmail },
    };
    const { issues, representationDeadline } = validatePremisesLicence(payload as any);
    setPreview(renderPremisesLicence(payload as any, { region: payload.region }));
    setIssues(issues);
    setRepresentationDeadline(representationDeadline);
  };

  const handleGVOLSubmit = async (data: any) => {
    const payload: any = {
      operator: data.operator,
      address: applicant.address,
      vehicles: data.vehicles,
      trailers: data.trailers,
      applicationDate: new Date().toISOString().slice(0, 10),
      council: applicant.councilName,
      region: applicant.region || 'england_wales',
    };
    const { issues, representationDeadline } = validateGVOL(payload as any);
    setPreview(
      renderGVOL(payload as any, {
        id: '',
        name: applicant.councilName,
        region: payload.region,
        representation: { email: applicant.representationEmail || applicant.councilEmail },
      } as any),
    );
    setIssues(issues);
    setRepresentationDeadline(representationDeadline);
  };

  const handleTrafficSubmit = async (data: any) => {
    const payload: any = {
      roadName: data.title,
      restriction: data.description,
      duration: '',
      applicationDate: new Date().toISOString().slice(0, 10),
      council: applicant.councilName,
      region: applicant.region || 'england_wales',
    };
    const { issues, representationDeadline } = validateTrafficOrder(payload as any);
    setPreview(
      renderTrafficOrder(payload as any, {
        id: '',
        name: applicant.councilName,
        region: payload.region,
        representation: { email: applicant.representationEmail || applicant.councilEmail },
      } as any),
    );
    setIssues(issues);
    setRepresentationDeadline(representationDeadline);
  };

  return (
    <AppShell
      title="Publish a Notice"
      rail={<RightRail preview={preview} issues={issues} representationDeadline={representationDeadline} cost={49.99} />}
    >
      <div className="space-y-6">
        <ErrorSummary errors={issues} />
        <NoticeTypeSelect value={noticeType} onChange={setNoticeType} />
        <ApplicantPanel
          applicantName={applicant.applicantName}
          applicantEmail={applicant.applicantEmail}
          councilName={applicant.councilName}
          councilEmail={applicant.councilEmail}
          address={applicant.address}
          region={applicant.region}
          representationEmail={applicant.representationEmail}
          representationUrl={applicant.representationUrl}
          representationPostal={applicant.representationPostal}
          consultationDays={applicant.consultationDays}
          onPatch={patchApplicant}
          onSelectAddress={handleAddress}
        />
        {noticeType === 'premises' && (
          <PremisesForm onSubmit={handlePremisesSubmit} saving={false} autoFocusRef={autoFocusRef} />
        )}
        {noticeType === 'gvol' && (
          <GVOLForm onSubmit={handleGVOLSubmit} saving={false} autoFocusRef={autoFocusRef} />
        )}
        {noticeType === 'traffic' && (
          <TrafficForm onSubmit={handleTrafficSubmit} saving={false} autoFocusRef={autoFocusRef} />
        )}
      </div>
    </AppShell>
  );
}
