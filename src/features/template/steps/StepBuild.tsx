import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import * as UI from '@/styles/ui';
import ErrorSummary, { type ErrorItem } from '@/components/publish/ErrorSummary';
import ActivitiesHours, {
  type ActivityGroup,
  type ActivityHours,
  type DayKey,
} from '@/components/notice/ActivitiesHours';
import AddressPicker from '../components/AddressPicker';
import CouncilContactAuto from '../components/CouncilContactAuto';
import InlineHelp from '../components/InlineHelp';
import InfoTooltip from '../components/InfoTooltip';
import {
  TemplateNoticeSchema,
  createEmptyNotice,
  calculateRepresentationDeadline,
  DefaultWeekHours,
} from '../schema';
import {
  useTemplateBuilder,
  useTemplateNotice,
  useTemplateStep,
} from '../TemplateBuilderProvider';
import type {
  Activities,
  ActivityKey,
  AddressValue,
  DeclEditMeta,
  TemplateNotice,
  WeekHours,
} from '../types';
import { readProfilePrefill, trackTemplateEvent } from '../telemetry';

const CONDITION_SNIPPETS = [
  'Doors and windows closed after 23:00 except for access/egress.',
  'CCTV covering entry/exit retained for 31 days.',
  'Challenge 25 policy in operation.',
];

const ADDRESS_HINT: Record<TemplateNotice['applicantAddressType'], string> = {
  registeredOffice: 'We will show the registered office exactly as entered above on the notice.',
  homeAddress: 'We will show the applicant\'s home address on the notice.',
};

function flattenErrors(errors: any, path: string[] = []): ErrorItem[] {
  if (!errors) return [];
  if (errors.message) {
    return [{ field: path.join('-') || 'field', message: errors.message }];
  }
  if (typeof errors !== 'object') return [];
  return Object.entries(errors).flatMap(([key, value]) => flattenErrors(value, [...path, key]));
}

function mapAddressErrors(error: unknown): Partial<Record<keyof AddressValue, string>> {
  if (!error || typeof error !== 'object') return {};
  const output: Partial<Record<keyof AddressValue, string>> = {};
  for (const key of ['line1', 'line2', 'town', 'postcode'] as const) {
    const field = (error as Record<string, any>)[key];
    if (field?.message) {
      output[key] = field.message as string;
    }
  }
  return output;
}

function normaliseProfileAddress(address: any): AddressValue | null {
  if (!address || typeof address !== 'object') return null;
  const line1 = typeof address.line1 === 'string' ? address.line1 : '';
  const town = typeof address.town === 'string' ? address.town : '';
  const postcode = typeof address.postcode === 'string' ? address.postcode : '';
  const line2 = typeof address.line2 === 'string' ? address.line2 : '';
  if (!line1 && !town && !postcode) return null;
  return { line1, town, postcode, line2 };
}

function formatDeadlineDisplay(iso: string): string {
  if (!iso) return '';
  const parsed = dayjs(iso);
  if (!parsed.isValid()) return '';
  return parsed.format('D MMMM YYYY');
}

const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_TO_WEEK_KEY: Record<DayKey, keyof WeekHours> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

const TEMPLATE_ACTIVITY_DEFINITIONS: Array<{ id: string; label: string; key: ActivityKey }> = [
  { id: 'alcohol_on', label: 'Sale of alcohol (on-sales)', key: 'alcoholOn' },
  { id: 'alcohol_off', label: 'Sale of alcohol (off-sales)', key: 'alcoholOff' },
  { id: 'late_refreshment', label: 'Late night refreshment', key: 'lateRefreshment' },
  { id: 'live_music', label: 'Live music', key: 'liveMusic' },
  { id: 'recorded_music', label: 'Recorded music', key: 'recordedMusic' },
  { id: 'dance', label: 'Performance of dance', key: 'dance' },
  { id: 'similar', label: 'Anything of a similar description', key: 'similar' },
];

