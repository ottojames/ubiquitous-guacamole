import React from "react";
import { Info, ChevronDown, ChevronRight } from "lucide-react";

// ============================================================================
// Types & Data
// ============================================================================

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = typeof DAYS[number];

export type ActivityKey =
  | "alcohol_on"
  | "alcohol_off"
  | "alcohol_on_off"
  | "live_music"
  | "recorded_music"
  | "dance"
  | "films"
  | "indoor_sport"
  | "boxing_wrestling"
  | "late_night_refreshment"
  | "club_supply_members"
  | "club_supply_guests";

type ActivityDefinition = {
  key: ActivityKey;
  label: string;
  group: "alcohol" | "entertainment" | "late_night" | "club";
  info: string;
};

const ACTIVITY_DEFINITIONS: ActivityDefinition[] = [
  {
    key: "alcohol_on",
    label: "Sale of alcohol – On the premises (on-sales)",
    group: "alcohol",
    info: "Retail sale of alcohol for consumption on the premises. DPS is required for any Premises Licence authorising sale of alcohol.",
  },
  {
    key: "alcohol_off",
    label: "Sale of alcohol – Off the premises (off-sales)",
    group: "alcohol",
    info: "Retail sale of alcohol for consumption off the premises (takeaway or delivery). DPS is required for any Premises Licence authorising sale of alcohol.",
  },
  {
    key: "alcohol_on_off",
    label: "Sale of alcohol – On & off the premises",
    group: "alcohol",
    info: "Retail sale of alcohol for consumption both on and off the premises. DPS is required for any Premises Licence authorising sale of alcohol.",
  },
  {
    key: "live_music",
    label: "Performance of live music",
    group: "entertainment",
    info: "Live musical performance to an audience, whether amplified or unamplified (subject to statutory exemptions for small-scale events/late hours).",
  },
  {
    key: "recorded_music",
    label: "Playing of recorded music",
    group: "entertainment",
    info: "Amplified or unamplified recorded music to an audience (subject to statutory exemptions).",
  },
  {
    key: "dance",
    label: "Performance of dance",
    group: "entertainment",
    info: "Live dance performance before an audience.",
  },
  {
    key: "films",
    label: "Exhibition of films",
    group: "entertainment",
    info: "Showing of moving pictures to an audience (cinematic exhibition).",
  },
  {
    key: "indoor_sport",
    label: "Indoor sporting events",
    group: "entertainment",
    info: "Sporting contests or exhibitions held wholly indoors with spectators.",
  },
  {
    key: "boxing_wrestling",
    label: "Boxing or wrestling entertainment",
    group: "entertainment",
    info: "Any boxing or wrestling entertainment before an audience (including mixed martial arts).",
  },
  {
    key: "late_night_refreshment",
    label: "Late night refreshment",
    group: "late_night",
    info: "Supply of hot food or hot drink between 23:00 and 05:00 to the public, whether on or off the premises.",
  },
  {
    key: "club_supply_members",
    label: "Club supply of alcohol – Supply to club members",
    group: "club",
    info: "Supply of alcohol by a qualifying club to members (Club Premises Certificate), not retail sale.",
  },
  {
    key: "club_supply_guests",
    label: "Club supply of alcohol – Supply to guests of members",
    group: "club",
    info: "Supply of alcohol by a qualifying club to guests of members (Club Premises Certificate), not retail sale.",
  },
];

export type DayHours = { start: string; end: string } | null;

export type ActivitySchedule = {
  enabled: boolean;
  hours: Record<DayKey, DayHours>;
  exception?: string;
};

export type ActivitiesHoursData = {
  openingHours: Record<DayKey, DayHours>;
  activities: Partial<Record<ActivityKey, ActivitySchedule>>;
  dpsName?: string;
  dpsLicensingAuthority?: string;
};

// ============================================================================
// Props
// ============================================================================

