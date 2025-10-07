import React, { useEffect, useState } from 'react';
import AddressAutocomplete, { type AddressOption } from '@/components/AddressAutocomplete';
import UploadDropzone from '@/components/publish/UploadDropzone';
import ActivitiesHours, {
  type ActivityGroup,
  type ActivityHours,
  type DayKey,
} from '@/components/notice/ActivitiesHours';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import { listAuthorityPacks, type AuthorityPack } from '@/lib/authorityPacks';
/* CN:FIX-START */
/* CN:STEP2-COMPLIANCE-UPGRADE-START */
import { getAuthorityByName, emailDomainMatchesAuthority } from '@/lib/authorities';
import { formatDisplayDateTime } from '@/lib/format';
/* CN:STEP2-COMPLIANCE-UPGRADE-END */
/* CN:FIX-END */
import * as UI from '@/styles/ui';
import { fetchAddressDetail, mapDetail } from '@/lib/addressLookup';
import { extractUKPostcode, formatUKPostcode } from '@/lib/ukPostcode';

type Props = {
  value: any;
  onChange: (next: any) => void;
  onAuthorityChange?: (pack: AuthorityPack | null) => void;
  saving?: boolean;
  autoFocusRef?: React.RefObject<HTMLInputElement | null>;
  /* CN:FIX-START */
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  representationDeadline?: string;
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  /* CN:FIX-END */
};

const inputClass = UI.input;

// extend AddressOption so we can safely read uprn
type AddressWithUPRN = AddressOption & { uprn?: string };

const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GROUP_LABELS: Record<string, string> = {
  alcohol_on: 'Sale of alcohol (on premises)',
  alcohol_off: 'Sale of alcohol (off premises)',
  alcohol_on_off: 'Sale of alcohol (on & off premises)',
  late_refreshment: 'Late-night refreshment',
  live_music: 'Live music',
  recorded_music: 'Recorded music',
};

function createEmptyHours(): ActivityHours {
  return DAY_KEYS.reduce<ActivityHours>((acc, day) => {
    acc[day] = { open: null, close: null, lateIntoNextDay: false };
    return acc;
  }, {} as ActivityHours);
}

const DEFAULT_ACTIVITY_GROUPS: ActivityGroup[] = Object.entries(GROUP_LABELS).map(([id, label]) => ({
  id,
  label,
  enabled: true,
  hours: createEmptyHours(),
}));

