import React from "react";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import * as UI from "@/styles/ui";
import {
  getFormBlueprint,
  type FieldBlueprint,
  type FormBlueprint,
  type PlaceholderKey,
} from "@/next/publish/config/formBlueprints";
import { addDays, addMonths, toISODate } from "@/next/publish/utils/date";
import AddressLookup, { mockProvider, type AddressResult } from "@/components/AddressLookup";
import AddressAutocomplete, { type AddressOption } from "@/components/AddressAutocomplete";
import AddressFields from "@/components/AddressFields";
import ActivitiesHoursSection, { type ActivitiesHoursData } from "@/components/publish/ActivitiesHoursSection";
import GamblingActivitiesSection, { type GamblingActivitiesHoursData } from "@/components/publish/GamblingActivitiesSection";
import CouncilDepartmentSelect, { type CouncilDepartment } from "@/components/CouncilDepartmentSelect";
import { getDepartmentTypeForCategory } from "@/next/publish/config/categoryToDepartment";

export type TemplateBuilderFormProps = {
  definition: NoticeDefinition;
  draft: Record<string, unknown> | null;
  onChange: (path: (string | number)[], value: unknown) => void;
  errors?: Record<string, string[] | undefined>;
};

type SetValueOptions = {
  fromUser?: boolean;
  fromAuto?: boolean;
};

const GRID_SPAN_CLASSES: Record<number, string> = {
  12: "md:col-span-12",
  8: "md:col-span-8",
  6: "md:col-span-6",
  4: "md:col-span-4",
};

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10) - 1;
  const day = Number.parseInt(match[3]!, 10);
  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function computeDeadline(rule: FormBlueprint["deadlineRule"], baseValue: string): string | null {
  if (!rule) return null;
  const baseDate = parseIsoDate(baseValue);
  if (!baseDate) return null;
  if ("offsetDays" in rule) {
    const adjusted = addDays(baseDate, rule.offsetDays);
    return toISODate(adjusted);
  }
  if ("addMonths" in rule) {
    const adjusted = addMonths(baseDate, rule.addMonths);
    return toISODate(adjusted);
  }
  return null;
}

type AliasMap = Map<PlaceholderKey, PlaceholderKey[]>;

function buildAliasMap(blueprint: FormBlueprint): AliasMap {
  const map: AliasMap = new Map();
  for (const entry of blueprint.aliasTokens ?? []) {
    map.set(entry.source, entry.targets);
  }
  return map;
}

function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(typeof value === "string" ? value.trim() : value);
}

