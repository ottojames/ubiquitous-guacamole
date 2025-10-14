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
import ActivitiesHoursSection, { type ActivitiesHoursData } from "@/components/publish/ActivitiesHoursSection";
import CouncilSelect, { type Council } from "@/components/CouncilSelect";

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

export default function TemplateBuilderForm({
  definition,
  draft,
  onChange,
  errors,
}: TemplateBuilderFormProps) {
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

      // Check if alcohol is selected
      const hasAlcoholSelected = Object.entries(data.activities).some(
        ([key, schedule]) => schedule.enabled && key.startsWith("alcohol_")
      );
      setHasAlcohol(hasAlcoholSelected);
    },
    [onChange, setValue, setHasAlcohol]
  );

  const sectionElements = React.useMemo(() => {
    const rendered: React.ReactNode[] = [];
    for (const section of blueprint.sections) {
      // Special handling for activities-hours section
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

      const visibleFields = section.fields.filter((field) => {
        // Apply showIf condition from blueprint if present
        if (field.showIf && !field.showIf(context)) return false;

        // Skip fields handled by ActivitiesHoursSection
        if (field.token === "LICENSABLE_ACTIVITIES" ||
            field.token === "ACTIVITY_SCHEDULE" ||
            field.token === "OPENING_HOURS" ||
            field.token === "DPS_NAME" ||
            field.token === "DPS_LICENSING_AUTHORITY") {
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
              />
            ))}
          </div>
        </section>
      );
    }
    return rendered;
  }, [blueprint.sections, context, errors, getValue, setValue, definition.id, activitiesHoursData, updateActivitiesHoursData]);

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

  return (
    <div className="space-y-8">
      {/* Form title with subtle elegance */}
      <div className="border-b border-slate-200/60 pb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{definition.label}</h2>
      </div>

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
};

function FieldInput({ field, value, onChange, errors, onAlcoholChange, setValue }: FieldInputProps) {
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

  // Handle AUTHORITY_NAME field with CouncilSelect
  if (field.token === "AUTHORITY_NAME") {
    const handleCouncilSelect = React.useCallback((council: Council) => {
      onChange(council.name, { fromUser: true });
      // Auto-populate related fields
      if (setValue) {
        if (council.email) {
          setValue("AUTHORITY_EMAIL", council.email, { fromAuto: true });
        }
        if (council.address) {
          setValue("AUTHORITY_ADDRESS", council.address, { fromAuto: true });
        }
      }
    }, [onChange, setValue]);

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-700">
          {field.label}
          {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
        </label>
        <CouncilSelect
          value={value}
          onSelect={handleCouncilSelect}
          onChangeText={(text) => onChange(text, { fromUser: true })}
          id={inputId}
          label=""
          placeholder="Search for council..."
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
  const errorInputClasses = "border-rose-300 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-500/10";

  // These fields are now handled by ActivitiesHoursSection - don't render them individually
  if (field.token === "LICENSABLE_ACTIVITIES" ||
      field.token === "ACTIVITY_SCHEDULE" ||
      field.token === "OPENING_HOURS" ||
      field.token === "DPS_NAME" ||
      field.token === "DPS_LICENSING_AUTHORITY") {
    return null;
  }

  let control: React.ReactNode = null;

  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          id={inputId}
          value={value}
          rows={field.rows ?? 4}
          className={`${errors?.length ? errorInputClasses : baseInputClasses} min-h-[100px] resize-y`}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
    case "email":
    case "date":
    case "tel":
    case "url":
    case "number":
      control = (
        <input
          id={inputId}
          type={field.type === "number" ? "text" : field.type}
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
    case "select":
      control = (
        <select
          id={inputId}
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
          type="text"
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
  }

  return (
    <div className="space-y-2">
      {commonLabel}

      {isAddressField && (
        <div className="space-y-2">
          <AddressLookup
            provider={mockProvider}
            placeholder="Search for address or postcode"
            onResolved={handleAddressResolved}
            className="w-full"
          />
          <p className="text-[12px] text-slate-500">
            Search above to auto-fill, or type directly into the field below
          </p>
        </div>
      )}

      {control}

      {field.hint ? (
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
