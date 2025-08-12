import React, { useMemo, useState } from 'react';
import { generateNotice } from '../../lib/noticeTemplate';

export type ApplicationType =
  | 'Grant of a Premises Licence'
  | 'Variation of a Premises Licence'
  | 'Minor Variation of a Premises Licence'
  | 'Grant of a Club Premises Certificate'
  | 'Variation of a Club Premises Certificate';

const applicationTypes: ApplicationType[] = [
  'Grant of a Premises Licence',
  'Variation of a Premises Licence',
  'Minor Variation of a Premises Licence',
  'Grant of a Club Premises Certificate',
  'Variation of a Club Premises Certificate',
];

const activityOptions = [
  'On and Off Sale of Alcohol',
  'On Sale of Alcohol',
  'Off Sale of Alcohol',
  'Provision of Late Night Refreshment',
  'Live Music',
  'Recorded Music',
  'Performance of Dance',
  'Anything of a Similar Description',
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Hours {
  [day: string]: { start: string; end: string };
}

interface FormData {
  applicationType: ApplicationType;
  premisesName: string;
  premisesAddress: string;
  applicantName: string;
  councilName: string;
  councilPostalAddress: string;
  councilOfficeHours: string;
  councilApplicationsUrl: string;
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

export function WeeklyHoursInput({
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

  function setEveryDay(field: 'start' | 'end', val: string) {
    const updated: Hours = { ...value };
    days.forEach((d) => {
      updated[d] = { ...updated[d], [field]: val };
    });
    onChange(updated);
  }

  return (
    <div className="space-y-1">
      {label && <p className="font-medium">{label}</p>}
      <table className="w-full text-sm">
        <tbody>
          <tr className="odd:bg-slate-50">
            <td className="pr-2 py-1 w-16">Every Day</td>
            <td className="pr-2">
              <input
                type="time"
                onChange={(e) => setEveryDay('start', e.target.value)}
                className="w-full border rounded p-1"
              />
            </td>
            <td>
              <input
                type="time"
                onChange={(e) => setEveryDay('end', e.target.value)}
                className="w-full border rounded p-1"
              />
            </td>
          </tr>
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


export default function PremisesForm({ onSubmit, saving, autoFocusRef }: Props) {
  const [form, setForm] = useState<FormData>({
    applicationType: 'Grant of a Premises Licence',
    premisesName: '',
    premisesAddress: '',
    applicantName: '',
    councilName: '',
    councilPostalAddress: '',
    councilOfficeHours: '',
    councilApplicationsUrl: '',
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
  const alcoholSelected = form.activities.some((a) => a.includes('Sale of Alcohol'));
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
    try {
      return generateNotice(form);
    } catch (e) {
      return (e as Error).message;
    }
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
            id="representationDeadline"
            name="representationDeadline"
            value={form.representationDeadline}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="councilPostalAddress">
            Council postal address
          </label>
          <input
            id="councilPostalAddress"
            name="councilPostalAddress"
            value={form.councilPostalAddress}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="councilOfficeHours">
            Council office hours
          </label>
          <input
            id="councilOfficeHours"
            name="councilOfficeHours"
            value={form.councilOfficeHours}
            onChange={handleChange}
            className="w-full rounded border border-slate-300 p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="councilApplicationsUrl">
            Council applications URL
          </label>
          <input
            id="councilApplicationsUrl"
            name="councilApplicationsUrl"
            value={form.councilApplicationsUrl}
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