export interface ActivitiesHoursSectionProps {
  value: ActivitiesHoursData;
  onChange: (value: ActivitiesHoursData) => void;
  showClubActivities?: boolean;
  errors?: {
    openingHours?: string[];
    activities?: Record<ActivityKey, string[]>;
    dpsName?: string[];
    dpsLicensingAuthority?: string[];
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function emptyDayHours(): Record<DayKey, DayHours> {
  return {
    Mon: null,
    Tue: null,
    Wed: null,
    Thu: null,
    Fri: null,
    Sat: null,
    Sun: null,
  };
}

function copyToWeekdays(hours: Record<DayKey, DayHours>): Record<DayKey, DayHours> {
  const mon = hours.Mon;
  if (!mon) return hours;
  return { ...hours, Tue: mon, Wed: mon, Thu: mon, Fri: mon };
}

function copyToAllDays(hours: Record<DayKey, DayHours>): Record<DayKey, DayHours> {
  const mon = hours.Mon;
  if (!mon) return hours;
  return {
    Mon: mon,
    Tue: mon,
    Wed: mon,
    Thu: mon,
    Fri: mon,
    Sat: mon,
    Sun: mon,
  };
}

function set24Hours(hours: Record<DayKey, DayHours>): Record<DayKey, DayHours> {
  const full = { start: "00:00", end: "23:59" };
  return {
    Mon: full,
    Tue: full,
    Wed: full,
    Thu: full,
    Fri: full,
    Sat: full,
    Sun: full,
  };
}

function clearAllDays(): Record<DayKey, DayHours> {
  return emptyDayHours();
}

function formatSummary(hours: Record<DayKey, DayHours>, exception?: string): string {
  const filled = DAYS.filter((d) => hours[d] !== null);
  if (filled.length === 0) return "No hours set";

  // Check if all days have the same hours
  const first = hours[filled[0]];
  if (!first) return "No hours set";

  const allSame = filled.every((d) => {
    const h = hours[d];
    return h && h.start === first.start && h.end === first.end;
  });

  if (allSame && filled.length === 7) {
    const suffix = exception ? " (seasonal variations apply)" : "";
    return `Mon–Sun ${first.start}–${first.end}${suffix}`;
  }

  // Group consecutive days with same hours
  const groups: string[] = [];
  let currentGroup: DayKey[] = [];
  let currentHours: DayHours = null;

  for (const day of DAYS) {
    const h = hours[day];
    if (!h) {
      if (currentGroup.length > 0) {
        const hStr = currentHours ? `${currentHours.start}–${currentHours.end}` : "";
        const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
        groups.push(`${dayStr} ${hStr}`);
        currentGroup = [];
        currentHours = null;
      }
      continue;
    }

    if (!currentHours || (h.start === currentHours.start && h.end === currentHours.end)) {
      currentGroup.push(day);
      currentHours = h;
    } else {
      if (currentGroup.length > 0) {
        const hStr = currentHours ? `${currentHours.start}–${currentHours.end}` : "";
        const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
        groups.push(`${dayStr} ${hStr}`);
      }
      currentGroup = [day];
      currentHours = h;
    }
  }

  if (currentGroup.length > 0 && currentHours) {
    const hStr = `${currentHours.start}–${currentHours.end}`;
    const dayStr = currentGroup.length === 1 ? currentGroup[0] : `${currentGroup[0]}–${currentGroup[currentGroup.length - 1]}`;
    groups.push(`${dayStr} ${hStr}`);
  }

  const suffix = exception ? " (seasonal variations apply)" : "";
  return groups.join("; ") + suffix;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ActivitiesHoursSection({
  value,
  onChange,
  showClubActivities = false,
  errors,
}: ActivitiesHoursSectionProps) {
  const activities = showClubActivities
    ? ACTIVITY_DEFINITIONS
    : ACTIVITY_DEFINITIONS.filter((a) => a.group !== "club");

  const hasAlcohol = activities.some(
    (a) => a.group === "alcohol" && value.activities[a.key]?.enabled
  );

  const updateOpeningHours = (hours: Record<DayKey, DayHours>) => {
    onChange({ ...value, openingHours: hours });
  };

  const updateActivity = (key: ActivityKey, schedule: ActivitySchedule) => {
    onChange({
      ...value,
      activities: { ...value.activities, [key]: schedule },
    });
  };

  const updateDPS = (field: "dpsName" | "dpsLicensingAuthority", val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">
          Activities & hours
        </h3>
        <p className="text-[13px] leading-relaxed text-slate-500">
          Select each activity you're applying for, then set the hours. Opening hours can differ from activity hours.
        </p>
      </div>

      {/* Opening hours */}
      <OpeningHoursPanel
        hours={value.openingHours}
        onChange={updateOpeningHours}
        errors={errors?.openingHours}
      />

      {/* Activities list */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityPanel
            key={activity.key}
            activity={activity}
            schedule={value.activities[activity.key] || { enabled: false, hours: emptyDayHours() }}
            onChange={(schedule) => updateActivity(activity.key, schedule)}
            errors={errors?.activities?.[activity.key]}
          />
        ))}
      </div>

      {/* DPS fields (show only when alcohol is selected) */}
      {hasAlcohol && (
        <div className="space-y-4 rounded-xl border border-blue-200/70 bg-blue-50/50 p-5">
          <div className="space-y-1">
            <h4 className="text-[13px] font-semibold text-blue-900">
              Designated Premises Supervisor (DPS)
            </h4>
            <p className="text-[12px] leading-relaxed text-blue-700">
              Required when alcohol is supplied under a Premises Licence.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dps-name" className="block text-[13px] font-medium text-slate-700">
                DPS name <span className="text-rose-500">*</span>
              </label>
              <input
                id="dps-name"
                type="text"
                value={value.dpsName || ""}
                onChange={(e) => updateDPS("dpsName", e.target.value)}
                className={`w-full rounded-lg border ${
                  errors?.dpsName?.length
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
                } bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4`}
                maxLength={200}
              />
              {errors?.dpsName?.map((error, i) => (
                <p key={i} className="text-[12px] leading-relaxed text-rose-600">
                  {error}
                </p>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="dps-authority" className="block text-[13px] font-medium text-slate-700">
                DPS licensing authority
              </label>
              <input
                id="dps-authority"
                type="text"
                value={value.dpsLicensingAuthority || ""}
                onChange={(e) => updateDPS("dpsLicensingAuthority", e.target.value)}
                className={`w-full rounded-lg border ${
                  errors?.dpsLicensingAuthority?.length
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                    : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
                } bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4`}
                maxLength={200}
              />
              {errors?.dpsLicensingAuthority?.map((error, i) => (
                <p key={i} className="text-[12px] leading-relaxed text-rose-600">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Opening Hours Panel
// ============================================================================

function OpeningHoursPanel({
  hours,
  onChange,
  errors,
}: {
  hours: Record<DayKey, DayHours>;
  onChange: (hours: Record<DayKey, DayHours>) => void;
  errors?: string[];
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-[13px] font-semibold text-slate-900">Opening hours</h4>
          <p className="text-[12px] leading-relaxed text-slate-500">
            Set the times when the premises is open to the public (optional).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(copyToWeekdays(hours))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            Copy to weekdays
          </button>
          <button
            type="button"
            onClick={() => onChange(copyToAllDays(hours))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            Copy to all days
          </button>
          <button
            type="button"
            onClick={() => onChange(set24Hours(hours))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            24 hours
          </button>
          <button
            type="button"
            onClick={() => onChange(clearAllDays())}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            Clear all
          </button>
        </div>
      </div>

      <DayHoursEditor hours={hours} onChange={onChange} />

      {errors?.map((error, i) => (
        <p key={i} className="text-[12px] leading-relaxed text-rose-600">
          {error}
        </p>
      ))}

      {/* Live summary */}
      <div className="rounded-lg border border-slate-200/60 bg-slate-50/40 px-3.5 py-2.5 text-[12px] text-slate-600">
        <span className="font-medium">Summary: </span>
        {formatSummary(hours)}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Panel (Collapsible)
// ============================================================================

function ActivityPanel({
  activity,
  schedule,
  onChange,
  errors,
}: {
  activity: ActivityDefinition;
  schedule: ActivitySchedule;
  onChange: (schedule: ActivitySchedule) => void;
  errors?: string[];
}) {
  const [showInfo, setShowInfo] = React.useState(false);

  const toggleEnabled = () => {
    onChange({ ...schedule, enabled: !schedule.enabled });
  };

  const updateHours = (hours: Record<DayKey, DayHours>) => {
    onChange({ ...schedule, hours });
  };

  const updateException = (exception: string) => {
    onChange({ ...schedule, exception });
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <input
          type="checkbox"
          checked={schedule.enabled}
          onChange={toggleEnabled}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          id={`activity-${activity.key}`}
        />
        <label
          htmlFor={`activity-${activity.key}`}
          className="flex flex-1 cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-900"
        >
          {schedule.enabled ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="flex-1">{activity.label}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label="What this activity means"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Info popover */}
      {showInfo && (
        <div className="border-t border-slate-200/70 bg-slate-50/50 px-5 py-3">
          <p className="text-[12px] leading-relaxed text-slate-600">{activity.info}</p>
        </div>
      )}

      {/* Expanded content */}
      {schedule.enabled && (
        <div className="space-y-4 border-t border-slate-200/70 p-5">
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-slate-600">
              Set the times when this activity may take place.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updateHours(copyToWeekdays(schedule.hours))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Copy to weekdays
              </button>
              <button
                type="button"
                onClick={() => updateHours(copyToAllDays(schedule.hours))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Copy to all days
              </button>
              <button
                type="button"
                onClick={() => updateHours(set24Hours(schedule.hours))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                24 hours
              </button>
              <button
                type="button"
                onClick={() => updateHours(clearAllDays())}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Clear all
              </button>
            </div>
          </div>

          <DayHoursEditor hours={schedule.hours} onChange={updateHours} />

          {/* Exception note */}
          <div className="space-y-2">
            <label htmlFor={`exception-${activity.key}`} className="block text-[12px] font-medium text-slate-700">
              Seasonal or Bank Holiday variations (optional, max 120 chars)
            </label>
            <input
              id={`exception-${activity.key}`}
              type="text"
              value={schedule.exception || ""}
              onChange={(e) => updateException(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              maxLength={120}
              placeholder="e.g., Extended hours Bank Holidays"
            />
          </div>

          {errors?.map((error, i) => (
            <p key={i} className="text-[12px] leading-relaxed text-rose-600">
              {error}
            </p>
          ))}

          {/* Live summary */}
          <div className="rounded-lg border border-slate-200/60 bg-slate-50/40 px-3.5 py-2.5 text-[12px] text-slate-600">
            <span className="font-medium">Summary: </span>
            {formatSummary(schedule.hours, schedule.exception)}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Day Hours Editor (Vertical list, no horizontal scroll)
// ============================================================================

function DayHoursEditor({
  hours,
  onChange,
}: {
  hours: Record<DayKey, DayHours>;
  onChange: (hours: Record<DayKey, DayHours>) => void;
}) {
  const updateDay = (day: DayKey, value: DayHours) => {
    onChange({ ...hours, [day]: value });
  };

  const toggleNone = (day: DayKey) => {
    const current = hours[day];
    if (current === null) {
      updateDay(day, { start: "09:00", end: "17:00" });
    } else {
      updateDay(day, null);
    }
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const dayHours = hours[day];
        const isNone = dayHours === null;
        const hasWarning =
          dayHours && dayHours.start && dayHours.end && dayHours.end < dayHours.start;

        return (
          <div key={day} className="flex items-center gap-3">
            <label htmlFor={`${day}-start`} className="w-10 text-[13px] font-medium text-slate-700">{day}</label>
            <input
              id={`${day}-start`}
              type="time"
              value={dayHours?.start || ""}
              onChange={(e) =>
                updateDay(day, { start: e.target.value, end: dayHours?.end || "" })
              }
              disabled={isNone}
              className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 transition-all duration-150 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              aria-label={`${day} start time`}
            />
            <span className="text-[13px] text-slate-400">–</span>
            <label htmlFor={`${day}-end`} className="sr-only">{day} end time</label>
            <input
              id={`${day}-end`}
              type="time"
              value={dayHours?.end || ""}
              onChange={(e) =>
                updateDay(day, { start: dayHours?.start || "", end: e.target.value })
              }
              disabled={isNone}
              className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-3 text-[13px] text-slate-900 transition-all duration-150 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              aria-label={`${day} end time`}
            />
            <label className="flex flex-1 cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-600">
              <input
                type="checkbox"
                checked={isNone}
                onChange={() => toggleNone(day)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              />
              None
            </label>
            {hasWarning && (
              <span className="text-[11px] text-amber-600">Crosses midnight</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