export default function PremisesForm({
  value,
  onChange,
  saving = false,
  autoFocusRef,
  onAuthorityChange,
  /* CN:STEP2-COMPLIANCE-UPGRADE-START */
  representationDeadline,
  /* CN:STEP2-COMPLIANCE-UPGRADE-END */
}: Props) {
  const [form, setForm] = useState<any>({
    applicantName: '',
    applicantAddress: '',
    applicantCity: '',
    applicantPostcode: '',
    applicantUprn: undefined as string | undefined,
    councilPack: '',
    councilEmail: '',
    premisesName: '',
    premisesAddress: '',
    city: '',
    postcode: '',
    uprn: undefined as string | undefined,
    applicationDate: '',
    activities: [] as any[],
    /* CN:STEP2-COMPLIANCE-UPGRADE-START */
    applicationSummary: '',
    ocrTextPresent: false,
    /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  });
  const [prefilled, setPrefilled] = useState(false);
  const [errors] = useState<ErrorItem[]>([]);
  const [pack, setPack] = useState<AuthorityPack | null>(null);
  const [override, setOverride] = useState(false);
  const premisesSelectionIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    autoFocusRef?.current?.focus();
  }, [autoFocusRef]);

  useEffect(() => {
    if (value && typeof value === 'object') {
      setForm((f: any) => ({
        ...f,
        ...value,
      }));
    }
  }, [value]);

  function selectPack(id: string) {
    const p = listAuthorityPacks().find((a) => a.id === id) || null;
    setPack(p);
    setForm((f: any) => ({ ...f, councilPack: id, councilEmail: p?.representation.email || '' }));
    setOverride(false);
    onAuthorityChange?.(p);
    onChange({
      ...form,
      councilPack: id,
      councilName: p?.name || '',
      councilEmail: p?.representation.email || '',
      region: (p?.region as any) || form.region,
    });
  }

  function setField(key: string, v: any) {
    setForm((f: any) => ({ ...f, [key]: v }));
    if (key === 'councilEmail' && pack) setOverride(v !== pack.representation.email);
    onChange({ ...form, [key]: v });
  }

  function onAddressSelect(a: AddressWithUPRN) {
    const suggestionLabel = a.label || a.line1 || '';
    const fallbackPostcode = formatUKPostcode(
      a.postcode || extractUKPostcode(suggestionLabel) || ''
    );
    const base = {
      ...form,
      premisesAddress: suggestionLabel,
      city: a.city || a.town || form.city || '',
      postcode: fallbackPostcode,
      uprn: a.uprn,
    };
    premisesSelectionIdRef.current = a.id ?? null;
    setForm(base);
    onChange(base);

    if (!a.id) return;

    const selectionId = a.id;
    void fetchAddressDetail(selectionId)
      .then((json) => {
        if (premisesSelectionIdRef.current !== selectionId) return;
        const detail = mapDetail(json);
        const formatted = detail.label || suggestionLabel;
        const postcode = formatUKPostcode(
          detail.postcode || fallbackPostcode || extractUKPostcode(formatted) || ''
        );
        const next = {
          ...base,
          premisesAddress: formatted,
          city: detail.town || base.city,
          postcode,
        };
        setForm(next);
        onChange(next);
      })
      .catch(() => {
        // fall back to suggestion values; nothing else to do
      });
  }

  function onApplicantAddressSelect(a: AddressWithUPRN) {
    const next = {
      ...form,
      applicantAddress: a.line1 || '',
      applicantCity: a.city || a.town || '',
      applicantPostcode: a.postcode || '',
      applicantUprn: a.uprn,
    };
    setForm(next);
    onChange(next);
  }

  function prefillFromText(t: string) {
    const nameMatch = t.match(/by\s+([^\n]+?)\s+of/i);
    if (nameMatch) setField('applicantName', nameMatch[1].trim());
    const addrMatch = t.match(/by[^\n]+? of ([^\n]+?) to/i);
    if (addrMatch) setField('applicantAddress', addrMatch[1].trim());
    const dateMatch = t.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) setField('applicationDate', dateMatch[1]);
      const premMatch = t.match(/Premises Licence at\s+([^.\n]+)/i);
    if (premMatch) setField('premisesAddress', premMatch[1].trim());
    /* CN:STEP2-COMPLIANCE-UPGRADE-START */
    // track whether OCR text is present for conditional validation
    const present = !!t && t.trim().length > 0;
    setForm((f: any) => ({ ...f, ocrTextPresent: present }));
    onChange({ ...form, ocrTextPresent: present });
    /* CN:STEP2-COMPLIANCE-UPGRADE-END */
  }

  const packs = listAuthorityPacks();

  return (
    <form className="space-y-6">
      <ErrorSummary errors={errors} />
      <UploadDropzone
        onText={(t) => {
          prefillFromText(t);
          setPrefilled(true);
        }}
      />
      {prefilled && (
        <div className="rounded-2xl bg-brand-lilac text-brand-navy ring-1 ring-brand-blue/20 p-2 text-sm">
          Fields prefilled from upload — please verify
        </div>
      )}

      <section className={UI.section}>
        <h2 className="text-lg font-medium">Applicant &amp; Council</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="applicantName" className={UI.label}>
              Applicant name
            </label>
            <input
              id="applicantName"
              ref={autoFocusRef as any}
              value={form.applicantName || ''}
              onChange={(e) => setField('applicantName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2" id="applicantAddressLine1">
            <AddressAutocomplete label="Applicant address" onSelect={onApplicantAddressSelect} />
          </div>
          <div>
            <label htmlFor="councilName" className={UI.label}>
              Council
            </label>
            <select
              id="councilName"
              value={form.councilPack || ''}
              onChange={(e) => selectPack(e.target.value)}
              className={inputClass}
            >
              <option value="">Select council</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label htmlFor="councilEmail" className={UI.label}>
              Council email
            </label>
            <input
              id="councilEmail"
              value={form.councilEmail || ''}
              onChange={(e) => setField('councilEmail', e.target.value)}
              className={inputClass + ' w-full'} // fixed: use inputClass not UI.input
            />
            {form.councilEmail && (
              <p className="mt-1 text-xs text-emerald-700">✅ Proof will be sent to {form.councilEmail}</p>
            )}
            {pack && (
              <p className="mt-1 text-xs text-brand-slate">
                Council contact:{' '}
                {pack.representation.email ||
                  pack.representation.portal ||
                  pack.representation.postal}
                {override && <span className="ml-1 text-amber-700">Overrides applied</span>}
              </p>
            )}
            {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
            {(() => {
              const auth = getAuthorityByName((pack?.name as string) || (value?.councilName as string));
              const showWarn = !!form.councilEmail && !emailDomainMatchesAuthority(form.councilEmail, auth);
              const authorityEmail = auth?.repsEmail || pack?.representation.email || '';
              const focusAndFlash = (id: string) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (el as HTMLInputElement | HTMLTextAreaElement)?.focus?.();
                el.classList.add('outline','outline-2','outline-blue-300');
                setTimeout(() => el.classList.remove('outline','outline-2','outline-blue-300'), 700);
              };
              if (!showWarn) return null;
              return (
                <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-900">
                  The email domain doesn’t match the selected authority. Update the council email or proceed.
                  <div className="mt-2 flex flex-wrap gap-2">
                    {authorityEmail && (
                      <button
                        type="button"
                        className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                        onClick={() => { setField('councilEmail', authorityEmail); focusAndFlash('councilEmail'); }}
                      >
                        Use authority email
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${UI.btnSecondary} py-1 px-2 text-xs`}
                      onClick={() => focusAndFlash('councilEmail')}
                    >
                      Change
                    </button>
                    <a
                      href="#"
                      className="inline-flex items-center rounded-xl border border-[rgba(25,38,80,0.10)] px-2 py-1 text-xs text-[#192650] hover:border-[rgba(25,38,80,0.20)]"
                      title="Edit council details"
                    >
                      Edit council details
                    </a>
                  </div>
                </div>
              );
            })()}
            {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
          </div>
        </div>
      </section>

      <section className={UI.section}>
        <div className={UI.h2}>Application basics</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label htmlFor="premisesName" className={UI.label}>
              Premises name
            </label>
            <input
              id="premisesName"
              value={form.premisesName || ''}
              onChange={(e) => setField('premisesName', e.target.value)}
              className={inputClass + ' w-full'}
            />
          </div>
          <div className="col-span-2" id="premisesAddressLine1">
            <AddressAutocomplete label="Premises address" onSelect={onAddressSelect} />
          </div>
          <div>
            <label htmlFor="applicationDate" className={UI.label}>
              Application date
            </label>
            <input
              id="applicationDate"
              type="date"
              value={form.applicationDate || ''}
              onChange={(e) => setField('applicationDate', e.target.value)}
              className={inputClass}
            />
          </div>
          {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
          <div>
            <label htmlFor="representationDeadline" className={UI.label}>
              Representation deadline
            </label>
            <input
              id="representationDeadline"
              className="h-11 w-full rounded-lg border border-[rgba(25,38,80,0.12)] bg-neutral-50 px-3 text-[15px] text-neutral-700"
              value={representationDeadline ? `${formatDisplayDateTime(representationDeadline)} (24h)` : '—'}
              readOnly
              aria-readonly="true"
              aria-describedby="representationDeadline-help"
            />
            <p id="representationDeadline-help" className="mt-1 min-h-5 text-xs text-neutral-500">
              Auto-calculated 28 calendar days after submission.
            </p>
          </div>
          {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}
        </div>
      </section>

      {/* CN:STEP2-COMPLIANCE-UPGRADE-START */}
      <section className={UI.section}>
        <div className={UI.h3}>Application summary</div>
        <div>
          <label htmlFor="applicationSummary" className={UI.label}>
            Licensable activities and hours
          </label>
          <textarea
            id="applicationSummary"
            name="applicationSummary"
            rows={3}
            maxLength={1500}
            className={`${UI.input} w-full min-h-[96px]`}
            value={form.applicationSummary || ''}
            onChange={(e) => setField('applicationSummary', e.target.value)}
            aria-describedby="applicationSummary-help"
          />
          <p id="applicationSummary-help" className="mt-1 min-h-5 text-xs text-neutral-500">
            Licensable activities and hours (e.g., Sale of alcohol on/off 10:00–23:00 daily; recorded music 10:00–23:00).
          </p>
        </div>
      </section>
      {/* CN:STEP2-COMPLIANCE-UPGRADE-END */}

      <section className={UI.section}>
        <div
          id="activities-grid"
          data-testid="activities-grid"
          className="space-y-4"
          tabIndex={-1}
        >
          <h2 className={UI.h2}>Activities &amp; hours</h2>
          <ActivitiesHours
            persistKey="publish.activitiesHours"
            defaultGroups={DEFAULT_ACTIVITY_GROUPS}
          />
        </div>
      </section>
    </form>
  );
}
