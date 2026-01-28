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
import { supabase } from "@/lib/supabase";

export type TemplateBuilderFormProps = {
  definition: NoticeDefinition;
  draft: Record<string, unknown> | null;
  onChange: (path: (string | number)[], value: unknown) => void;
  errors?: Record<string, string[] | undefined>;
  setValue?: (token: string, value: string) => void;
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

// Fields that should be read-only when auto-filled from council settings
const COUNCIL_AUTO_FILL_FIELDS: PlaceholderKey[] = [
  "AUTHORITY_ADDRESS",
  "AUTHORITY_EMAIL",
  "ONLINE_REGISTER_URL",
  "REPRESENTATION_ADDRESS",
  "REPRESENTATION_EMAIL",
];

// VERSION: 2025-11-17-18:28 - Using CouncilDepartmentSelect (database-driven)
export default function TemplateBuilderForm({
  definition,
  draft,
  onChange,
  errors,
  setValue: setValueProp,
}: TemplateBuilderFormProps) {
  console.log('🔥🔥🔥 [TemplateBuilderForm] v2025-11-17-18:28 LOADED - Using CouncilDepartmentSelect from line 16');
  const blueprint = React.useMemo(() => getFormBlueprint(definition), [definition]);
  const aliasMap = React.useMemo(() => buildAliasMap(blueprint), [blueprint]);
  const context = React.useMemo(() => ({ definition }), [definition]);

  // Track whether alcohol is selected (no longer needed for DPS)
  const [hasAlcohol, setHasAlcohol] = React.useState(false);

  // Track which fields have been auto-filled from council settings
  const [autoFilledFields, setAutoFilledFields] = React.useState<Set<PlaceholderKey>>(new Set());

  // Callback to mark fields as auto-filled
  const handleAutoFillFields = React.useCallback((fields: PlaceholderKey[]) => {
    setAutoFilledFields((prev) => {
      const next = new Set(prev);
      for (const field of fields) {
        next.add(field);
      }
      return next;
    });
  }, []);

  // Callback to clear auto-fill status when user manually edits a field
  const handleClearAutoFill = React.useCallback((token: PlaceholderKey) => {
    setAutoFilledFields((prev) => {
      const next = new Set(prev);
      next.delete(token);
      return next;
    });
  }, []);

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
      // Use the prop setValue if available, otherwise fall back to onChange
      if (setValueProp) {
        setValueProp(token as string, value);
      } else {
        onChange([token], value);
      }
      const aliases = aliasMap.get(token);
      if (aliases?.length) {
        for (const alias of aliases) {
          onChange([alias], value);
        }
      }
    },
    [aliasMap, onChange, setValueProp]
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

  // Fix 1: Auto-generate NATURE_OF_VARIATION on mount for variation notices
  // This ensures the variation description is always set (with default if no activities selected)
  React.useEffect(() => {
    if (definition.id.includes("variation") && activitiesHoursData) {
      // Always trigger for variations if NATURE_OF_VARIATION is empty
      // This sets either the activity-based description or a sensible default
      const currentNatureOfVariation = draft?.["NATURE_OF_VARIATION"];
      if (!currentNatureOfVariation || String(currentNatureOfVariation).trim() === "") {
        // Trigger the generation logic with existing data (will set default if no activities)
        updateActivitiesHoursData(activitiesHoursData);
      }
    }

  }, [definition.id]); // Only run on initial mount for this definition

  const updateActivitiesHoursData = React.useCallback(
    (data: ActivitiesHoursData) => {
      // Store as JSON in ACTIVITIES_HOURS_DATA field
      onChange(["ACTIVITIES_HOURS_DATA"], JSON.stringify(data));

      // DPS fields removed as per FIX-004

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

      // Generate ACTIVITY_SCHEDULE summary with intelligent day grouping
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

          // Format hours summary with intelligent day grouping
          const hours = schedule.hours;
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
          const filled = days.filter(d => hours[d] !== null);

          if (filled.length === 0) return `${label}: No hours set`;

          // Check if all days have the same hours
          const allSame = filled.length === 7 && filled.every(d => {
            const h = hours[d];
            return h && h.start === hours[filled[0]]?.start && h.end === hours[filled[0]]?.end;
          });

          if (allSame) {
            const h = hours[filled[0]];
            return `${label}: Mon–Sun ${h?.start}–${h?.end}`;
          }

          // Group consecutive days with same hours
          type DayGroup = { days: string[]; start: string; end: string };
          const groups: DayGroup[] = [];
          let currentGroup: DayGroup | null = null;

          for (const day of days) {
            const h = hours[day];
            if (!h) {
              // Day has no hours - close current group if exists
              if (currentGroup) {
                groups.push(currentGroup);
                currentGroup = null;
              }
              continue;
            }

            if (currentGroup && h.start === currentGroup.start && h.end === currentGroup.end) {
              // Same hours as current group - extend it
              currentGroup.days.push(day);
            } else {
              // Different hours - close current group and start new one
              if (currentGroup) {
                groups.push(currentGroup);
              }
              currentGroup = { days: [day], start: h.start, end: h.end };
            }
          }

          // Push final group if exists
          if (currentGroup) {
            groups.push(currentGroup);
          }

          // Format groups into readable strings
          const formatGroup = (group: DayGroup): string => {
            const dayStr = group.days.length === 1
              ? group.days[0]
              : `${group.days[0]}–${group.days[group.days.length - 1]}`;
            return `${dayStr} ${group.start}–${group.end}`;
          };

          const hoursStr = groups.map(formatGroup).join(", ");
          return `${label}: ${hoursStr}`;
        });

      setValue("ACTIVITY_SCHEDULE", activitySchedule.join("\n"), { fromUser: true });

      // Check if alcohol is selected
      const hasAlcoholSelected = Object.entries(data.activities).some(
        ([key, schedule]) => schedule.enabled && key.startsWith("alcohol_")
      );
      setHasAlcohol(hasAlcoholSelected);

      // Auto-generate NATURE_OF_VARIATION for variation notice types
      // Based on Westminster Council's format (Section 34 Licensing Act 2003)
      if (definition.id.includes("variation")) {
        const variationParts: string[] = [];

        // Check for alcohol activities
        const alcoholActivity = Object.entries(data.activities).find(
          ([key, schedule]) => schedule.enabled && key.startsWith("alcohol_")
        );
        if (alcoholActivity) {
          const [key] = alcoholActivity;
          if (key === "alcohol_on") {
            variationParts.push("Authorise the sale of alcohol for consumption on the premises");
          } else if (key === "alcohol_off") {
            variationParts.push("Authorise the sale of alcohol for consumption off the premises");
          } else if (key === "alcohol_on_off") {
            variationParts.push("Authorise the sale of alcohol for consumption on and off the premises");
          }
        }

        // Check for entertainment activities
        const entertainmentActivities = Object.entries(data.activities)
          .filter(([key, schedule]) => schedule.enabled && !key.startsWith("alcohol_") && !key.startsWith("club_") && key !== "late_night_refreshment")
          .map(([key]) => {
            const entertainmentLabels: Record<string, string> = {
              live_music: "performance of live music",
              recorded_music: "playing of recorded music",
              dance: "performance of dance",
              films: "exhibition of films",
              indoor_sport: "indoor sporting events",
              boxing_wrestling: "boxing or wrestling entertainment",
            };
            return entertainmentLabels[key] || key;
          });

        if (entertainmentActivities.length > 0) {
          variationParts.push(`Add ${entertainmentActivities.join(", ")}`);
        }

        // Check for late night refreshment
        const hasLateNight = Object.entries(data.activities).some(
          ([key, schedule]) => schedule.enabled && key === "late_night_refreshment"
        );
        if (hasLateNight) {
          variationParts.push("Provide late night refreshment");
        }

        // Check for club supply activities
        const clubActivities = Object.entries(data.activities)
          .filter(([key, schedule]) => schedule.enabled && key.startsWith("club_"))
          .map(([key]) => {
            if (key === "club_supply_members") return "supply of alcohol to club members";
            if (key === "club_supply_guests") return "supply of alcohol to guests of members";
            return key;
          });

        if (clubActivities.length > 0) {
          variationParts.push(`Add ${clubActivities.join(" and ")}`);
        }

        // Add hours summary if activities selected
        if (variationParts.length > 0 && activitySchedule.length > 0) {
          variationParts.push(`\n\nProposed hours after variation:\n${activitySchedule.join("\n")}`);
        }

        // Always set NATURE_OF_VARIATION for variations - use default if no activities selected
        if (variationParts.length > 0) {
          setValue("NATURE_OF_VARIATION", variationParts.join("\n"), { fromUser: true });
        } else {
          // Provide a sensible default when no specific activities are selected
          setValue("NATURE_OF_VARIATION", "Vary the conditions of the premises licence", { fromUser: true });
        }
      }
    },
    [onChange, setValue, setHasAlcohol, definition.id]
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

  // Fix 3: Auto-generate NATURE_OF_VARIATION on mount for gambling variations
  // Same logic as Fix 1 but for gambling notice types
  React.useEffect(() => {
    if (definition.id.includes("variation") && definition.id.includes("gambling") && gamblingActivitiesHoursData) {
      // Always trigger for gambling variations if NATURE_OF_VARIATION is empty
      // This sets either the activity-based description or a sensible default
      const currentNatureOfVariation = draft?.["NATURE_OF_VARIATION"];
      if (!currentNatureOfVariation || String(currentNatureOfVariation).trim() === "") {
        // Trigger the generation logic with existing data (will set default if no activities)
        updateGamblingActivitiesHoursData(gamblingActivitiesHoursData);
      }
    }

  }, [definition.id]); // Only run on initial mount for this definition

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

      // Compute opening hours string (used for both OPENING_HOURS and NATURE_OF_VARIATION)
      let openingHoursStr = "";

      if (filled.length === 0) {
        openingHoursStr = "";
      } else if (filled.length === 7 && filled.every(d => {
        const h = hours[d];
        return h && h.start === hours[filled[0]]?.start && h.end === hours[filled[0]]?.end;
      })) {
        const h = hours[filled[0]];
        openingHoursStr = `Mon–Sun ${h?.start}–${h?.end}`;
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

        openingHoursStr = groups.join(", ");
      }

      setValue("OPENING_HOURS", openingHoursStr, { fromUser: true });

      // Auto-generate NATURE_OF_VARIATION for gambling variation notice types
      if (definition.id.includes("variation")) {
        const variationParts: string[] = [];

        // Get selected gambling activities
        const selectedGamblingActivities = Object.entries(data.activities)
          .filter(([_, actData]) => actData.enabled)
          .map(([key, actData]) => {
            const gamblingLabels: Record<string, string> = {
              fobt: "fixed-odds betting terminals (FOBTs)",
              otc_betting: "over-the-counter betting",
              ssbt: "self-service betting terminals",
              cash_bingo: "cash bingo",
              prize_bingo: "prize bingo",
              bingo_machines_b3_b4: "Category B3/B4 gaming machines",
              bingo_machines_c: "Category C gaming machines",
              bingo_machines_d: "Category D gaming machines",
              agc_machines_b3_b4: "Category B3/B4 gaming machines",
              agc_machines_c: "Category C gaming machines",
              agc_machines_d: "Category D gaming machines",
              fec_machines_c: "Category C gaming machines",
              fec_machines_d: "Category D gaming machines",
              equal_chance_gaming: "equal chance gaming",
            };
            let label = gamblingLabels[key] || key;
            if (actData.machineCount) {
              label += ` (${actData.machineCount} machines)`;
            }
            return label;
          });

        if (selectedGamblingActivities.length > 0) {
          variationParts.push(`To vary the premises licence to permit ${selectedGamblingActivities.join(", ")}`);
        }

        // Add operating hours if set
        if (openingHoursStr) {
          variationParts.push(`\n\nProposed operating hours after variation:\n${openingHoursStr}`);
        }

        // Always set NATURE_OF_VARIATION for variations - use default if no activities selected
        if (variationParts.length > 0) {
          setValue("NATURE_OF_VARIATION", variationParts.join(""), { fromUser: true });
        } else {
          // Provide a sensible default when no specific activities are selected
          setValue("NATURE_OF_VARIATION", "Vary the conditions of the gambling premises licence", { fromUser: true });
        }
      }
    },
    [onChange, setValue, definition.id]
  );

  // Fields that are handled by custom components and should not be rendered as standard inputs
  const ACTIVITIES_HOURS_HANDLED_FIELDS = ["LICENSABLE_ACTIVITIES", "ACTIVITY_SCHEDULE", "OPENING_HOURS"];
  const GAMBLING_ACTIVITIES_HANDLED_FIELDS = ["LICENSABLE_ACTIVITIES", "OPENING_HOURS"];

  const sectionElements = React.useMemo(() => {
    const rendered: React.ReactNode[] = [];
    for (const section of blueprint.sections) {
      // Special handling for activities-hours section (Licensing Act 2003)
      // Render both the ActivitiesHoursSection AND any conditional fields (NATURE_OF_VARIATION, REVIEW_*, etc.)
      if (section.id === "activities-hours") {
        // Get conditional fields that should render alongside the activities section
        const conditionalFields = section.fields.filter((field) => {
          // Skip fields handled by ActivitiesHoursSection
          if (ACTIVITIES_HOURS_HANDLED_FIELDS.includes(field.token)) return false;
          // Apply showIf condition
          if (field.showIf && !field.showIf(context)) return false;
          return true;
        });

        rendered.push(
          <section key={section.id} className="space-y-6">
            <ActivitiesHoursSection
              value={activitiesHoursData}
              onChange={updateActivitiesHoursData}
              showClubActivities={definition.id.includes("club")}
              errors={{}}
            />
            {/* Render conditional fields like NATURE_OF_VARIATION, REVIEW_*, etc. */}
            {conditionalFields.length > 0 && (
              <div className="space-y-5 border-t border-slate-200 pt-6">
                {conditionalFields.map((field) => (
                  <FieldInput
                    key={`${section.id}-${field.token}`}
                    field={field}
                    value={getValue(field.token)}
                    onChange={(value, options) => setValue(field.token, value, options)}
                    errors={errors?.[field.token]}
                    setValue={setValue}
                    definition={definition}
                    isAutoFilled={autoFilledFields.has(field.token)}
                    onAutoFillFields={handleAutoFillFields}
                  />
                ))}
              </div>
            )}
          </section>
        );
        continue;
      }

      // Special handling for gambling-activities-hours section (Gambling Act 2005)
      // Render both the GamblingActivitiesSection AND any conditional fields
      if (section.id === "gambling-activities-hours") {
        const premisesType = getValue("GAMBLING_PREMISES_TYPE") as "betting" | "bingo" | "agc" | "fec" || "betting";

        // Get conditional fields that should render alongside the gambling activities section
        const conditionalFields = section.fields.filter((field) => {
          // Skip fields handled by GamblingActivitiesSection
          if (GAMBLING_ACTIVITIES_HANDLED_FIELDS.includes(field.token)) return false;
          // Apply showIf condition
          if (field.showIf && !field.showIf(context)) return false;
          return true;
        });

        rendered.push(
          <section key={section.id} className="space-y-6">
            <GamblingActivitiesSection
              value={gamblingActivitiesHoursData}
              onChange={updateGamblingActivitiesHoursData}
              premisesType={premisesType}
              errors={{
                licensableActivities: errors?.["LICENSABLE_ACTIVITIES"],
                openingHours: errors?.["OPENING_HOURS"],
              }}
            />
            {/* Render conditional fields like NATURE_OF_VARIATION for gambling variations */}
            {conditionalFields.length > 0 && (
              <div className="space-y-5 border-t border-slate-200 pt-6">
                {conditionalFields.map((field) => (
                  <FieldInput
                    key={`${section.id}-${field.token}`}
                    field={field}
                    value={getValue(field.token)}
                    onChange={(value, options) => setValue(field.token, value, options)}
                    errors={errors?.[field.token]}
                    setValue={setValue}
                    definition={definition}
                    isAutoFilled={autoFilledFields.has(field.token)}
                    onAutoFillFields={handleAutoFillFields}
                  />
                ))}
              </div>
            )}
          </section>
        );
        continue;
      }

      const visibleFields = section.fields.filter((field) => {
        // Apply showIf condition from blueprint if present
        if (field.showIf && !field.showIf(context)) return false;

        // Skip fields handled by GamblingActivitiesSection
        if (section.id === "gambling-activities-hours" &&
            GAMBLING_ACTIVITIES_HANDLED_FIELDS.includes(field.token)) {
          return false;
        }

        // Skip fields handled by ActivitiesHoursSection (only for the activities-hours section)
        if (section.id === "activities-hours" &&
            ACTIVITIES_HOURS_HANDLED_FIELDS.includes(field.token)) {
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
                isAutoFilled={autoFilledFields.has(field.token)}
                onAutoFillFields={handleAutoFillFields}
              />
            ))}
          </div>
        </section>
      );
    }
    return rendered;
  }, [blueprint.sections, context, errors, getValue, setValue, definition.id, activitiesHoursData, updateActivitiesHoursData, gamblingActivitiesHoursData, updateGamblingActivitiesHoursData, autoFilledFields, handleAutoFillFields]);

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
  isAutoFilled?: boolean;
  onAutoFillFields?: (fields: PlaceholderKey[]) => void;
};

