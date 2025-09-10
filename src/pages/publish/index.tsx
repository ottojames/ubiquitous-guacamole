import { useEffect, useMemo, useState } from 'react';
import type { AddressOption } from '@/components/AddressAutocomplete';
import AppShell from '@/components/publish/AppShell';
import ApplicantPanel from '@/components/publish/ApplicantPanel';
import ApplicationBasics, { type ApplicationBasicsValue } from '@/components/publish/ApplicationBasics';
import ActivitiesHoursGrid, { type GridRow, defaultGrid } from '@/components/publish/ActivitiesHoursGrid';
import Checklist from '@/components/publish/Checklist';
import PublishNoticePreview from '@/components/publish/NoticePreview';
import UploadDropzone from '@/components/publish/UploadDropzone';
import { type PremisesData } from '@/schemas/premises';
import { runCompliance } from '@/lib/compliance/engine';
import { premisesRules } from '@/lib/compliance/premisesRules';

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
  const [basics, setBasics] = useState<ApplicationBasicsValue>({
    applicationType: 'grant',
    premisesTradingName: '',
    applicationDate: new Date().toISOString().slice(0,10),
    representationDeadline: new Date(Date.now() + 29*24*60*60*1000).toISOString().slice(0,10),
    region: 'EW',
  });
  const [grid, setGrid] = useState<GridRow[]>(defaultGrid());
  const [currentStep, setCurrentStep] = useState<number>(0);
  const steps = ['Upload & OCR','Applicant','Details','Activities'] as const;
  const [mode, setMode] = useState<'guided'|'expert'>('expert');
  const [noticeType, setNoticeType] = useState<'premises' | 'traffic' | 'gambling' | 'planning' | 'gvol' | 'probate'>('premises');

  useEffect(() => {
    const raw = localStorage.getItem('publishDraft');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setForm(parsed.form || form);
        setBasics(parsed.basics || basics);
        setGrid(parsed.grid || defaultGrid());
        setPreviewText(parsed.previewText || "");
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const payload = { form, basics, grid, previewText };
    localStorage.setItem('publishDraft', JSON.stringify(payload));
  }, [form, basics, grid, previewText]);

  const handleAddress = (a: AddressOption) => {
    const anyA = a as any;
    const line1 = anyA.line1 ?? anyA.lines?.[0] ?? '';
    const line2 = anyA.line2 ?? anyA.lines?.[1] ?? '';
    const line3 = anyA.line3 ?? anyA.lines?.[2] ?? '';
    const city = anyA.city ?? anyA.town ?? '';
    const postcode = anyA.postcode ?? '';
    setForm((f) => ({ ...f, premisesAddress: { line1, line2, line3, city, postcode } }));
  };

  const gridToActivities = (rows: GridRow[]): PremisesData['activities'] => {
    const acts: any[] = [];
    rows.forEach((r) => {
      (Object.keys(r.hours) as (keyof typeof r.hours)[]).forEach((day) => {
        const h = r.hours[day];
        if (h && h.start && h.end) {
          acts.push({ type: r.activity, days: [day], start: h.start, end: h.end });
        }
      });
    });
    return acts;
  };

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
    activities: gridToActivities(grid) as any,
  };

  const checklist = useMemo(() => runCompliance(assembled, premisesRules).map(r => ({
    id: r.id,
    label: r.message,
    ok: r.ok,
    target: r.anchor,
    severity: r.severity,
    rationale: r.rationale,
  })), [assembled]);

  const disabled = publishing || checklist.some(i => !i.ok);

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
    } catch { } finally {
      setPublishing(false);
    }
  };

  const handleFix = (target?: string) => {
    const el = target ? document.getElementById(target) : null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el?.querySelector('input,select,textarea,button,[tabindex]') as HTMLElement | null)?.focus?.();
  };

  return (
    <AppShell
      title="Publish a Notice"
      steps={mode === 'guided' ? steps : []}
      currentStep={currentStep}
      onStepChange={(i) => i <= currentStep && setCurrentStep(i)}
      rail={
        <div className="sticky top-6 space-y-4">
          <PublishNoticePreview text={previewText} />
          <Checklist items={checklist} onFix={handleFix} />
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 shadow-inner space-y-1">
            <div className="font-medium">Key dates</div>
            <div>Application: {basics.applicationDate || '—'}</div>
            <div>Deadline: {basics.representationDeadline || '—'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 shadow-inner">
            <div className="font-medium mb-1">Cost</div>
            <div>£199 – notice, proof & hosting</div>
          </div>
        </div>
      }
      footer={
        <>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600 flex-1">
              {disabled ? 'Complete required fields to continue' : 'Ready to publish'}
            </div>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
            >
              Copy link
            </button>
            <button
              data-testid="publish-btn"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              disabled={disabled}
              onClick={handlePublish}
            >
              {publishing ? 'Publishing…' : 'Continue to Payment'}
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
          <div className="text-sm">
            <label className="mr-2">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="rounded border-slate-300"
            >
              <option value="guided">Guided</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {(mode === 'expert' || currentStep === 0) && (
          <UploadDropzone
            onText={(t) => setPreviewText(t)}
            onMeta={(m) => setMeta(m)}
          />
        )}

        {(mode === 'expert' || currentStep === 1) && (
          <div id="applicant-section" className="[&>div>div:last-child]:hidden">
            <ApplicantPanel
              applicantName={form.applicantName}
              applicantEmail={form.applicantEmail}
              councilName={form.councilName}
              councilEmail={form.councilEmail}
              address={form.premisesAddress}
              onPatch={(patch) => setForm((f) => ({ ...f, ...(patch as any) }))}
              onSelectAddress={handleAddress}
            />
          </div>
        )}

        {(mode === 'expert' || currentStep === 2) && (
          <div id="basics-section">
            <ApplicationBasics value={basics} onChange={setBasics} />
          </div>
        )}

        {(mode === 'expert' || currentStep === 3) && (
          <div id="activities-section">
            <ActivitiesHoursGrid value={grid} onChange={setGrid} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
