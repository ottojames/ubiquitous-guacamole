import { useMemo, useState } from 'react';
import type { AddressOption } from '@/components/AddressAutocomplete';
import AppShell from '@/components/publish/AppShell';
import ApplicantPanel from '@/components/publish/ApplicantPanel';
import ApplicationBasics, { type ApplicationBasicsValue } from '@/components/publish/ApplicationBasics';
import ActivitiesHours, { type ActivityRow } from '@/components/publish/ActivitiesHours';
import Checklist from '@/components/publish/ComplianceChecklist';
import NoticePreview from '@/components/publish/NoticePreview';
import UploadDropzone from '@/components/publish/UploadDropzone';
import { type PremisesData } from '@/schemas/premises';
import { renderPremisesNotice } from '@/lib/renderNotice';

export default function PublishPage() {
  const [noticeText, setNoticeText] = useState("");
  const [meta, setMeta] = useState<any>({});
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    applicantName: "",
    applicantEmail: "",
    councilName: "",
    councilEmail: "",
    premisesAddress: { line1: "", line2: "", line3: "", city: "", postcode: "" },
  });
  const steps = ['Type', 'Upload or Build', 'Applicant', 'Details', 'Preview & Publish'] as const;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [noticeType, setNoticeType] = useState<'premises' | 'traffic' | 'gambling' | 'planning' | 'gvol' | 'probate'>('premises');
  const [basics, setBasics] = useState<ApplicationBasicsValue>({
    applicationType: 'grant',
    premisesTradingName: '',
    applicationDate: new Date().toISOString().slice(0, 10),
    representationDeadline: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    region: 'EW',
  });
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [councilMeta, setCouncilMeta] = useState<{ officeAddress?: string; licensingUrl?: string; postalAddress?: string; repsEmail?: string; repsUrl?: string }>({});

  const assembled: PremisesData = {
    applicantName: form.applicantName || '',
    applicantEmail: form.applicantEmail || '',
    councilId: form.councilName || '',
    councilEmail: form.councilEmail || '',
    premisesTradingName: basics.premisesTradingName || '',
    address: {
      line1: form.premisesAddress.line1 || '',
      city: form.premisesAddress.city || '',
      postcode: form.premisesAddress.postcode || '',
    },
    applicationType: basics.applicationType,
    applicationDate: basics.applicationDate,
    representationDeadline: basics.representationDeadline,
    variationSummary: basics.variationSummary,
    activities: activities as any,
  };
  const issues = useMemo(() => {
    const errs: string[] = [];
    if (!assembled.applicantName?.trim()) errs.push('Applicant name is required');
    if (!(assembled.councilId && assembled.councilEmail)) errs.push('Council and reps contact required');
    if (!(assembled.premisesTradingName && assembled.address?.line1 && assembled.address?.postcode && assembled.address?.city)) errs.push('Trading name and full address required');
    if (!assembled.applicationType) errs.push('Application type required');
    if (!assembled.representationDeadline) errs.push('Representation deadline required');
    if (!((assembled.activities || []).length > 0)) errs.push('List at least one licensable activity');
    return errs;
  }, [assembled]);
  const disabled = publishing || issues.length > 0;

  const handlePublish = async () => {
    if (disabled) return;
    setPublishing(true);
    try {
      const payload = {
        applicantName: form.applicantName,
        applicantEmail: form.applicantEmail,
        councilName: form.councilName,
        councilEmail: form.councilEmail,
        premisesAddress: form.premisesAddress,
        noticeText,
        source: 'upload',
        meta,
      };
      await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore in this simplified implementation
    } finally {
      setPublishing(false);
    }
  };

  const handleAddress = (a: AddressOption) => {
    const anyA = a as any;
    const line1 = anyA.line1 ?? anyA.lines?.[0] ?? '';
    const line2 = anyA.line2 ?? anyA.lines?.[1] ?? '';
    const line3 = anyA.line3 ?? anyA.lines?.[2] ?? '';
    const city = anyA.city ?? anyA.town ?? '';
    const postcode = anyA.postcode ?? '';
    setForm((f) => ({ ...f, premisesAddress: { line1, line2, line3, city, postcode } }));
  };

  const onFix = () => {
    const el = document.querySelector('[data-error="true"]') as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
  };

  return (
    <AppShell
      title="Publish a Notice"
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      rail={(
        <div className="sticky top-6 space-y-4">
          <ApplicantPanel
            applicantName={form.applicantName}
            applicantEmail={form.applicantEmail}
            councilName={form.councilName}
            councilEmail={form.councilEmail}
            address={form.premisesAddress}
            onPatch={(patch) => setForm((f) => ({ ...f, ...(patch as any) }))}
            onSelectAddress={handleAddress}
            onCouncilMeta={(meta) => setCouncilMeta({
              officeAddress: (meta as any).officeAddress,
              licensingUrl: (meta as any).licensingUrl,
              postalAddress: (meta as any).postalAddress || (meta as any).postal,
              repsEmail: (meta as any).repsEmail,
              repsUrl: (meta as any).repsUrl,
            })}
          />
        </div>
      )}
      footer={(
        <>
          <div className="text-sm text-slate-600">{disabled ? 'Complete required fields to continue' : 'Ready to publish'}</div>
          <button
            data-testid="publish-btn"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            disabled={disabled}
            onClick={handlePublish}
          >
            {publishing ? 'Publishing…' : 'Continue to Payment'}
          </button>
        </>
      )}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Notice Type</label>
          <select
            className="w-full rounded-lg border-slate-300"
            value={noticeType}
            onChange={(e) => setNoticeType(e.target.value as any)}
          >
            <option value="premises">Premises Licence</option>
            <option value="traffic">Traffic Order</option>
            <option value="gambling">Gambling Licence</option>
            <option value="planning">Planning</option>
            <option value="gvol">Goods Vehicle Operator</option>
            <option value="probate">Probate</option>
          </select>
        </div>

        <UploadDropzone onText={(t) => setNoticeText(t)} onMeta={(m) => setMeta(m)} />

        <ApplicationBasics value={basics} onChange={setBasics} />
        <ActivitiesHours rows={activities} onChange={setActivities} />
        <Checklist issues={issues} onFix={onFix} />
        <NoticePreview text={renderPremisesNotice({
          ...assembled,
          councilName: form.councilName || 'Council',
          officeAddress: councilMeta.officeAddress,
          licensingUrl: councilMeta.licensingUrl,
          postalAddress: councilMeta.postalAddress,
          repsEmail: councilMeta.repsEmail,
          repsUrl: councilMeta.repsUrl,
          region: basics.region,
        })} />
      </div>
    </AppShell>
  );
}