function createEmptyActivityHours(): ActivityHours {
  return DAY_KEYS.reduce<ActivityHours>((acc, day) => {
    acc[day] = { open: null, close: null, lateIntoNextDay: false };
    return acc;
  }, {} as ActivityHours);
}

function sanitizeTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function timeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(':');
  if (!hours || !minutes) return null;
  const parsedHours = Number.parseInt(hours, 10);
  const parsedMinutes = Number.parseInt(minutes, 10);
  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) return null;
  return parsedHours * 60 + parsedMinutes;
}

function crossesMidnight(open: string | null, close: string | null): boolean {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  if (start == null || end == null) return false;
  return end <= start;
}

function hasHoursConfigured(hours: ActivityHours): boolean {
  return DAY_KEYS.some((day) => Boolean(hours[day].open && hours[day].close));
}

function groupsFromActivities(activities?: Activities | null): Record<string, ActivityGroup> {
  return TEMPLATE_ACTIVITY_DEFINITIONS.reduce<Record<string, ActivityGroup>>((acc, definition) => {
    const week = activities?.[definition.key];
    const hours = createEmptyActivityHours();
    if (week) {
      DAY_KEYS.forEach((day) => {
        const range = week[DAY_TO_WEEK_KEY[day]];
        const open = range?.enabled ? sanitizeTime(range.start) : null;
        const close = range?.enabled ? sanitizeTime(range.end) : null;
        hours[day] = open && close
          ? {
              open,
              close,
              lateIntoNextDay: crossesMidnight(open, close),
            }
          : { open: null, close: null, lateIntoNextDay: false };
      });
    }
    acc[definition.id] = {
      id: definition.id,
      label: definition.label,
      enabled: hasHoursConfigured(hours),
      hours,
    };
    return acc;
  }, {} as Record<string, ActivityGroup>);
}

function activitiesFromGroups(groups: Record<string, ActivityGroup>): Activities {
  const result: Activities = {};
  TEMPLATE_ACTIVITY_DEFINITIONS.forEach((definition) => {
    const group = groups[definition.id];
    const sourceHours = group?.hours ?? createEmptyActivityHours();
    const week = DefaultWeekHours();
    const groupEnabled = group?.enabled !== false;
    DAY_KEYS.forEach((day) => {
      const config = sourceHours[day];
      const open = sanitizeTime(config?.open);
      const close = sanitizeTime(config?.close);
      const weekKey = DAY_TO_WEEK_KEY[day];
      if (open) week[weekKey].start = open;
      if (close) week[weekKey].end = close;
      week[weekKey].enabled = groupEnabled && Boolean(open && close);
    });
    result[definition.key] = week;
  });
  return result;
}