function FieldInput({ field, value, onChange, errors, onAlcoholChange, setValue, definition, isAutoFilled, onAutoFillFields }: FieldInputProps) {
  const inputId = React.useId();
  const helperId = field.hint ? `${inputId}-hint` : undefined;
  const errorId = errors?.length ? `${inputId}-error` : undefined;

  // Detect address fields by token name
  const isAddressField = field.token.includes("ADDRESS") && field.type === "textarea";

  // Handle AUTHORITY_NAME field with CouncilDepartmentSelect (database-driven)
  if (field.token === "AUTHORITY_NAME") {
    // Get department type from notice definition category
    const departmentType = definition?.category ? getDepartmentTypeForCategory(definition.category) : undefined;

    const handleCouncilDepartmentSelect = React.useCallback(async (department: CouncilDepartment) => {
      console.log('[CouncilSettings] Selected department:', department);

      // Set the authority name field value
      onChange(department.organizationName, { fromUser: true });

      // Auto-populate related fields
      if (setValue) {
        console.log('[CouncilSettings] setValue function available, proceeding with auto-population');

        // Track which fields are being auto-filled
        const autoFilledTokens: PlaceholderKey[] = [];

        // Set email from department if available (fallback if council_settings doesn't have it)
        if (department.email) {
          setValue("AUTHORITY_EMAIL", department.email, { fromAuto: true });
          autoFilledTokens.push("AUTHORITY_EMAIL");
        }
        // Store department ID for template lookup
        // @ts-ignore - DEPARTMENT_ID is not a PlaceholderKey but needed for template matching
        setValue("DEPARTMENT_ID", department.id, { fromAuto: true });

        // Fetch and auto-populate council settings
        try {
          console.log('[CouncilSettings] Fetching settings for org:', department.organizationId);
          const { data: councilSettings, error } = await supabase
            .from('council_settings')
            .select('*')
            .eq('organization_id', department.organizationId)
            .single();

          if (councilSettings && !error) {
            console.log("[CouncilSettings] Found settings, auto-populating:", councilSettings);

            // Auto-populate authority fields from council settings
            if (councilSettings.authority_address) {
              console.log('[CouncilSettings] Setting AUTHORITY_ADDRESS:', councilSettings.authority_address);
              setValue("AUTHORITY_ADDRESS", councilSettings.authority_address, { fromAuto: true });
              if (!autoFilledTokens.includes("AUTHORITY_ADDRESS")) {
                autoFilledTokens.push("AUTHORITY_ADDRESS");
              }
            }
            if (councilSettings.authority_email) {
              console.log('[CouncilSettings] Setting AUTHORITY_EMAIL:', councilSettings.authority_email);
              setValue("AUTHORITY_EMAIL", councilSettings.authority_email, { fromAuto: true });
              // AUTHORITY_EMAIL already added from department.email, no need to add again
            }
            if (councilSettings.online_register_url) {
              console.log('[CouncilSettings] Setting ONLINE_REGISTER_URL:', councilSettings.online_register_url);
              setValue("ONLINE_REGISTER_URL", councilSettings.online_register_url, { fromAuto: true });
              if (!autoFilledTokens.includes("ONLINE_REGISTER_URL")) {
                autoFilledTokens.push("ONLINE_REGISTER_URL");
              }
            }

            console.log('[CouncilSettings] Auto-population complete');
          } else {
            console.log("[CouncilSettings] No settings found for organization:", department.organizationId);
            console.log("[CouncilSettings] Error:", error);
          }
        } catch (err) {
          console.error("[CouncilSettings] Error fetching council settings:", err);
        }

        // Notify parent about auto-filled fields (includes department.email even if council_settings not found)
        if (onAutoFillFields && autoFilledTokens.length > 0) {
          console.log('[CouncilSettings] Auto-filled tokens:', autoFilledTokens);
          onAutoFillFields(autoFilledTokens);
        }
      } else {
        console.log('[CouncilSettings] setValue function not available - auto-population skipped');
      }
    }, [onChange, setValue, onAutoFillFields]);

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
  const disabledInputClasses = "w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-[14px] text-slate-500 cursor-not-allowed";

  // Determine the input classes based on state
  const getInputClasses = () => {
    if (isAutoFilled) return disabledInputClasses;
    if (errors?.length) return errorInputClasses;
    return baseInputClasses;
  };

  let control: React.ReactNode = null;

  switch (field.type) {
    case "text":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
          type="text"
          value={value}
          className={getInputClasses()}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
          disabled={isAutoFilled}
          readOnly={isAutoFilled}
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

        // If auto-filled, show a simple read-only textarea instead of address lookup
        if (isAutoFilled) {
          control = (
            <textarea
              id={inputId}
              name={field.token.toLowerCase().replace(/_/g, '')}
              value={value}
              rows={field.rows ?? 3}
              className={`${disabledInputClasses} min-h-[80px] resize-none`}
              aria-required={field.required ? "true" : undefined}
              aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
              disabled
              readOnly
            />
          );
        } else {
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
        }
      } else {
        control = (
          <textarea
            id={inputId}
            name={field.token.toLowerCase().replace(/_/g, '')}
            value={value}
            rows={field.rows ?? 4}
            className={`${getInputClasses()} min-h-[100px] ${isAutoFilled ? 'resize-none' : 'resize-y'}`}
            aria-required={field.required ? "true" : undefined}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            onChange={handleChange}
            maxLength={field.maxLength}
            autoComplete="off"
            disabled={isAutoFilled}
            readOnly={isAutoFilled}
          />
        );
      }
      break;
    case "email":
    case "tel":
    case "url":
    case "number":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().includes('_date') ? field.token.toLowerCase() : field.token.toLowerCase().replace(/_/g, '')}
          type={field.type === "number" ? "text" : field.type}
          value={value}
          className={getInputClasses()}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
          disabled={isAutoFilled}
          readOnly={isAutoFilled}
        />
      );
      break;
    case "date":
      // Date input with click-to-open calendar behavior
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().includes('_date') ? field.token.toLowerCase() : field.token.toLowerCase().replace(/_/g, '')}
          type="date"
          value={value}
          className={`${getInputClasses()} cursor-pointer`}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          autoComplete="off"
          disabled={isAutoFilled}
          readOnly={isAutoFilled}
          onClick={(e) => {
            // Open the date picker when clicking anywhere on the input
            if (!isAutoFilled) {
              (e.target as HTMLInputElement).showPicker?.();
            }
          }}
        />
      );
      break;
    case "select":
      control = (
        <select
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
          value={value}
          className={getInputClasses()}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          disabled={isAutoFilled}
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
          className={getInputClasses()}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
          autoComplete="off"
          disabled={isAutoFilled}
          readOnly={isAutoFilled}
        />
      );
      break;
  }

  // Auto-filled indicator component
  const autoFilledIndicator = isAutoFilled ? (
    <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
      Auto-filled from council
    </span>
  ) : null;

  // Enhanced label with auto-filled indicator
  const enhancedLabel = (
    <label htmlFor={inputId} className="flex items-center text-[13px] font-medium text-slate-700">
      <span>
        {field.label}
        {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {autoFilledIndicator}
    </label>
  );

  return (
    <div className="space-y-2">
      {/* Don't show label for address fields as AddressAutocomplete has its own label, unless auto-filled */}
      {(!isAddressField || isAutoFilled) && enhancedLabel}

      {control}

      {/* Show hint unless auto-filled (the auto-fill indicator replaces the hint) */}
      {field.hint && !isAddressField && !isAutoFilled ? (
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
