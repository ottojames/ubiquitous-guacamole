import React from 'react';
import type { NoticeDefinition } from '@/next/publish/config/noticeTypes';
import * as UI from '@/styles/ui';
import { getNested } from '@/next/publish/utils/object';
import { TRAFFIC_AREAS } from '@/next/publish/config/trafficAreas';
import ActivitiesHours, {
  type ActivityGroup,
  type ActivityHours,
  type DayKey,
} from '@/components/notice/ActivitiesHours';

export type TemplateBuilderFormProps = {
  definition: NoticeDefinition;
  draft: Record<string, unknown> | null;
  onChange: (path: (string | number)[], value: unknown) => void;
};

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helperText?: string;
  required?: boolean;
  span?: 12 | 8 | 6 | 4;
};

function TextInput({ label, value, onChange, type = 'text', helperText, required, span = 6 }: InputProps) {
  const inputId = React.useId();
  const helperId = helperText ? `${inputId}-helper` : undefined;
  return (
    <label className="block space-y-2" data-grid-span={span} htmlFor={inputId}>
      <span className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <input
        id={inputId}
        type={type}
        className={`${UI.input}`}
        value={value}
        aria-required={required ? 'true' : undefined}
        aria-describedby={helperId}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText ? (
        <span id={helperId} className="text-xs text-neutral-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  helperText?: string;
  required?: boolean;
  span?: 12 | 8 | 6 | 4;
};

function TextArea({ label, value, onChange, rows = 4, helperText, required, span = 12 }: TextAreaProps) {
  const inputId = React.useId();
  const helperId = helperText ? `${inputId}-helper` : undefined;
  return (
    <label className="block space-y-2" data-grid-span={span} htmlFor={inputId}>
      <span className="text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <textarea
        id={inputId}
        className={`${UI.input} min-h-[120px]`}
        value={value}
        rows={rows}
        aria-required={required ? 'true' : undefined}
        aria-describedby={helperId}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText ? (
        <span id={helperId} className="text-xs text-neutral-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

const GRID_SPAN_CLASSES: Record<number, string> = {
  12: 'md:col-span-12',
  8: 'md:col-span-8',
  6: 'md:col-span-6',
  4: 'md:col-span-4',
};
const DEFAULT_SPAN_CLASS = GRID_SPAN_CLASSES[6];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <section className={`${UI.card} space-y-4 p-6`}>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <div className="grid grid-cols-12 gap-x-6 gap-y-5">
        {items.map((child, index) => {
          if (!React.isValidElement(child)) {
            return (
              <div key={index} className="col-span-12 md:col-span-12">
                {child}
              </div>
            );
          }
          const rawSpan = child.props?.['data-grid-span'];
          let span = Number(rawSpan);
          if (!Number.isFinite(span)) span = 6;
          const spanClass = GRID_SPAN_CLASSES[span] ?? DEFAULT_SPAN_CLASS;
          const content =
            rawSpan !== undefined ? React.cloneElement(child, { 'data-grid-span': undefined }) : child;
          return (
            <div key={child.key ?? index} className={`col-span-12 ${spanClass}`}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type LicensingActivityDefinition = {
  id: string;
  label: string;
  schemaCode: string;
};

const LICENSING_ACTIVITY_DEFINITIONS: LicensingActivityDefinition[] = [
  { id: 'alcohol_on', label: 'Sale of alcohol (on premises)', schemaCode: 'alcohol_on' },
  { id: 'alcohol_off', label: 'Sale of alcohol (off premises)', schemaCode: 'alcohol_off' },
  { id: 'alcohol_on_off', label: 'Sale of alcohol (on & off premises)', schemaCode: 'alcohol_on_off' },
  { id: 'late_refreshment', label: 'Late-night refreshment', schemaCode: 'late_night_refreshment' },
  { id: 'live_music', label: 'Live music', schemaCode: 'live_music' },
  { id: 'recorded_music', label: 'Recorded music', schemaCode: 'recorded_music' },
  { id: 'dance', label: 'Dance', schemaCode: 'dance' },
  { id: 'other', label: 'Other licensable activity', schemaCode: 'other' },
];

const GROUP_ID_TO_SCHEMA_CODE: Record<string, string> = LICENSING_ACTIVITY_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.id] = definition.schemaCode;
    return acc;
  },
  {} as Record<string, string>
);

const SCHEMA_CODE_TO_GROUP_ID: Record<string, string> = LICENSING_ACTIVITY_DEFINITIONS.reduce(
  (acc, definition) => {
    acc[definition.schemaCode] = definition.id;
    return acc;
  },
  {} as Record<string, string>
);

function createEmptyHours(): ActivityHours {
  return DAY_KEYS.reduce<ActivityHours>((acc, day) => {
    acc[day] = { open: null, close: null, lateIntoNextDay: false };
    return acc;
  }, {} as ActivityHours);
}

function timeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number.parseInt(match[1] ?? '0', 10);
  const minutes = Number.parseInt(match[2] ?? '0', 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function crossesMidnight(open: string | null, close: string | null): boolean {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  if (start == null || end == null) return false;
  return end <= start;
}

function hasAnyHours(hours: ActivityHours): boolean {
  return DAY_KEYS.some((day) => {
    const config = hours[day];
    return Boolean(config?.open && config?.close);
  });
}

function normalizeHours(hours: ActivityHours | null | undefined): ActivityHours {
  const normalized = createEmptyHours();
  if (!hours || typeof hours !== 'object') return normalized;
  for (const day of DAY_KEYS) {
    const entry = hours[day];
    if (entry?.open && entry?.close) {
      normalized[day] = {
        open: entry.open,
        close: entry.close,
        lateIntoNextDay: entry.lateIntoNextDay ?? crossesMidnight(entry.open, entry.close),
      };
    }
  }
  return normalized;
}

function getLabelForGroup(id: string): string {
  return LICENSING_ACTIVITY_DEFINITIONS.find((definition) => definition.id === id)?.label ?? id;
}

function buildGroup(definition: LicensingActivityDefinition, source?: ActivityGroup | null): ActivityGroup {
  const normalizedHours = normalizeHours(source?.hours);
  const enabled = source?.enabled ?? hasAnyHours(normalizedHours);
  return {
    id: definition.id,
    label: source?.label ?? getLabelForGroup(definition.id),
    enabled,
    hours: normalizedHours,
  };
}

function normalizeActivitiesRecord(record: unknown): Record<string, ActivityGroup> | null {
  if (!record || typeof record !== 'object') return null;
  const groups: Record<string, ActivityGroup> = {};
  for (const definition of LICENSING_ACTIVITY_DEFINITIONS) {
    const source = (record as Record<string, ActivityGroup | undefined>)[definition.id];
    if (!source) continue;
    groups[definition.id] = buildGroup(definition, source);
  }
  return Object.keys(groups).length ? groups : null;
}

function activitiesArrayToGroups(entries: unknown): Record<string, ActivityGroup> | null {
  if (!Array.isArray(entries)) return null;
  const groups: Record<string, ActivityGroup> = {};
  for (const item of entries) {
    if (!item || typeof item !== 'object') continue;
    const code = (item as { code?: string }).code;
    const groupId = code ? SCHEMA_CODE_TO_GROUP_ID[code] ?? code : undefined;
    if (!groupId) continue;
    const definition = LICENSING_ACTIVITY_DEFINITIONS.find((def) => def.id === groupId);
    if (!definition) continue;
    const hours = createEmptyHours();
    const days = Array.isArray((item as { days?: unknown }).days)
      ? ((item as { days?: unknown }).days as string[])
      : [];
    const start = typeof (item as { startTime?: string }).startTime === 'string' ? (item as { startTime?: string }).startTime || null : null;
    const end = typeof (item as { endTime?: string }).endTime === 'string' ? (item as { endTime?: string }).endTime || null : null;
    for (const day of days) {
      if (!DAY_KEYS.includes(day as DayKey) || !start || !end) continue;
      hours[day as DayKey] = {
        open: start,
        close: end,
        lateIntoNextDay: crossesMidnight(start, end),
      };
    }
    const labelForActivity =
      typeof (item as { label?: string }).label === 'string'
        ? ((item as { label?: string }).label as string)
        : getLabelForGroup(groupId);
    groups[groupId] = buildGroup(definition, {
      id: groupId,
      label: labelForActivity,
      enabled: Boolean((item as { enabled?: boolean }).enabled ?? days.length > 0),
      hours,
    });
  }
  return Object.keys(groups).length ? groups : null;
}

type LicensingActivityDraft = {
  code: string;
  label: string;
  enabled: boolean;
  days: string[];
  startTime: string;
  endTime: string;
};

function groupsToActivitiesArray(groups: Record<string, ActivityGroup>): LicensingActivityDraft[] {
  return LICENSING_ACTIVITY_DEFINITIONS.map((definition) => {
    const source = groups[definition.id] ?? buildGroup(definition);
    const hours = normalizeHours(source.hours);
    const activeDays = DAY_KEYS.filter((day) => Boolean(hours[day].open && hours[day].close));
    const enabled = Boolean((source.enabled ?? hasAnyHours(hours)) && activeDays.length);
    const firstDay = activeDays[0];
    const firstRange = firstDay ? hours[firstDay] : undefined;
    return {
      code: GROUP_ID_TO_SCHEMA_CODE[definition.id] ?? definition.id,
      label: source.label ?? getLabelForGroup(definition.id),
      enabled,
      days: enabled ? activeDays : [],
      startTime: enabled && firstRange?.open ? firstRange.open : '',
      endTime: enabled && firstRange?.close ? firstRange.close : '',
    };
  });
}

function resolveActivitiesGroups(
  record: unknown,
  entries?: unknown
): Record<string, ActivityGroup> {
  const fromRecord = normalizeActivitiesRecord(record);
  if (fromRecord) {
    return LICENSING_ACTIVITY_DEFINITIONS.reduce<Record<string, ActivityGroup>>((acc, definition) => {
      acc[definition.id] = buildGroup(definition, fromRecord[definition.id]);
      return acc;
    }, {} as Record<string, ActivityGroup>);
  }
  const fromArray = activitiesArrayToGroups(entries);
  if (fromArray) {
    return LICENSING_ACTIVITY_DEFINITIONS.reduce<Record<string, ActivityGroup>>((acc, definition) => {
      acc[definition.id] = buildGroup(definition, fromArray[definition.id]);
      return acc;
    }, {} as Record<string, ActivityGroup>);
  }
  return LICENSING_ACTIVITY_DEFINITIONS.reduce<Record<string, ActivityGroup>>((acc, definition) => {
    acc[definition.id] = buildGroup(definition);
    return acc;
  }, {} as Record<string, ActivityGroup>);
}

function getString(draft: Record<string, unknown> | null, path: (string | number)[]): string {
  const value = getNested(draft, path);
  return typeof value === 'string' ? value : '';
}

function getNumber(draft: Record<string, unknown> | null, path: (string | number)[], fallback = 0): number {
  const value = getNested(draft, path);
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return fallback;
}

function updateArrayField(
  draft: Record<string, unknown> | null,
  onChange: (path: (string | number)[], value: unknown) => void,
  path: (string | number)[],
  updater: (current: any[]) => any[]
) {
  const current = getNested<any[]>(draft, path) || [];
  const next = updater(current);
  onChange(path, next);
}

export default function TemplateBuilderForm({ definition, draft, onChange }: TemplateBuilderFormProps) {
  const category = definition.category;

  return (
    <div className="space-y-6">
      <Section title="Applicant details">
        <div className="flex flex-wrap gap-3" data-grid-span={12}>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="radio"
              name="applicant-type"
              value="individual"
              checked={getString(draft, ['applicant', 'type']) === 'individual'}
              onChange={() => onChange(['applicant', 'type'], 'individual')}
            />
            Individual
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
            <input
              type="radio"
              name="applicant-type"
              value="company"
              checked={getString(draft, ['applicant', 'type']) === 'company' || !getString(draft, ['applicant', 'type'])}
              onChange={() => onChange(['applicant', 'type'], 'company')}
            />
            Company
          </label>
        </div>
        {getString(draft, ['applicant', 'type']) === 'individual' ? (
          <TextInput
            label="Full name"
            value={getString(draft, ['applicant', 'fullName'])}
            onChange={(value) => onChange(['applicant', 'fullName'], value)}
            required
          />
        ) : (
          <>
            <TextInput
              label="Company name"
              value={getString(draft, ['applicant', 'companyName'])}
              onChange={(value) => onChange(['applicant', 'companyName'], value)}
              required
            />
            <TextInput
              label="Company number"
              value={getString(draft, ['applicant', 'companyNumber'])}
              onChange={(value) => onChange(['applicant', 'companyNumber'], value)}
            />
          </>
        )}
        <TextInput
          label="Contact email"
          type="email"
          value={getString(draft, ['applicant', 'contactEmail'])}
          onChange={(value) => onChange(['applicant', 'contactEmail'], value)}
          required
        />
        <TextInput
          label="Contact phone"
          value={getString(draft, ['applicant', 'contactPhone'])}
          onChange={(value) => onChange(['applicant', 'contactPhone'], value)}
        />
        <TextInput
          label="Service address line 1"
          value={getString(draft, ['applicant', 'serviceAddress', 'line1'])}
          onChange={(value) => onChange(['applicant', 'serviceAddress', 'line1'], value)}
          required
        />
        <TextInput
          label="Service address line 2"
          value={getString(draft, ['applicant', 'serviceAddress', 'line2'])}
          onChange={(value) => onChange(['applicant', 'serviceAddress', 'line2'], value)}
        />
        <TextInput
          label="Service town / city"
          value={getString(draft, ['applicant', 'serviceAddress', 'town'])}
          onChange={(value) => onChange(['applicant', 'serviceAddress', 'town'], value)}
          required
        />
        <TextInput
          label="Service postcode"
          value={getString(draft, ['applicant', 'serviceAddress', 'postcode'])}
          onChange={(value) => onChange(['applicant', 'serviceAddress', 'postcode'], value.toUpperCase())}
          required
        />
      </Section>

      <Section title="Premises / site">
        <TextInput
          label="Premises or site name"
          value={getString(draft, ['premises', 'name'])}
          onChange={(value) => onChange(['premises', 'name'], value)}
        />
        <TextInput
          label="Address line 1"
          value={getString(draft, ['premises', 'address', 'line1'])}
          onChange={(value) => onChange(['premises', 'address', 'line1'], value)}
          required
        />
        <TextInput
          label="Address line 2"
          value={getString(draft, ['premises', 'address', 'line2'])}
          onChange={(value) => onChange(['premises', 'address', 'line2'], value)}
        />
        <TextInput
          label="Town / city"
          value={getString(draft, ['premises', 'address', 'town'])}
          onChange={(value) => onChange(['premises', 'address', 'town'], value)}
          required
        />
        <TextInput
          label="Postcode"
          value={getString(draft, ['premises', 'address', 'postcode'])}
          onChange={(value) => onChange(['premises', 'address', 'postcode'], value.toUpperCase())}
          required
        />
      </Section>

      <Section title="Key dates">
        <TextInput
          label="Application date"
          type="date"
          value={getString(draft, ['consultation', 'applicationDate'])}
          onChange={(value) => onChange(['consultation', 'applicationDate'], value)}
          required
        />
        <TextInput
          label="Representations deadline"
          type="date"
          value={getString(draft, ['consultation', 'repsDeadline'])}
          onChange={(value) => onChange(['consultation', 'repsDeadline'], value)}
          required
        />
      </Section>

      <Section title="Publication plan">
        <TextInput
          label="Newspaper"
          value={getString(draft, ['publication', 'newspaper'])}
          onChange={(value) => onChange(['publication', 'newspaper'], value)}
          required
        />
        <TextInput
          label="Target publication date"
          type="date"
          value={getString(draft, ['publication', 'targetDate'])}
          onChange={(value) => onChange(['publication', 'targetDate'], value)}
          required
        />
        <TextInput
          label="Estimated price (ex VAT)"
          type="number"
          value={String(getNested(draft, ['publication', 'priceExVat']) ?? '')}
          onChange={(value) => onChange(['publication', 'priceExVat'], value ? Number(value) : undefined)}
        />
      </Section>

      {category === 'licensing' && (
        <LicensingSpecific definition={definition} draft={draft} onChange={onChange} />
      )}
      {category === 'gambling' && <GamblingSpecific draft={draft} onChange={onChange} />}
      {category === 'gvol' && <GvolSpecific draft={draft} onChange={onChange} />}
      {category === 'planning' && <PlanningSpecific draft={draft} onChange={onChange} definition={definition} />}
      {category === 'probate' && <ProbateSpecific draft={draft} onChange={onChange} />}
    </div>
  );
}

function LicensingSpecific({
  definition,
  draft,
  onChange,
}: {
  definition: NoticeDefinition;
  draft: Record<string, unknown> | null;
  onChange: (path: (string | number)[], value: unknown) => void;
}) {
  const variant = definition.id;
  const rawActivitiesRecord = getNested<Record<string, ActivityGroup> | null>(draft, ['activitiesHours']);
  const rawActivitiesArray = getNested<any[]>(draft, ['activities']);

  const activitiesGroups = React.useMemo(
    () => resolveActivitiesGroups(rawActivitiesRecord, rawActivitiesArray),
    [rawActivitiesRecord, rawActivitiesArray]
  );

  const handleActivitiesChange = React.useCallback(
    (nextGroups: Record<string, ActivityGroup>) => {
      const normalized = resolveActivitiesGroups(nextGroups, undefined);
      onChange(['activitiesHours'], normalized);
      onChange(['activities'], groupsToActivitiesArray(normalized));
    },
    [onChange]
  );

  const defaultActivityGroups = React.useMemo(
    () => LICENSING_ACTIVITY_DEFINITIONS.map((definition) => buildGroup(definition)),
    []
  );

  return (
    <Section title="Licensing details">
      <TextInput
        label="Licensing authority name"
        value={getString(draft, ['licensingAuthority', 'name'])}
        onChange={(value) => onChange(['licensingAuthority', 'name'], value)}
        required
      />
      <TextArea
        label="Licensing authority address"
        value={getString(draft, ['licensingAuthority', 'address'])}
        onChange={(value) => onChange(['licensingAuthority', 'address'], value)}
        rows={3}
      />
      <TextInput
        label="Licensing authority email"
        type="email"
        value={getString(draft, ['licensingAuthority', 'email'])}
        onChange={(value) => onChange(['licensingAuthority', 'email'], value)}
      />
      <TextInput
        label="Inspection address or URL"
        value={getString(draft, ['inspectionAddressOrURL'])}
        onChange={(value) => onChange(['inspectionAddressOrURL'], value)}
        required
      />
      <TextInput
        label="Representations email"
        type="email"
        value={getString(draft, ['representations', 'email'])}
        onChange={(value) => onChange(['representations', 'email'], value)}
      />
      <TextInput
        label="Representations website"
        value={getString(draft, ['representations', 'website'])}
        onChange={(value) => onChange(['representations', 'website'], value)}
      />
      <TextArea
        label="Representations postal address"
        value={getString(draft, ['representations', 'postal'])}
        onChange={(value) => onChange(['representations', 'postal'], value)}
        rows={2}
      />
      <TextInput
        label="Site notice displayed on"
        type="date"
        value={getString(draft, ['siteNoticeDate'])}
        onChange={(value) => onChange(['siteNoticeDate'], value)}
      />
      <TextInput
        label="Newspaper publication date"
        type="date"
        value={getString(draft, ['newspaperPublicationDate'])}
        onChange={(value) => onChange(['newspaperPublicationDate'], value)}
      />
      <TextInput
        label="Newspaper timing override reason"
        value={getString(draft, ['newspaperOverrideReason'])}
        onChange={(value) => onChange(['newspaperOverrideReason'], value)}
      />
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-neutral-800">Licensable activities</h4>
        <ActivitiesHours
          value={activitiesGroups}
          defaultGroups={defaultActivityGroups}
          onChange={handleActivitiesChange}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Alcohol service"
          value={getString(draft, ['alcoholService'])}
          onChange={(value) => onChange(['alcoholService'], value)}
          helperText="Enter 'on', 'off', or 'both'."
        />
        <TextInput
          label="DPS full name"
          value={getString(draft, ['dps', 'fullName'])}
          onChange={(value) => onChange(['dps', 'fullName'], value)}
        />
        <TextInput
          label="DPS issuing authority"
          value={getString(draft, ['dps', 'issuingAuthority'])}
          onChange={(value) => onChange(['dps', 'issuingAuthority'], value)}
        />
        <TextInput
          label="DPS licence number"
          value={getString(draft, ['dps', 'licenceNumber'])}
          onChange={(value) => onChange(['dps', 'licenceNumber'], value)}
        />
      </div>
      {variant.includes('variation') && (
        <TextArea
          label="Variation summary"
          value={getString(draft, ['variationSummary'])}
          onChange={(value) => onChange(['variationSummary'], value)}
          helperText="Describe the changes proposed."
        />
      )}
      {variant.includes('review') && (
        <TextArea
          label="Review grounds"
          value={getString(draft, ['reviewGrounds'])}
          onChange={(value) => onChange(['reviewGrounds'], value)}
          helperText="Outline the grounds for this review."
        />
      )}
      {variant.includes('club') && (
        <TextArea
          label="Additional notes"
          value={getString(draft, ['additionalNotes'])}
          onChange={(value) => onChange(['additionalNotes'], value)}
        />
      )}
    </Section>
  );
}

function GamblingSpecific({ draft, onChange }: { draft: Record<string, unknown> | null; onChange: (path: (string | number)[], value: unknown) => void }) {
  return (
    <Section title="Gambling details">
      <TextInput
        label="Licensing authority name"
        value={getString(draft, ['licensingAuthority', 'name'])}
        onChange={(value) => onChange(['licensingAuthority', 'name'], value)}
        required
      />
      <TextArea
        label="Licensing authority address"
        value={getString(draft, ['licensingAuthority', 'address'])}
        onChange={(value) => onChange(['licensingAuthority', 'address'], value)}
        rows={3}
      />
      <TextInput
        label="Licensing authority email"
        type="email"
        value={getString(draft, ['licensingAuthority', 'email'])}
        onChange={(value) => onChange(['licensingAuthority', 'email'], value)}
      />
      <TextArea
        label="Activities (one per line)"
        value={getNested<string[]>(draft, ['activities'])?.join('\n') ?? ''}
        onChange={(value) => onChange(['activities'], value.split('\n').map((line) => line.trim()).filter(Boolean))}
        rows={4}
      />
      <TextInput
        label="Site notice displayed on"
        type="date"
        value={getString(draft, ['siteNoticeDate'])}
        onChange={(value) => onChange(['siteNoticeDate'], value)}
      />
    </Section>
  );
}

function GvolSpecific({ draft, onChange }: { draft: Record<string, unknown> | null; onChange: (path: (string | number)[], value: unknown) => void }) {
  const selectedArea = getNested(draft, ['trafficAreaOverride', 'id']);
  return (
    <Section title="GVOL details">
      <TextInput
        label="Operating centre line 1"
        value={getString(draft, ['operatingCentreAddress', 'line1'])}
        onChange={(value) => onChange(['operatingCentreAddress', 'line1'], value)}
        required
      />
      <TextInput
        label="Operating centre town"
        value={getString(draft, ['operatingCentreAddress', 'town'])}
        onChange={(value) => onChange(['operatingCentreAddress', 'town'], value)}
        required
      />
      <TextInput
        label="Operating centre postcode"
        value={getString(draft, ['operatingCentreAddress', 'postcode'])}
        onChange={(value) => onChange(['operatingCentreAddress', 'postcode'], value.toUpperCase())}
        required
      />
      <TextInput
        label="Maximum vehicles"
        type="number"
        value={String(getNumber(draft, ['vehicles', 'maxVehicles'], 0) || '')}
        onChange={(value) => onChange(['vehicles', 'maxVehicles'], value ? Number(value) : 0)}
      />
      <TextInput
        label="Maximum trailers"
        type="number"
        value={String(getNumber(draft, ['vehicles', 'maxTrailers'], 0) || '')}
        onChange={(value) => onChange(['vehicles', 'maxTrailers'], value ? Number(value) : 0)}
      />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-neutral-800">Override traffic area</span>
        <select
          className={`${UI.input}`}
          value={selectedArea ? String(selectedArea) : ''}
          onChange={(event) => {
            const id = event.target.value;
            if (!id) {
              onChange(['trafficAreaOverride'], undefined);
              return;
            }
            const area = TRAFFIC_AREAS.find((item) => item.id === id);
            if (area) {
              onChange(['trafficAreaOverride'], { id: area.id, name: area.name, address: area.address });
            }
          }}
        >
          <option value="">Auto (by postcode)</option>
          {TRAFFIC_AREAS.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
    </Section>
  );
}

function PlanningSpecific({ draft, onChange, definition }: { draft: Record<string, unknown> | null; onChange: (path: (string | number)[], value: unknown) => void; definition: NoticeDefinition }) {
  const triggerOptions = [
    'Major development',
    'EIA development',
    'Listed building',
    'Conservation area',
    'Public right of way',
    'Departure from development plan',
  ];
  const currentTriggers = new Set(getNested<string[]>(draft, ['triggers']) || []);

  return (
    <Section title="Planning details">
      <TextInput
        label="Local planning authority"
        value={getString(draft, ['planningAuthority', 'name'])}
        onChange={(value) => onChange(['planningAuthority', 'name'], value)}
        required
      />
      <TextArea
        label="Authority address"
        value={getString(draft, ['planningAuthority', 'address'])}
        onChange={(value) => onChange(['planningAuthority', 'address'], value)}
        rows={3}
      />
      <TextInput
        label="Authority email"
        type="email"
        value={getString(draft, ['planningAuthority', 'contactEmail'])}
        onChange={(value) => onChange(['planningAuthority', 'contactEmail'], value)}
      />
      <TextInput
        label="Authority portal URL"
        value={getString(draft, ['planningAuthority', 'portalUrl'])}
        onChange={(value) => onChange(['planningAuthority', 'portalUrl'], value)}
        required
      />
      <TextInput
        label="Inspection address or URL"
        value={getString(draft, ['planningAuthority', 'inspectionAddressOrURL'])}
        onChange={(value) => onChange(['planningAuthority', 'inspectionAddressOrURL'], value)}
        required
      />
      <TextInput
        label="Application reference"
        value={getString(draft, ['applicationReference'])}
        onChange={(value) => onChange(['applicationReference'], value)}
        required
      />
      <TextArea
        label="Proposal"
        value={getString(draft, ['proposal'])}
        onChange={(value) => onChange(['proposal'], value)}
        rows={4}
        required
      />
      <div className="space-y-2">
        <span className="text-sm font-semibold text-neutral-800">Reasons for press notice</span>
        <div className="grid gap-2 md:grid-cols-2">
          {triggerOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={currentTriggers.has(option)}
                onChange={(event) => {
                  const next = new Set(currentTriggers);
                  if (event.target.checked) next.add(option);
                  else next.delete(option);
                  onChange(['triggers'], Array.from(next));
                }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    </Section>
  );
}

function ProbateSpecific({ draft, onChange }: { draft: Record<string, unknown> | null; onChange: (path: (string | number)[], value: unknown) => void }) {
  return (
    <Section title="Probate details">
      <TextInput
        label="Deceased full name"
        value={getString(draft, ['deceased', 'fullName'])}
        onChange={(value) => onChange(['deceased', 'fullName'], value)}
        required
      />
      <TextInput
        label="Deceased address line 1"
        value={getString(draft, ['deceased', 'lastAddress', 'line1'])}
        onChange={(value) => onChange(['deceased', 'lastAddress', 'line1'], value)}
        required
      />
      <TextInput
        label="Deceased town"
        value={getString(draft, ['deceased', 'lastAddress', 'town'])}
        onChange={(value) => onChange(['deceased', 'lastAddress', 'town'], value)}
        required
      />
      <TextInput
        label="Deceased postcode"
        value={getString(draft, ['deceased', 'lastAddress', 'postcode'])}
        onChange={(value) => onChange(['deceased', 'lastAddress', 'postcode'], value.toUpperCase())}
        required
      />
      <TextInput
        label="Date of death"
        type="date"
        value={getString(draft, ['deceased', 'dateOfDeath'])}
        onChange={(value) => onChange(['deceased', 'dateOfDeath'], value)}
        required
      />
      <TextInput
        label="Solicitor / PR name"
        value={getString(draft, ['solicitorOrPR', 'name'])}
        onChange={(value) => onChange(['solicitorOrPR', 'name'], value)}
        required
      />
      <TextInput
        label="Solicitor / PR address line 1"
        value={getString(draft, ['solicitorOrPR', 'address', 'line1'])}
        onChange={(value) => onChange(['solicitorOrPR', 'address', 'line1'], value)}
        required
      />
      <TextInput
        label="Solicitor / PR town"
        value={getString(draft, ['solicitorOrPR', 'address', 'town'])}
        onChange={(value) => onChange(['solicitorOrPR', 'address', 'town'], value)}
        required
      />
      <TextInput
        label="Solicitor / PR postcode"
        value={getString(draft, ['solicitorOrPR', 'address', 'postcode'])}
        onChange={(value) => onChange(['solicitorOrPR', 'address', 'postcode'], value.toUpperCase())}
        required
      />
      <TextInput
        label="Claims deadline"
        type="date"
        value={getString(draft, ['claimsDeadline'])}
        onChange={(value) => onChange(['claimsDeadline'], value)}
        required
      />
    </Section>
  );
}
