import { useMemo, useState } from 'react';
import type { AddressOption } from '@/components/AddressAutocomplete';
import AppShell from '@/components/publish/AppShell';
import ApplicantPanel from '@/components/publish/ApplicantPanel';
import ApplicationBasics, { type ApplicationBasicsValue } from '@/components/publish/ApplicationBasics';
import ActivitiesHours, { type ActivityRow } from '@/components/publish/ActivitiesHours';
import Checklist, { type ChecklistItem } from '@/components/publish/Checklist';
import PublishNoticePreview from '@/components/publish/NoticePreview';
import UploadDropzone from '@/components/publish/UploadDropzone';
import { type PremisesData } from '@/schemas/premises';

export default function PublishPage() {
  const [previewText, setPreviewText] = useState("");
  const [meta, setMeta] = useState<any>({});
  const [publishing, setPublishing] = useState(false);

  const [form, setForm] = useState({
    applicantName: "",
    applicantEmail: "",
    councilName: "",
    councilEmail: "",
    premisesAddress: { line1: "", line2: "", line3: "", city: "", postcode: "" },
  });
  const steps = ['Upload & OCR', 'Applicant', 'Details', 'Review'] as const;
  const [currentStep, setCurrentStep] = useState<number>(0);
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
  const checklist: ChecklistItem[] = useMemo(() => [
    { id: 'applicant', label: 'Applicant name required', ok: !!assembled.applicantName?.trim(), target: 'applicant-section' },
    { id: 'council', label: 'Council and reps contact required', ok: !!(assembled.councilId && assembled.councilEmail), target: 'applicant-section' },
    { id: 'address', label: 'Trading name and full address required', ok: !!(assembled.premisesTradingName && assembled.address?.line1 && assembled.address?.postcode && assembled.address?.city), target: 'basics-section' },
    { id: 'type', label: 'Application type required', ok: !!assembled.applicationType, target: 'basics-section' },
    { id: 'deadline', label: 'Representation deadline required', ok: !!assembled.representationDeadline, target: 'basics-section' },
    { id: 'activities', label: 'List at least one licensable activity', ok: (assembled.activities || []).length > 0, target: 'activities-section' },
  ], [assembled]);
  const disabled = publishing || checklist.some((i) => !i.ok);

  const handleFix = (target?: string) => {
    const el = target ? document.getElementById(target) : null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
  };

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
        noticeText: previewText,
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


  return (
    <AppShell
      title="Publish a Notice"
      steps={steps}
      currentStep={currentStep}
      onStepChange={(i) => i <= currentStep && setCurrentStep(i)}
      rail={(
        <div className="sticky top-6 space-y-4">
          <PublishNoticePreview text={previewText} />
          <Checklist items={checklist} onFix={handleFix} />
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 shadow-inner">
            <div><span className="font-medium">Applicant:</span> {form.applicantName || '—'}</div>
            <div><span className="font-medium">Email:</span> {form.applicantEmail || '—'}</div>
            <div><span className="font-medium">Council:</span> {form.councilName || '—'}</div>
            <div><span className="font-medium">Council email:</span> {form.councilEmail || '—'}</div>
          </div>
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

        <UploadDropzone
          onText={(t) => {
            setPreviewText(t);
          }}
          onMeta={(m) => setMeta(m)}
        />

        <div id="applicant-section" className="[&>div>div:last-child]:hidden">
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

        <div id="basics-section">
          <ApplicationBasics value={basics} onChange={setBasics} />
        </div>

        <div id="activities-section">
          <ActivitiesHours rows={activities} onChange={setActivities} />
        </div>
      </div>
    </AppShell>
  );
}