// VERSION: 2025-11-17-18:28 - Using CouncilDepartmentSelect (database-driven)
export default function TemplateBuilderForm({
  definition,
  draft,
  onChange,
  errors,
}: TemplateBuilderFormProps) {
  console.log('🔥🔥🔥 [TemplateBuilderForm] v2025-11-17-18:28 LOADED - Using CouncilDepartmentSelect from line 16');
  const blueprint = React.useMemo(() => getFormBlueprint(definition), [definition]);
  const aliasMap = React.useMemo(() => buildAliasMap(blueprint), [blueprint]);
  const context = React.useMemo(() => ({ definition }), [definition]);

  // Track whether alcohol is selected to show/hide DPS fields
  const [hasAlcohol, setHasAlcohol] = React.useState(false);

  // Check on mount and when draft changes
  React.useEffect(() => {
    const activities = draft?.["LICENSABLE_ACTIVITIES"];
    if (typeof activities === "string") {
      const hasAlcoholActivity = activities.toLowerCase().includes("alcohol");
      setHasAlcohol(hasAlcoholActivity);
    }
  }, [draft]);

  const deadlineManualRef = React.useRef(false);
  const lastAutoDeadlineRef = React.useRef<string | null>(null);

  const getValue = React.useCallback(
    (token: PlaceholderKey): string => {
      const raw = draft?.[token];
      if (typeof raw === "string") return raw;
      if (typeof raw === "number") return String(raw);
      return "";
    },
    [draft]
  );

  const setValue = React.useCallback(
    (token: PlaceholderKey, value: string, options?: SetValueOptions) => {
      if (token === "DEADLINE_DATE") {
        if (options?.fromUser) {
          deadlineManualRef.current = true;
        } else if (options?.fromAuto) {
          deadlineManualRef.current = false;
          lastAutoDeadlineRef.current = value || null;
        }
      }
      onChange([token], value);
      const aliases = aliasMap.get(token);
      if (aliases?.length) {
        for (const alias of aliases) {
          onChange([alias], value);
        }
      }
    },
    [aliasMap, onChange]
  );

  // Apply automatic values when they change or when draft is empty
  React.useEffect(() => {
    for (const { token, value } of blueprint.autoValues) {
      const current = getValue(token);
      if (current !== value) {
        setValue(token, value);
      }
    }
  }, [blueprint.autoValues, getValue, setValue]);

  // Auto-compute deadlines when applicable
  React.useEffect(() => {
    const rule = blueprint.deadlineRule;
    if (!rule) return;
    const baseToken = rule.base;
    const baseValue = getValue(baseToken);
    if (!baseValue) {
      if (!deadlineManualRef.current && getValue("DEADLINE_DATE")) {
        setValue("DEADLINE_DATE", "", { fromAuto: true });
      }
      return;
    }
    const computed = computeDeadline(rule, baseValue);
    if (!computed) return;
    const current = getValue("DEADLINE_DATE");
    if (!deadlineManualRef.current || current === lastAutoDeadlineRef.current) {
      if (current !== computed) {
        lastAutoDeadlineRef.current = computed;
        setValue("DEADLINE_DATE", computed, { fromAuto: true });
      }
    }
  }, [blueprint.deadlineRule, getValue, setValue]);

  // Parse activities & hours data from draft
  const activitiesHoursData = React.useMemo((): ActivitiesHoursData => {
    const data: ActivitiesHoursData = {
      openingHours: {
        Mon: null,
        Tue: null,
        Wed: null,
        Thu: null,
        Fri: null,
        Sat: null,
        Sun: null,
      },
      activities: {},
      dpsName: getValue("DPS_NAME"),
      dpsLicensingAuthority: getValue("DPS_LICENSING_AUTHORITY"),
    };

    // Parse stored JSON if exists
    const storedData = draft?.["ACTIVITIES_HOURS_DATA"];
    if (storedData && typeof storedData === "string") {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed && typeof parsed === "object") {
          return { ...data, ...parsed };
        }
      } catch {
        // Keep default
      }
    }

    return data;
  }, [draft, getValue]);

  const updateActivitiesHoursData = React.useCallback(
    (data: ActivitiesHoursData) => {
      // Store as JSON in ACTIVITIES_HOURS_DATA field
      onChange(["ACTIVITIES_HOURS_DATA"], JSON.stringify(data));

      // Also update individual fields for compatibility
      setValue("DPS_NAME", data.dpsName || "", { fromUser: true });
      setValue("DPS_LICENSING_AUTHORITY", data.dpsLicensingAuthority || "", { fromUser: true });

      // Generate LICENSABLE_ACTIVITIES summary from selected activities
      const selectedActivities = Object.entries(data.activities)
        .filter(([_, schedule]) => schedule.enabled)
        .map(([key, _]) => {
          // Convert key to readable label
          const labels: Record<string, string> = {
            alcohol_on: "Sale of alcohol (on premises)",
            alcohol_off: "Sale of alcohol (off premises)",
            alcohol_on_off: "Sale of alcohol (on & off premises)",
            live_music: "Live music",
            recorded_music: "Recorded music",
            dance: "Dance performances",
            films: "Exhibition of films",
            indoor_sport: "Indoor sporting events",
            boxing_wrestling: "Boxing or wrestling",
            late_night_refreshment: "Late night refreshment",
            club_supply_members: "Club supply to members",
            club_supply_guests: "Club supply to guests",
          };
          return labels[key] || key;
        });

      setValue("LICENSABLE_ACTIVITIES", selectedActivities.join(", "), { fromUser: true });

      // Generate ACTIVITY_SCHEDULE summary
      const activitySchedule = Object.entries(data.activities)
        .filter(([_, schedule]) => schedule.enabled)
        .map(([key, schedule]) => {
          const label = {
            alcohol_on: "Sale of alcohol (on)",
            alcohol_off: "Sale of alcohol (off)",
            alcohol_on_off: "Sale of alcohol (on/off)",
            live_music: "Live music",
            recorded_music: "Recorded music",
            dance: "Dance",
            films: "Films",
            indoor_sport: "Indoor sport",
            boxing_wrestling: "Boxing/wrestling",
            late_night_refreshment: "Late night refreshment",
            club_supply_members: "Club supply (members)",
            club_supply_guests: "Club supply (guests)",
          }[key] || key;

          // Format hours summary
          const hours = schedule.hours;
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
          const filled = days.filter(d => hours[d] !== null);

          if (filled.length === 0) return `${label}: No hours set`;
          if (filled.length === 7 && filled.every(d => {
            const h = hours[d];
            return h && h.start === hours[filled[0]]?.start && h.end === hours[filled[0]]?.end;
          })) {
            const h = hours[filled[0]];
            return `${label}: Mon–Sun ${h?.start}–${h?.end}`;
          }

          return `${label}: Various hours`;
        });

      setValue("ACTIVITY_SCHEDULE", activitySchedule.join("\n"), { fromUser: true });

      // Check if alcohol is selected
      const hasAlcoholSelected = Object.entries(data.activities).some(
        ([key, schedule]) => schedule.enabled && key.startsWith("alcohol_")
      );
      setHasAlcohol(hasAlcoholSelected);
    },
    [onChange, setValue, setHasAlcohol]
  );

  // ============================================================================
  // Gambling Activities & Hours Data
  // ============================================================================

  const gamblingActivitiesHoursData = React.useMemo<GamblingActivitiesHoursData>(() => {
    const data: GamblingActivitiesHoursData = {
      openingHours: {
        Mon: null,
        Tue: null,
        Wed: null,
        Thu: null,
        Fri: null,
        Sat: null,
        Sun: null,
      },
      activities: {},
    };

    // Parse stored JSON if exists
    const storedData = draft?.["GAMBLING_ACTIVITIES_HOURS_DATA"];
    if (storedData && typeof storedData === "string") {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed && typeof parsed === "object") {
          return { ...data, ...parsed };
        }
      } catch {
        // Keep default
      }
    }

    return data;
  }, [draft]);

  const updateGamblingActivitiesHoursData = React.useCallback(
    (data: GamblingActivitiesHoursData) => {
      // Store as JSON in GAMBLING_ACTIVITIES_HOURS_DATA field
      onChange(["GAMBLING_ACTIVITIES_HOURS_DATA"], JSON.stringify(data));

      // Generate LICENSABLE_ACTIVITIES summary from selected activities
      const selectedActivities = Object.entries(data.activities)
        .filter(([_, activityData]) => activityData.enabled)
        .map(([key, activityData]) => {
          // Convert key to readable label with machine count if applicable
          const labels: Record<string, string> = {
            fobt: "Fixed-odds betting terminals (FOBTs)",
            otc_betting: "Over-the-counter betting",
            ssbt: "Self-service betting terminals",
            cash_bingo: "Cash bingo",
            prize_bingo: "Prize bingo",
            bingo_machines_b3_b4: "Gaming machines - Category B3/B4",
            bingo_machines_c: "Gaming machines - Category C",
            bingo_machines_d: "Gaming machines - Category D",
            agc_machines_b3_b4: "Gaming machines - Category B3/B4",
            agc_machines_c: "Gaming machines - Category C",
            agc_machines_d: "Gaming machines - Category D",
            fec_machines_c: "Gaming machines - Category C",
            fec_machines_d: "Gaming machines - Category D",
            equal_chance_gaming: "Equal chance gaming",
          };
          const label = labels[key] || key;

          // Add machine count if present
          if (activityData.machineCount) {
            return `${label} (${activityData.machineCount} machines)`;
          }
          return label;
        });

      setValue("LICENSABLE_ACTIVITIES", selectedActivities.join(", "), { fromUser: true });

      // Generate OPENING_HOURS summary
      const hours = data.openingHours;
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
      const filled = days.filter(d => hours[d] !== null);

      if (filled.length === 0) {
        setValue("OPENING_HOURS", "", { fromUser: true });
      } else if (filled.length === 7 && filled.every(d => {
        const h = hours[d];
        return h && h.start === hours[filled[0]]?.start && h.end === hours[filled[0]]?.end;
      })) {
        const h = hours[filled[0]];
        setValue("OPENING_HOURS", `Mon–Sun ${h?.start}–${h?.end}`, { fromUser: true });
      } else {
        // Group consecutive days with same hours
        const groups: string[] = [];
        let currentGroup: string[] = [];
        let currentHours: { start: string; end: string } | null = null;

        for (const day of days) {
          const h = hours[day];
          if (!h) {
            if (currentGroup.length > 0 && currentHours) {
              const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
              groups.push(`${dayStr} ${currentHours.start}–${currentHours.end}`);
              currentGroup = [];
              currentHours = null;
            }
            continue;
          }

          if (!currentHours || (h.start === currentHours.start && h.end === currentHours.end)) {
            currentGroup.push(day);
            currentHours = h;
          } else {
            if (currentGroup.length > 0 && currentHours) {
              const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
              groups.push(`${dayStr} ${currentHours.start}–${currentHours.end}`);
            }
            currentGroup = [day];
            currentHours = h;
          }
        }

        if (currentGroup.length > 0 && currentHours) {
          const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
          groups.push(`${dayStr} ${currentHours.start}–${currentHours.end}`);
        }

        setValue("OPENING_HOURS", groups.join(", "), { fromUser: true });
      }
    },
    [onChange, setValue]
  );

  const sectionElements = React.useMemo(() => {
    const rendered: React.ReactNode[] = [];
    for (const section of blueprint.sections) {
      // Special handling for activities-hours section (Licensing Act 2003)
      if (section.id === "activities-hours") {
        rendered.push(
          <section key={section.id}>
            <ActivitiesHoursSection
              value={activitiesHoursData}
              onChange={updateActivitiesHoursData}
              showClubActivities={definition.id.includes("club")}
              errors={{
                dpsName: errors?.["DPS_NAME"],
                dpsLicensingAuthority: errors?.["DPS_LICENSING_AUTHORITY"],
              }}
            />
          </section>
        );
        continue;
      }

      // Special handling for gambling-activities-hours section (Gambling Act 2005)
      if (section.id === "gambling-activities-hours") {
        const premisesType = getValue("GAMBLING_PREMISES_TYPE") as "betting" | "bingo" | "agc" | "fec" || "betting";
        rendered.push(
          <section key={section.id}>
            <GamblingActivitiesSection
              value={gamblingActivitiesHoursData}
              onChange={updateGamblingActivitiesHoursData}
              premisesType={premisesType}
              errors={{
                licensableActivities: errors?.["LICENSABLE_ACTIVITIES"],
                openingHours: errors?.["OPENING_HOURS"],
              }}
            />
          </section>
        );
        continue;
      }

      const visibleFields = section.fields.filter((field) => {
        // Apply showIf condition from blueprint if present
        if (field.showIf && !field.showIf(context)) return false;

        // Skip fields handled by GamblingActivitiesSection
        if (section.id === "gambling-activities-hours" &&
            (field.token === "LICENSABLE_ACTIVITIES" ||
             field.token === "OPENING_HOURS")) {
          return false;
        }

        // Skip fields handled by ActivitiesHoursSection (only for the activities-hours section)
        if (section.id === "activities-hours" &&
            (field.token === "LICENSABLE_ACTIVITIES" ||
             field.token === "ACTIVITY_SCHEDULE" ||
             field.token === "OPENING_HOURS" ||
             field.token === "DPS_NAME" ||
             field.token === "DPS_LICENSING_AUTHORITY")) {
          return false;
        }

        return true;
      });
      if (!visibleFields.length) continue;
      rendered.push(
        <section key={section.id} className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">{section.title}</h3>
            {section.description ? (
              <p className="text-[13px] leading-relaxed text-slate-500">{section.description}</p>
            ) : null}
          </div>
          <div className="space-y-5">
            {visibleFields.map((field) => (
              <FieldInput
                key={`${section.id}-${field.token}`}
                field={field}
                value={getValue(field.token)}
                onChange={(value, options) => setValue(field.token, value, options)}
                errors={errors?.[field.token]}
                setValue={setValue}
                definition={definition}
              />
            ))}
          </div>
        </section>
      );
    }
    return rendered;
  }, [blueprint.sections, context, errors, getValue, setValue, definition.id, activitiesHoursData, updateActivitiesHoursData, gamblingActivitiesHoursData, updateGamblingActivitiesHoursData]);

  const atLeastOneMessages = React.useMemo(() => {
    if (!blueprint.atLeastOne?.length) return [];
    return blueprint.atLeastOne
      .map((rule) => {
        const satisfied = rule.tokens.some((token) => isTruthy(draft?.[token]));
        return satisfied ? null : (
          <li key={rule.message} className="text-sm text-amber-600">
            {rule.message}
          </li>
        );
      })
      .filter(Boolean);
  }, [blueprint.atLeastOne, draft]);

  // Calculate missing required fields for progress indicator
  const missingCount = React.useMemo(() => {
    let count = 0;
    for (const section of blueprint.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const value = getValue(field.token);
          const hasError = errors?.[field.token]?.length;
          if (!value || hasError) {
            count++;
          }
        }
      }
    }
    return count;
  }, [blueprint.sections, getValue, errors]);

  return (
    <div className="space-y-8">
      {/* Form title with subtle elegance */}
      <div className="border-b border-slate-200/60 pb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{definition.label}</h2>
      </div>

      {/* Form fields heading */}
      <div className="space-y-2">
        <h3 className="text-[16px] font-semibold leading-tight tracking-tight text-slate-900">
          Complete the required details
        </h3>
        <p className="text-[13px] leading-relaxed text-slate-600">
          Fill in all the required fields below to create your notice.
        </p>
      </div>

      {/* Progress indicator */}
      {missingCount > 0 && (
        <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-4 py-3">
          <p className="text-[13px] font-semibold text-blue-900">
            {missingCount} required {missingCount === 1 ? "field" : "fields"} remaining
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-blue-700">
            Please fill in all mandatory fields marked with an asterisk (*).
          </p>
        </div>
      )}

      {sectionElements.length ? (
        <div className="space-y-6">
          {sectionElements}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-8 text-center">
          <p className="text-[14px] text-slate-600">No structured fields are available for this template.</p>
        </div>
      )}

      {atLeastOneMessages.length ? (
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3">
          <ul className="space-y-1.5">
            {atLeastOneMessages}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type FieldInputProps = {
  field: FieldBlueprint;
  value: string;
  onChange: (value: string, options?: SetValueOptions) => void;
  errors?: string[];
  onAlcoholChange?: (hasAlcohol: boolean) => void;
  setValue?: (token: PlaceholderKey, value: string, options?: SetValueOptions) => void;
  definition?: NoticeDefinition;
};

function FieldInput({ field, value, onChange, errors, onAlcoholChange, setValue, definition }: FieldInputProps) {
  const inputId = React.useId();
  const helperId = field.hint ? `${inputId}-hint` : undefined;
  const errorId = errors?.length ? `${inputId}-error` : undefined;

  // Detect address fields by token name
  const isAddressField = field.token.includes("ADDRESS") && field.type === "textarea";

  const commonLabel = (
    <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-700">
      {field.label}
      {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );

  // Handle AUTHORITY_NAME field with CouncilDepartmentSelect (database-driven)
  if (field.token === "AUTHORITY_NAME") {
    // Get department type from notice definition category
    const departmentType = definition?.category ? getDepartmentTypeForCategory(definition.category) : undefined;

    const handleCouncilDepartmentSelect = React.useCallback((department: CouncilDepartment) => {
      onChange(department.organizationName, { fromUser: true });
      // Auto-populate related fields
      if (setValue) {
        if (department.email) {
          setValue("AUTHORITY_EMAIL", department.email, { fromAuto: true });
        }
        // Store department ID for template lookup
        // @ts-ignore - DEPARTMENT_ID is not a PlaceholderKey but needed for template matching
        setValue("DEPARTMENT_ID", department.id, { fromAuto: true });
      }
    }, [onChange, setValue]);

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-700">
          {field.label}
          {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
        </label>
        <CouncilDepartmentSelect
          value={value}
          departmentType={departmentType}
          onSelect={handleCouncilDepartmentSelect}
          onChangeText={(text) => onChange(text, { fromUser: true })}
          id={inputId}
          name="authorityname"
          label=""
          placeholder={departmentType ? `Search ${departmentType} departments...` : "Search councils..."}
          required={field.required}
          error={errors?.[0]}
        />
        {errors && errors.length > 1 ? (
          <ul id={errorId} className="space-y-1">
            {errors.slice(1).map((error, index) => (
              <li key={`${field.token}-error-${index + 1}`} className="text-[12px] leading-relaxed text-rose-600">
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const raw = event.target.value;
    if (field.type === "number") {
      const normalised = raw.replace(/[^\d]/g, "");
      onChange(normalised, { fromUser: true });
      return;
    }
    onChange(raw, { fromUser: true });
  };

  const handleAddressResolved = React.useCallback((address: AddressResult) => {
    const parts = [];
    if (address.line1) parts.push(address.line1);
    if (address.line2) parts.push(address.line2);
    if (address.line3) parts.push(address.line3);
    if (address.town) parts.push(address.town);
    if (address.county) parts.push(address.county);
    if (address.postcode) parts.push(address.postcode);
    if (address.country && address.country !== 'UK') parts.push(address.country);
    onChange(parts.join(", "), { fromUser: true });
  }, [onChange]);

  const baseInputClasses = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
  const errorInputClasses = "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 border-rose-300 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-500/10";

  let control: React.ReactNode = null;

  switch (field.type) {
    case "text":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
          type="text"
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
        />
      );
      break;
    case "textarea":
      // Render AddressAutocomplete + AddressFields for address-related fields
      if (isAddressField) {
        // Parse existing value into address components
        const parseAddress = (addressString: string) => {
          if (!addressString) {
            return {
              addressLine1: '',
              addressLine2: '',
              city: '',
              postcode: '',
            };
          }

          const parts = addressString.split(',').map(p => p.trim()).filter(Boolean);
          const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;
          const postcodeMatch = addressString.match(postcodeRegex);
          const postcode = postcodeMatch ? postcodeMatch[1] : '';

          // Remove postcode from parts if found
          const addressParts = postcode
            ? addressString.replace(postcodeRegex, '').split(',').map(p => p.trim()).filter(Boolean)
            : parts;

          // Logic: first part is line1, last part is city, middle parts are line2
          const line1 = addressParts[0] || '';
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';
          const line2 = addressParts.length > 2 ? addressParts.slice(1, -1).join(', ') : (addressParts[1] || '');

          return {
            addressLine1: line1,
            addressLine2: line2,
            city: city,
            postcode: postcode,
          };
        };

        const addressValue = parseAddress(value);

        const handleAddressSelect = React.useCallback(
          (option: AddressOption) => {
            // Map AddressOption to the format expected by onChange (comma-separated string)
            // IMPORTANT: Put postcode at the END so parseAddress can find it with regex
            const parts = [
              option.line1,
              option.line2,
              option.line3,
              option.city || option.town,
              option.postcode,
            ].filter(Boolean);
            const joined = parts.join(', ');
            console.log('[TemplateBuilderForm] Address selected:', { option, joined });
            onChange(joined, { fromUser: true });
          },
          [onChange]
        );

        control = (
          <div className="space-y-4">
            <AddressAutocomplete
              label={field.label}
              onSelect={handleAddressSelect}
              inputTestId={`${field.token.toLowerCase()}-lookup`}
            />
            <AddressFields
              label=""
              namePrefix={field.token.toLowerCase()}
              testIdPrefix={field.token.toLowerCase()}
              required={field.required}
              value={addressValue}
              onChange={(address) => {
                // Convert back to comma-separated string for storage
                const parts = [
                  address.addressLine1,
                  address.addressLine2,
                  address.city,
                  address.postcode,
                ].filter(Boolean);
                onChange(parts.join(', '), { fromUser: true });
              }}
            />
          </div>
        );
      } else {
        control = (
          <textarea
            id={inputId}
            name={field.token.toLowerCase().replace(/_/g, '')}
            value={value}
            rows={field.rows ?? 4}
            className={`${errors?.length ? errorInputClasses : baseInputClasses} min-h-[100px] resize-y`}
            aria-required={field.required ? "true" : undefined}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            onChange={handleChange}
            maxLength={field.maxLength}
            autoComplete="off"
          />
        );
      }
      break;
    case "email":
    case "date":
    case "tel":
    case "url":
    case "number":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().includes('_date') ? field.token.toLowerCase() : field.token.toLowerCase().replace(/_/g, '')}
          type={field.type === "number" ? "text" : field.type}
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
        />
      );
      break;
    case "select":
      control = (
        <select
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
        >
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    default:
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
          type="text"
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
        />
      );
      break;
  }

  return (
    <div className="space-y-2">
      {/* Don't show label for address fields as AddressAutocomplete has its own label */}
      {!isAddressField && commonLabel}

      {control}

      {field.hint && !isAddressField ? (
        <p id={helperId} className="text-[12px] leading-relaxed text-slate-500">
          {field.hint}
        </p>
      ) : null}

      {errors?.length ? (
        <ul id={errorId} className="space-y-1">
          {errors.map((error, index) => (
            <li key={`${field.token}-error-${index}`} className="text-[12px] leading-relaxed text-rose-600">
              {error}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