export default function StepBuild() {
  const notice = useTemplateNotice();
  const { state, patchNotice } = useTemplateBuilder();
  const [, setStep] = useTemplateStep();
  const resolver = React.useMemo(
    () =>
      zodResolver<TemplateNotice, TemplateNotice, TemplateNotice>(
        TemplateNoticeSchema as any
      ) as Resolver<TemplateNotice>,
    []
  );

  const form = useForm<TemplateNotice>({
    resolver,
    defaultValues: notice ?? createEmptyNotice(),
    mode: 'onChange',
  });

  const errors = React.useMemo(() => flattenErrors(form.formState.errors), [form.formState.errors]);

  React.useEffect(() => {
    form.reset(notice);
     
  }, [notice.noticeType]);

  React.useEffect(() => {
    if (!state.restoredFromDraft) return;
    form.reset(state.notice);
     
  }, [state.restoredFromDraft]);

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      patchNotice(value as Partial<TemplateNotice>, true);
    });
    return () => subscription.unsubscribe();
  }, [form, patchNotice]);

  const appliedPrefillRef = React.useRef(false);
  React.useEffect(() => {
    if (appliedPrefillRef.current) return;
    if (state.restoredFromDraft) return;
    const profile = readProfilePrefill<Record<string, any>>();
    if (!profile) return;
    const updates: Partial<TemplateNotice> = {};
    const current = form.getValues();
    if (!current.applicantLegalName && typeof profile.applicantLegalName === 'string') {
      updates.applicantLegalName = profile.applicantLegalName;
    }
    if (typeof profile.applicantAddressType === 'string') {
      if (profile.applicantAddressType === 'homeAddress' || profile.applicantAddressType === 'registeredOffice') {
        updates.applicantAddressType = profile.applicantAddressType;
      }
    }
    const address = normaliseProfileAddress(profile.applicantAddress);
    if (address) {
      updates.applicantAddress = {
        line1: address.line1 || current.applicantAddress.line1,
        line2: address.line2 || current.applicantAddress.line2,
        town: address.town || current.applicantAddress.town,
        postcode: address.postcode || current.applicantAddress.postcode,
      };
    }
    if (!current.contactEmail && typeof profile.contactEmail === 'string') {
      updates.contactEmail = profile.contactEmail;
    }
    if (!current.contactPhone && typeof profile.contactPhone === 'string') {
      updates.contactPhone = profile.contactPhone;
    }
    if (Object.keys(updates).length > 0) {
      Object.entries(updates).forEach(([key, value]) => {
        form.setValue(key as keyof TemplateNotice, value as any, {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
      patchNotice(updates, true);
    }
    appliedPrefillRef.current = true;
  }, [form, patchNotice, state.restoredFromDraft]);

  const activities = form.watch('activities') ?? {};
  const activitiesGroups = React.useMemo(() => groupsFromActivities(activities), [activities]);
  const defaultActivityGroups = React.useMemo(
    () =>
      TEMPLATE_ACTIVITY_DEFINITIONS.map((definition) => ({
        id: definition.id,
        label: definition.label,
        enabled: false,
        hours: createEmptyActivityHours(),
      })),
    []
  );
  const handleActivitiesChange = React.useCallback(
    (nextGroups: Record<string, ActivityGroup>) => {
      const nextActivities = activitiesFromGroups(nextGroups);
      form.setValue('activities', nextActivities, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form]
  );
  const publicationDate = form.watch('intendedPublicationDate');
  const council = form.watch('council');
  const currentDeadline = form.watch('representationDeadline');
  const deadlineMeta = form.watch('declEditMeta') as DeclEditMeta | undefined;
  const applicantAddressType = form.watch('applicantAddressType');

  const autoDeadline = React.useMemo(
    () =>
      calculateRepresentationDeadline(publicationDate, {
        shiftWeekend: council?.policy?.shiftWeekendDeadline === true,
      }),
    [publicationDate, council?.policy?.shiftWeekendDeadline]
  );

  const [deadlineDialogOpen, setDeadlineDialogOpen] = React.useState(false);
  const [deadlineDraft, setDeadlineDraft] = React.useState<{ date: string; reason: string }>({
    date: currentDeadline || autoDeadline || '',
    reason: deadlineMeta?.deadlineEditReason ?? '',
  });
  const [deadlineError, setDeadlineError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!deadlineDialogOpen) return;
    setDeadlineDraft({
      date: currentDeadline || autoDeadline || '',
      reason: deadlineMeta?.deadlineEditReason ?? '',
    });
    setDeadlineError(null);
  }, [deadlineDialogOpen, currentDeadline, autoDeadline, deadlineMeta?.deadlineEditReason]);

  const handleDeadlineConfirm = () => {
    const trimmedReason = deadlineDraft.reason.trim();
    if (!deadlineDraft.date) {
      setDeadlineError('Select a representation deadline.');
      return;
    }
    if (deadlineDraft.date === autoDeadline) {
      form.setValue('representationDeadline', deadlineDraft.date, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('declEditMeta', undefined, { shouldDirty: true, shouldValidate: true });
      setDeadlineDialogOpen(false);
      return;
    }
    if (trimmedReason.length < 3) {
      setDeadlineError('Provide a short reason for overriding the deadline.');
      return;
    }
    form.setValue('representationDeadline', deadlineDraft.date, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(
      'declEditMeta',
      { deadlineEdited: true, deadlineEditReason: trimmedReason },
      { shouldDirty: true, shouldValidate: true }
    );
    trackTemplateEvent('deadline_edited', {
      autoDeadline,
      newDeadline: deadlineDraft.date,
    });
    setDeadlineDialogOpen(false);
  };

  const handleDeadlineReset = () => {
    if (!autoDeadline) return;
    form.setValue('representationDeadline', autoDeadline, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('declEditMeta', undefined, { shouldDirty: true, shouldValidate: true });
  };

  const handleSubmit = form.handleSubmit(
    (data) => {
      patchNotice(data, true);
      setStep(3);
    },
    () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  );

  const applicantAddressErrors = mapAddressErrors(form.formState.errors.applicantAddress);
  const premisesAddressErrors = mapAddressErrors(form.formState.errors.premisesAddress);

  const selectedType = notice.noticeType;

  const addConditionSnippet = (snippet: string) => {
    const existing = form.getValues('conditionsSummary') || '';
    if (existing.includes(snippet)) return;
    const next = existing ? `${existing.trim()}\n${snippet}` : snippet;
    form.setValue('conditionsSummary', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    trackTemplateEvent('conditions_snippet_added', { snippet });
  };

  const representationHelp = (
    <div className="space-y-2">
      <p>
        Calculated as intended publication date + 28 days (Licensing Act 2003). Bank holidays or working-day
        policies may apply.
      </p>
      {autoDeadline && (
        <p className="font-medium text-slate-800">Automatic deadline: {formatDeadlineDisplay(autoDeadline)}</p>
      )}
    </div>
  );

  const showDeadlineReset = !!deadlineMeta?.deadlineEdited && !!autoDeadline;

  return (
    <section className="space-y-4" aria-label="Build notice">
      <ErrorSummary errors={errors} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Applicant details</h2>
            <InlineHelp id="applicant-help">
              Full legal entity or individual name, exactly as on the licensing application submitted to the council.
            </InlineHelp>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="applicantLegalName" className="text-sm font-medium text-slate-700">
                Applicant legal name
              </label>
              <input
                id="applicantLegalName"
                className={`${UI.input} mt-1 w-full`}
                {...form.register('applicantLegalName')}
              />
              {form.formState.errors.applicantLegalName && (
                <p className="mt-1 text-sm text-amber-700">
                  {form.formState.errors.applicantLegalName.message as string}
                </p>
              )}
            </div>
            <fieldset className="space-y-3" aria-labelledby="address-type-legend">
              <legend id="address-type-legend" className="text-sm font-semibold text-blue-900">
                Address type
              </legend>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3">
                  <input
                    type="radio"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    value="registeredOffice"
                    {...form.register('applicantAddressType')}
                    checked={applicantAddressType === 'registeredOffice'}
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Registered office (company)</span>
                    <br />Use the address registered with Companies House.
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3">
                  <input
                    type="radio"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    value="homeAddress"
                    {...form.register('applicantAddressType')}
                    checked={applicantAddressType === 'homeAddress'}
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Home address (individual)</span>
                    <br />Use the applicant’s residential address.
                  </span>
                </label>
              </div>
            </fieldset>
            <AddressPicker
              id="applicantAddress"
              label="Applicant address"
              value={form.watch('applicantAddress')}
              onChange={(next) =>
                form.setValue('applicantAddress', next, { shouldDirty: true, shouldValidate: true })
              }
              errors={applicantAddressErrors}
              footnote={ADDRESS_HINT[applicantAddressType]}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="contactEmail" className="text-sm font-medium text-slate-700">
                  Contact email
                </label>
                <input
                  id="contactEmail"
                  className={`${UI.input} mt-1 w-full`}
                  {...form.register('contactEmail')}
                />
                {form.formState.errors.contactEmail && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.contactEmail.message as string}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contactPhone" className="text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input id="contactPhone" className={`${UI.input} mt-1 w-full`} {...form.register('contactPhone')} />
                {form.formState.errors.contactPhone && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.contactPhone.message as string}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Required for urgent licensing queries — UK or international format.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Premises details</h2>
            <InlineHelp id="premises-help">
              These details appear in the public notice and correspondence to the council.
            </InlineHelp>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="premisesName" className="text-sm font-medium text-slate-700">
                Premises name
              </label>
              <input id="premisesName" className={`${UI.input} mt-1 w-full`} {...form.register('premisesName')} />
            </div>
            <div>
              <label htmlFor="tradingName" className="text-sm font-medium text-slate-700">
                Trading name
              </label>
              <input id="tradingName" className={`${UI.input} mt-1 w-full`} {...form.register('tradingName')} />
              {form.formState.errors.tradingName && (
                <p className="mt-1 text-sm text-amber-700">
                  {form.formState.errors.tradingName.message as string}
                </p>
              )}
            </div>
          </div>
          <AddressPicker
            id="premisesAddress"
            label="Premises address"
            value={form.watch('premisesAddress')}
            onChange={(next) => form.setValue('premisesAddress', next, { shouldDirty: true, shouldValidate: true })}
            errors={premisesAddressErrors}
          />
        </section>

        <section className={`${UI.card} p-5 md:p-6 space-y-4`}>
          <div>
            <h2 className="text-base font-semibold text-blue-900">Council &amp; dates</h2>
            <InlineHelp id="council-help">
              We auto-fill your licensing authority from the premises postcode. Edit if the lookup is wrong or incomplete.
            </InlineHelp>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="intendedPublicationDate" className="text-sm font-medium text-slate-700">
                Intended publication date
              </label>
              <input
                type="date"
                id="intendedPublicationDate"
                className={`${UI.input} mt-1 w-full`}
                {...form.register('intendedPublicationDate')}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="representationDeadline" className="text-sm font-medium text-slate-700">
                  Representation deadline
                </label>
                <InfoTooltip content={representationHelp} label="Representation deadline guidance" />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="date"
                  id="representationDeadline"
                  className={`${UI.input} w-full bg-slate-100 text-slate-700`}
                  value={currentDeadline || ''}
                  readOnly
                  aria-readonly="true"
                />
                <button
                  type="button"
                  className={`${UI.btnSecondary} h-10 px-4 text-xs`}
                  onClick={() => setDeadlineDialogOpen(true)}
                >
                  Edit
                </button>
                {showDeadlineReset && (
                  <button
                    type="button"
                    className={`${UI.btnSecondary} h-10 px-4 text-xs`}
                    onClick={handleDeadlineReset}
                  >
                    Reset
                  </button>
                )}
              </div>
              {deadlineMeta?.deadlineEdited && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  Deadline manually overridden — reason captured for audit.
                </p>
              )}
            </div>
          </div>
          <CouncilContactAuto
            postcode={form.watch('premisesAddress')?.postcode ?? ''}
            value={council}
            onChange={(next) => form.setValue('council', next, { shouldDirty: true, shouldValidate: true })}
          />
        </section>

        <section
          className={`${UI.card} p-5 md:p-6 space-y-4`}
          aria-label="Licensable activities"
          id="activities-grid"
        >
          <div>
            <h2 className="text-base font-semibold text-blue-900">Activities &amp; hours</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use 24-hour time. Mark days as closed where the activity is not authorised.
            </p>
          </div>
          <ActivitiesHours
            value={activitiesGroups}
            defaultGroups={defaultActivityGroups}
            onChange={handleActivitiesChange}
            persistKey="template.activitiesHours"
          />
        </section>

        {selectedType === 'new' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-blue-900">Optional conditions</h2>
              <p className="text-sm text-slate-600">Select snippets or add your own council-friendly wording.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONDITION_SNIPPETS.map((snippet) => (
                <button
                  type="button"
                  key={snippet}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-blue-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => addConditionSnippet(snippet)}
                >
                  {snippet}
                </button>
              ))}
            </div>
            <textarea
              id="conditionsSummary"
              className={`${UI.input} mt-2 w-full min-h-[120px]`}
              placeholder="Examples: dispersal policy, door supervisors, noise management..."
              {...form.register('conditionsSummary')}
            />
            {form.formState.errors.conditionsSummary && (
              <p className="text-sm text-amber-700">
                {form.formState.errors.conditionsSummary.message as string}
              </p>
            )}
          </section>
        )}

        {selectedType === 'variation' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <h2 className="text-base font-semibold text-blue-900">Describe the proposed changes</h2>
            <textarea
              id="variationDescription"
              className={`${UI.input} mt-1 w-full min-h-[140px]`}
              {...form.register('variationDescription')}
            />
            {form.formState.errors.variationDescription && (
              <p className="mt-1 text-sm text-amber-700">
                {form.formState.errors.variationDescription.message as string}
              </p>
            )}
            <p className="text-sm text-slate-600">
              Only complete the activities matrix above if hours or licensable activities are changing.
            </p>
          </section>
        )}

        {selectedType === 'review' && (
          <section className={`${UI.card} p-5 md:p-6 space-y-3`}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="reviewApplicant" className="text-sm font-medium text-slate-700">
                  Applicant for review
                </label>
                <input
                  id="reviewApplicant"
                  className={`${UI.input} mt-1 w-full`}
                  placeholder="Defaults to the applicant above"
                  {...form.register('reviewApplicant')}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="reviewGrounds" className="text-sm font-medium text-slate-700">
                  Grounds for review
                </label>
                <textarea
                  id="reviewGrounds"
                  className={`${UI.input} mt-1 w-full min-h-[140px]`}
                  {...form.register('reviewGrounds')}
                />
                {form.formState.errors.reviewGrounds && (
                  <p className="mt-1 text-sm text-amber-700">
                    {form.formState.errors.reviewGrounds.message as string}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button type="button" className={`${UI.btnSecondary} h-11 px-6 text-sm`} onClick={() => setStep(1)}>
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`${UI.btnSecondary} h-11 px-6 text-sm`}
              onClick={() => form.reset(notice)}
            >
              Reset
            </button>
            <button type="submit" className={`${UI.btnPrimary} h-11 px-6 text-sm`}>
              Continue
            </button>
          </div>
        </div>
      </form>

      {deadlineDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className={`${UI.card} w-full max-w-lg space-y-4 p-6`} role="dialog" aria-modal="true">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Override representation deadline</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Confirm the new deadline and record why it differs from the automatic calculation.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className={`${UI.btnSecondary} h-9 px-3 text-xs`}
                onClick={() => setDeadlineDialogOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="manual-deadline" className="text-sm font-medium text-slate-700">
                  New representation deadline
                </label>
                <input
                  type="date"
                  id="manual-deadline"
                  className={`${UI.input} mt-1 w-full`}
                  value={deadlineDraft.date}
                  onChange={(event) => setDeadlineDraft((prev) => ({ ...prev, date: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="deadline-reason" className="text-sm font-medium text-slate-700">
                  Reason for override
                </label>
                <textarea
                  id="deadline-reason"
                  className={`${UI.input} mt-1 w-full min-h-[80px]`}
                  value={deadlineDraft.reason}
                  onChange={(event) => setDeadlineDraft((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Example: Council confirmed bank holiday policy shifts deadline to next working day."
                />
              </div>
              <p className="text-xs text-slate-500">
                Automatic calculation: {autoDeadline ? formatDeadlineDisplay(autoDeadline) : 'Not yet available'}
              </p>
              {deadlineError && <p className="text-sm text-amber-700">{deadlineError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                className={`${UI.btnSecondary} h-10 px-4 text-sm`}
                onClick={() => setDeadlineDialogOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className={`${UI.btnPrimary} h-10 px-5 text-sm`} onClick={handleDeadlineConfirm}>
                Save override
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
