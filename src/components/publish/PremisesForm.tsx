import React, { useMemo, useState } from 'react';

export type ApplicationType =
  | 'New Premises Licence'
  | 'Variation of Premises Licence'
  | 'Minor Variation'
  | 'Club Premises Certificate (new)'
  | 'Variation of Club Premises Certificate';

const applicationTypes: ApplicationType[] = [
  'New Premises Licence',
  'Variation of Premises Licence',
  'Minor Variation',
  'Club Premises Certificate (new)',
  'Variation of Club Premises Certificate',
];

const activityOptions = [
  'Sale of alcohol (on premises)',
  'Sale of alcohol (off premises)',
  'Sale of alcohol (on & off)',
  'Provision of late-night refreshment',
  'Live music',
  'Recorded music',
  'Performance of dance',
  'Anything of a similar description',
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Hours {
  [day: string]: { start: string; end: string };
}

interface FormData {
  applicationType: ApplicationType;
  premisesName: string;
  premisesAddress: string;
  postcode: string;
  applicantName: string;
  councilName: string;
  inspectionMethod: string;
  representationMethod: string;
  representationDeadline: string;
  reference: string;

  activities: string[];
  activityHours: Record<string, Hours>;
  openingHours: Hours;

  applicantEmail: string;
  applicantPhone: string;
  licenceNumber: string;
  existingHours: string;
  dpsDetails: string;
  floorPlan?: File | null;
  operatingSchedule: string;
  paymentConfirmed: boolean;
  variationSummary: string;
  clubRules: string;
  clubMembers: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void> | void;
  saving: boolean;
  autoFocusRef: React.RefObject<HTMLInputElement>;
}

function WeeklyHoursInput({
  value,
  onChange,
  label,
}: {
  value: Hours;
  onChange: (h: Hours) => void;
  label?: string;
}) {
  function setDay(day: string, field: 'start' | 'end', val: string) {
    onChange({ ...value, [day]: { ...value[day], [field]: val } });
  }

  return (
    <div className="space-y-1">
      {label && <p className="font-medium">{label}</p>}
      <table className="w-full text-sm">
        <tbody>
          {days.map((d) => (
            <tr key={d} className="odd:bg-slate-50">
              <td className="pr-2 py-1 w-16">{d}</td>
              <td className="pr-2">
                <input
                  type="time"
                  value={value[d]?.start || ''}
                  onChange={(e) => setDay(d, 'start', e.target.value)}
                  className="w-full border rounded p-1"
                />
              </td>
              <td>
                <input
                  type="time"
                  value={value[d]?.end || ''}
                  onChange={(e) => setDay(d, 'end', e.target.value)}
                  className="w-full border rounded p-1"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatHours(hours: Hours): string {
  const result: string[] = [];
  let i = 0;
  while (i < days.length) {
    const day = days[i];
    const h = hours[day];
    if (!h?.start || !h?.end) {
      i++;
      continue;
    }
    const start = h.start;
    const end = h.end;
    let j = i + 1;
    while (
      j < days.length &&
      hours[days[j]]?.start === start &&
      hours[days[j]]?.end === end
    ) {
      j++;
    }
    const label = i + 1 === j ? days[i] : `${days[i]}–${days[j - 1]}`;
    result.push(`${label}: ${start}–${end}`);
    i = j;
  }
  return result.join('\n');
}

const templates: Record<ApplicationType, string> = {
  'New Premises Licence': `APPLICATION FOR A {{APPLICATION_TYPE}}

{{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{APPLICATION_TYPE}} at:
{{PREMISES_NAME}}, {{PREMISES_ADDRESS}}, {{POSTCODE}}.

Licensable activities and hours:
{{ACTIVITY_HOURS_BLOCK}}

Opening hours:
{{OPENING_HOURS_BLOCK}}

Inspection of the application:
{{INSPECTION_METHOD}}

Representations:
Anyone wishing to make representations must do so by {{REPRESENTATION_DEADLINE}}.
{{REPRESENTATION_METHOD}}

(Representations must relate to the licensing objectives. It is an offence to knowingly or recklessly make a false statement in connection with an application.)`,
  'Variation of Premises Licence': `APPLICATION FOR A {{APPLICATION_TYPE}}

{{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{APPLICATION_TYPE}} at:
{{PREMISES_NAME}}, {{PREMISES_ADDRESS}}, {{POSTCODE}}.

Summary of proposed variation:
{{VARIATION_SUMMARY}}

Licensable activities and hours (as varied):
{{ACTIVITY_HOURS_BLOCK}}

Opening hours (as varied):
{{OPENING_HOURS_BLOCK}}

Inspection of the application:
{{INSPECTION_METHOD}}

Representations:
Anyone wishing to make representations must do so by {{REPRESENTATION_DEADLINE}}.
{{REPRESENTATION_METHOD}}

(Representations must relate to the licensing objectives. It is an offence to knowingly or recklessly make a false statement in connection with an application.)`,
  'Minor Variation': `APPLICATION FOR A {{APPLICATION_TYPE}}

{{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{APPLICATION_TYPE}} at:
{{PREMISES_NAME}}, {{PREMISES_ADDRESS}}, {{POSTCODE}}.

Brief description of the proposed minor changes:
{{VARIATION_SUMMARY}}

Licensable activities/hours affected (if applicable):
{{ACTIVITY_HOURS_BLOCK}}

Inspection of the application:
{{INSPECTION_METHOD}}

Comments/Representations:
Interested parties may submit comments by {{REPRESENTATION_DEADLINE}}.
{{REPRESENTATION_METHOD}}`,
  'Club Premises Certificate (new)': `APPLICATION FOR A {{APPLICATION_TYPE}}

{{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{APPLICATION_TYPE}} for:
{{PREMISES_NAME}}, {{PREMISES_ADDRESS}}, {{POSTCODE}}.

Qualifying club activities and hours:
{{ACTIVITY_HOURS_BLOCK}}

Opening hours (if applicable):
{{OPENING_HOURS_BLOCK}}

Inspection of the application:
{{INSPECTION_METHOD}}

Representations:
Anyone wishing to make representations must do so by {{REPRESENTATION_DEADLINE}}.
{{REPRESENTATION_METHOD}}

(Representations must relate to the licensing objectives. It is an offence to knowingly or recklessly make a false statement in connection with an application.)`,
  'Variation of Club Premises Certificate': `APPLICATION FOR A {{APPLICATION_TYPE}}

{{APPLICANT_NAME}} has applied to {{COUNCIL_NAME}} for a {{APPLICATION_TYPE}} for:
{{PREMISES_NAME}}, {{PREMISES_ADDRESS}}, {{POSTCODE}}.

Qualifying club activities and hours:
{{ACTIVITY_HOURS_BLOCK}}

Opening hours (if applicable):
{{OPENING_HOURS_BLOCK}}

Inspection of the application:
{{INSPECTION_METHOD}}

Representations:
Anyone wishing to make representations must do so by {{REPRESENTATION_DEADLINE}}.
{{REPRESENTATION_METHOD}}

(Representations must relate to the licensing objectives. It is an offence to knowingly or recklessly make a false statement in connection with an application.)`,
};

export default function PremisesForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [form, setForm] = useState<FormData>({
    applicationType: 'New Premises Licence',
    premisesName: '',
    premisesAddress: '',
    postcode: '',
    applicantName: '',
    councilName: '',
    inspectionMethod: '',
    representationMethod: '',
    representationDeadline: '',
    reference: '',
    activities: [],
    activityHours: {},
    openingHours: {},
    applicantEmail: '',
    applicantPhone: '',
    licenceNumber: '',
    existingHours: '',
    dpsDetails: '',
    operatingSchedule: '',
    paymentConfirmed: false,
    variationSummary: '',
    clubRules: '',
    clubMembers: '',
  });

  const isClub = form.applicationType.includes('Club');
  const isVariation = form.applicationType.includes('Variation');
  const alcoholSelected = form.activities.some((a) => a.startsWith('Sale of alcohol'));
  const needsDps = alcoholSelected && !isClub;

  function toggleActivity(a: string) {
    setForm((f) => {
      const activities = f.activities.includes(a)
        ? f.activities.filter((x) => x !== a)
        : [...f.activities, a];
      const activityHours = { ...f.activityHours };
      if (activities.includes(a) && !activityHours[a]) activityHours[a] = {};
      if (!activities.includes(a)) delete activityHours[a];
      return { ...f, activities, activityHours };
    });
  }

  function updateActivityHours(activity: string, hours: Hours) {
    setForm((f) => ({
      ...f,
      activityHours: { ...f.activityHours, [activity]: hours },
    }));
  }

  const noticeText = useMemo(() => {
    const activityBlock = form.activities
      .map((a) => `${a}\n${formatHours(form.activityHours[a] || {})}`)
      .join('\n\n');
    const opening = formatHours(form.openingHours);
    const template = templates[form.applicationType];
    return template
      .replace(/\{\{APPLICATION_TYPE\}\}/g, form.applicationType)
      .replace(/\{\{COUNCIL_NAME\}\}/g, form.councilName)
      .replace(/\{\{PREMISES_NAME\}\}/g, form.premisesName)
      .replace(/\{\{PREMISES_ADDRESS\}\}/g, form.premisesAddress)
      .replace(/\{\{POSTCODE\}\}/g, form.postcode)
      .replace(/\{\{APPLICANT_NAME\}\}/g, form.applicantName)
      .replace(/\{\{ACTIVITY_HOURS_BLOCK\}\}/g, activityBlock)
      .replace(/\{\{OPENING_HOURS_BLOCK\}\}/g, opening)
      .replace(/\{\{VARIATION_SUMMARY\}\}/g, form.variationSummary)
      .replace(/\{\{INSPECTION_METHOD\}\}/g, form.inspectionMethod)
      .replace(/\{\{REPRESENTATION_METHOD\}\}/g, form.representationMethod)
      .replace(/\{\{REPRESENTATION_DEADLINE\}\}/g, form.representationDeadline)
      .replace(/\{\{REFERENCE\}\}/g, form.reference);
  }, [form]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-6" aria-describedby="premises-desc">
      <p id="premises-desc" className="sr-only">
        Premises Licence application form
      </p>

      <div className="space-y-2">
        <label htmlFor="applicationType" className="block text-sm font-medium text-slate-700">
          Application type
        </label>
        <select
          id="applicationType"
          name="applicationType"
          value={form.applicationType}
          onChange={handleChange}
          ref={autoFocusRef}
          className="w-full rounded border border-slate-300 p-2 bg-white"
        >
          {applicationTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="premisesName">
            Premises name
          </label>
          <input
            id="premisesName"
            name="premisesName"
            value={form.premisesName}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="premisesAddress">
            Premises address
          </label>
          <input
            id="premisesAddress"
            name="premisesAddress"
            value={form.premisesAddress}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="postcode">
            Postcode
          </label>
          <input
            id="postcode"
            name="postcode"
            value={form.postcode}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="applicantName">
            Applicant name
          </label>
          <input
            id="applicantName"
            name="applicantName"
            value={form.applicantName}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="councilName">
            Council name
          </label>
          <input
            id="councilName"
            name="councilName"
            value={form.councilName}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="representationDeadline">
            Representation deadline
          </label>
          <input
            type="date"
            id="representationDeadline"
            name="representationDeadline"
            value={form.representationDeadline}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Licensable activities</p>
        {activityOptions.map((a) => (
          <label key={a} className="block">
            <input
              type="checkbox"
              className="mr-2"
              checked={form.activities.includes(a)}
              onChange={() => toggleActivity(a)}
            />
            {a}
          </label>
        ))}
      </div>

      {form.activities.map((a) => (
        <WeeklyHoursInput
          key={a}
          value={form.activityHours[a] || {}}
          onChange={(h) => updateActivityHours(a, h)}
          label={a}
        />
      ))}

      <WeeklyHoursInput
        value={form.openingHours}
        onChange={(h) => setForm((f) => ({ ...f, openingHours: h }))}
        label="Opening hours"
      />

      {isVariation && (
        <div className="space-y-2">
          <label htmlFor="variationSummary" className="block text-sm font-medium text-slate-700">
            Summary of proposed variation
          </label>
          <textarea
            id="variationSummary"
            name="variationSummary"
            value={form.variationSummary}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            rows={3}
          />
        </div>
      )}

      {needsDps && (
        <div className="space-y-2">
          <label htmlFor="dpsDetails" className="block text-sm font-medium text-slate-700">
            Designated Premises Supervisor (DPS) details
          </label>
          <textarea
            id="dpsDetails"
            name="dpsDetails"
            value={form.dpsDetails}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            rows={2}
          />
        </div>
      )}

      {isVariation && (
        <div className="space-y-2">
          <label htmlFor="existingHours" className="block text-sm font-medium text-slate-700">
            Existing licensed hours
          </label>
          <textarea
            id="existingHours"
            name="existingHours"
            value={form.existingHours}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            rows={2}
          />
        </div>
      )}

      {isVariation && (
        <div className="space-y-2">
          <label htmlFor="licenceNumber" className="block text-sm font-medium text-slate-700">
            Premises licence number
          </label>
          <input
            id="licenceNumber"
            name="licenceNumber"
            value={form.licenceNumber}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
          />
        </div>
      )}

      {isClub && (
        <div className="space-y-2">
          <label htmlFor="clubRules" className="block text-sm font-medium text-slate-700">
            Club rules & number of qualifying members
          </label>
          <textarea
            id="clubRules"
            name="clubRules"
            value={form.clubRules}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            rows={2}
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="inspectionMethod" className="block text-sm font-medium text-slate-700">
          Inspection of the application
        </label>
        <textarea
          id="inspectionMethod"
          name="inspectionMethod"
          value={form.inspectionMethod}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="representationMethod" className="block text-sm font-medium text-slate-700">
          Representation method
        </label>
        <textarea
          id="representationMethod"
          name="representationMethod"
          value={form.representationMethod}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reference" className="block text-sm font-medium text-slate-700">
          Reference (optional)
        </label>
        <input
          id="reference"
          name="reference"
          value={form.reference}
          onChange={handleChange}
          className="w-full rounded border border-slate-300 p-2"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Internal fields</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="applicantEmail">
              Applicant email
            </label>
            <input
              id="applicantEmail"
              name="applicantEmail"
              value={form.applicantEmail}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="applicantPhone">
              Applicant phone
            </label>
            <input
              id="applicantPhone"
              name="applicantPhone"
              value={form.applicantPhone}
              onChange={handleChange}
              className="w-full rounded border border-slate-300 p-2"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="operatingSchedule">
            Operating schedule
          </label>
          <textarea
            id="operatingSchedule"
            name="operatingSchedule"
            value={form.operatingSchedule}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            rows={2}
          />
        </div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="paymentConfirmed"
            checked={form.paymentConfirmed}
            onChange={handleChange}
          />
          <span>Payment confirmed</span>
        </label>
      </section>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="noticePreview">
          Generated Blue Notice
        </label>
        <textarea
          id="noticePreview"
          value={noticeText}
          readOnly
          className="w-full h-64 rounded border border-slate-300 p-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(noticeText)}
          className="px-3 py-2 text-sm rounded bg-slate-800 text-white"
        >
          Copy to Clipboard
        </button>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

