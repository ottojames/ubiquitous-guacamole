import React from "react";
import { Info, ChevronDown, ChevronRight } from "lucide-react";

// ============================================================================
// Types & Data
// ============================================================================

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type DayKey = typeof DAYS[number];

export type GamblingActivityKey =
  // Betting premises
  | "fobt"
  | "otc_betting"
  | "ssbt"
  // Bingo premises
  | "cash_bingo"
  | "prize_bingo"
  | "bingo_machines_b3_b4"
  | "bingo_machines_c"
  | "bingo_machines_d"
  // Adult Gaming Centre (AGC)
  | "agc_machines_b3_b4"
  | "agc_machines_c"
  | "agc_machines_d"
  // Family Entertainment Centre (FEC)
  | "fec_machines_c"
  | "fec_machines_d"
  | "equal_chance_gaming";

type GamblingPremisesType = "betting" | "bingo" | "agc" | "fec";

type GamblingActivityDefinition = {
  key: GamblingActivityKey;
  label: string;
  premisesTypes: GamblingPremisesType[];
  info: string;
  requiresMachineCount?: boolean;
  maxMachines?: number;
};

const GAMBLING_ACTIVITY_DEFINITIONS: GamblingActivityDefinition[] = [
  // Betting premises activities
  {
    key: "fobt",
    label: "Fixed-odds betting terminals (FOBTs)",
    premisesTypes: ["betting"],
    info: "Self-service betting terminals with fixed odds. Maximum 4 terminals per betting premises under Gambling Act 2005 s.172.",
    requiresMachineCount: true,
    maxMachines: 4,
  },
  {
    key: "otc_betting",
    label: "Over-the-counter betting (manual/telephonic)",
    premisesTypes: ["betting"],
    info: "Traditional betting services provided by staff, including counter service and telephone betting.",
  },
  {
    key: "ssbt",
    label: "Self-service betting terminals (SSBTs)",
    premisesTypes: ["betting"],
    info: "Self-service terminals for placing bets (not FOBTs), no machine limit applies.",
  },
  // Bingo premises activities
  {
    key: "cash_bingo",
    label: "Cash bingo",
    premisesTypes: ["bingo"],
    info: "Bingo games where prizes are in the form of cash.",
  },
  {
    key: "prize_bingo",
    label: "Prize bingo",
    premisesTypes: ["bingo"],
    info: "Bingo games where prizes are in the form of goods or services rather than cash.",
  },
  {
    key: "bingo_machines_b3_b4",
    label: "Gaming machines - Category B3/B4",
    premisesTypes: ["bingo"],
    info: "Category B3 (max stake £2, max prize £500) and B4 (max stake £2, max prize £400) gaming machines. Limited to 20% of total machines in bingo premises.",
    requiresMachineCount: true,
  },
  {
    key: "bingo_machines_c",
    label: "Gaming machines - Category C",
    premisesTypes: ["bingo"],
    info: "Category C machines (max stake £1, max prize £100). No limit on number in bingo premises.",
    requiresMachineCount: true,
  },
  {
    key: "bingo_machines_d",
    label: "Gaming machines - Category D",
    premisesTypes: ["bingo"],
    info: "Category D machines (max stake 10p or 30p depending on sub-category, max prize £5 or £8). No limit on number.",
    requiresMachineCount: true,
  },
  // Adult Gaming Centre (AGC) activities
  {
    key: "agc_machines_b3_b4",
    label: "Gaming machines - Category B3/B4",
    premisesTypes: ["agc"],
    info: "Category B3/B4 gaming machines in AGC. Maximum of 20% of total machines and capped at 4 machines.",
    requiresMachineCount: true,
    maxMachines: 4,
  },
  {
    key: "agc_machines_c",
    label: "Gaming machines - Category C",
    premisesTypes: ["agc"],
    info: "Category C machines (max stake £1, max prize £100). No limit on number in AGC.",
    requiresMachineCount: true,
  },
  {
    key: "agc_machines_d",
    label: "Gaming machines - Category D",
    premisesTypes: ["agc"],
    info: "Category D machines (max stake 10p or 30p, max prize £5 or £8). No limit on number.",
    requiresMachineCount: true,
  },
  // Family Entertainment Centre (FEC) activities
  {
    key: "fec_machines_c",
    label: "Gaming machines - Category C",
    premisesTypes: ["fec"],
    info: "Category C machines (max stake £1, max prize £100). No limit on number in licensed FEC.",
    requiresMachineCount: true,
  },
  {
    key: "fec_machines_d",
    label: "Gaming machines - Category D",
    premisesTypes: ["fec"],
    info: "Category D machines (max stake 10p or 30p, max prize £5 or £8). No limit on number.",
    requiresMachineCount: true,
  },
  {
    key: "equal_chance_gaming",
    label: "Equal chance gaming (non-prize gaming)",
    premisesTypes: ["fec"],
    info: "Gaming activities where all participants have an equal chance of winning, such as poker or other table games. No commercial gain from the gaming itself.",
  },
];

export type DayHours = { start: string; end: string } | null;

export type GamblingActivityData = {
  enabled: boolean;
  machineCount?: number;
};

export type GamblingActivitiesHoursData = {
  activities: Partial<Record<GamblingActivityKey, GamblingActivityData>>;
  openingHours: Record<DayKey, DayHours>;
};

// ============================================================================
// Props
// ============================================================================

export interface GamblingActivitiesSectionProps {
  value: GamblingActivitiesHoursData;
  onChange: (value: GamblingActivitiesHoursData) => void;
  premisesType: GamblingPremisesType;
  errors?: {
    licensableActivities?: string[];
    openingHours?: string[];
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

function formatSummary(hours: Record<DayKey, DayHours>): string {
  const filled = DAYS.filter((d) => hours[d] !== null);
  if (filled.length === 0) return "No hours set";

  const first = hours[filled[0]];
  if (!first) return "No hours set";

  const allSame = filled.every((d) => {
    const h = hours[d];
    return h && h.start === first.start && h.end === first.end;
  });

  if (allSame && filled.length === 7) {
    return `Mon–Sun ${first.start}–${first.end}`;
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

  return groups.join("; ");
}

// ============================================================================
// Main Component
// ============================================================================

export default function GamblingActivitiesSection({
  value,
  onChange,
  premisesType,
  errors,
}: GamblingActivitiesSectionProps) {
  const activities = GAMBLING_ACTIVITY_DEFINITIONS.filter((a) =>
    a.premisesTypes.includes(premisesType)
  );

  const updateOpeningHours = (hours: Record<DayKey, DayHours>) => {
    onChange({ ...value, openingHours: hours });
  };

  const updateActivity = (key: GamblingActivityKey, data: GamblingActivityData) => {
    onChange({
      ...value,
      activities: { ...value.activities, [key]: data },
    });
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">
          Gambling activities & operating hours
        </h3>
        <p className="text-[13px] leading-relaxed text-slate-500">
          Select the gambling activities you're applying for and specify operating hours. Activity entitlements are defined by Gambling Act 2005 and premises type.
        </p>
      </div>

      {/* Activities list */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <ActivityPanel
            key={activity.key}
            activity={activity}
            data={value.activities[activity.key] || { enabled: false }}
            onChange={(data) => updateActivity(activity.key, data)}
          />
        ))}
      </div>

      {errors?.licensableActivities?.map((error, i) => (
        <p key={i} className="text-[12px] leading-relaxed text-rose-600">
          {error}
        </p>
      ))}

      {/* Opening hours */}
      <OpeningHoursPanel
        hours={value.openingHours}
        onChange={updateOpeningHours}
        premisesType={premisesType}
        errors={errors?.openingHours}
      />
    </div>
  );
}

// ============================================================================
// Opening Hours Panel
// ============================================================================

function OpeningHoursPanel({
  hours,
  onChange,
  premisesType,
  errors,
}: {
  hours: Record<DayKey, DayHours>;
  onChange: (hours: Record<DayKey, DayHours>) => void;
  premisesType: GamblingPremisesType;
  errors?: string[];
}) {
  // Check if 24-hour operation is set
  const is24Hour = DAYS.every((day) => {
    const h = hours[day];
    return h && h.start === "00:00" && h.end === "23:59";
  });

  const show24HourWarning = is24Hour && premisesType === "agc";

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-[13px] font-semibold text-slate-900">Operating hours</h4>
          <p className="text-[12px] leading-relaxed text-slate-500">
            Set the times when gambling activities may take place.
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

      {/* 24-hour AGC warning */}
      {show24HourWarning && (
        <div className="rounded-lg border border-amber-200/70 bg-amber-50/50 px-3.5 py-2.5 text-[12px] text-amber-800">
          <span className="font-medium">Note: </span>
          24-hour operation of Adult Gaming Centres requires special approval from the Gambling Commission under code provision 3.2.3.
        </div>
      )}

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
  data,
  onChange,
}: {
  activity: GamblingActivityDefinition;
  data: GamblingActivityData;
  onChange: (data: GamblingActivityData) => void;
}) {
  const [showInfo, setShowInfo] = React.useState(false);

  const toggleEnabled = () => {
    onChange({ ...data, enabled: !data.enabled });
  };

  const updateMachineCount = (count: number) => {
    onChange({ ...data, machineCount: count });
  };

  const machineCountError =
    activity.maxMachines &&
    data.machineCount &&
    data.machineCount > activity.maxMachines;

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <input
          type="checkbox"
          checked={data.enabled}
          onChange={toggleEnabled}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          id={`activity-${activity.key}`}
        />
        <label
          htmlFor={`activity-${activity.key}`}
          className="flex flex-1 cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-900"
        >
          {data.enabled ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
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

      {/* Expanded content - Machine count if needed */}
      {data.enabled && activity.requiresMachineCount && (
        <div className="space-y-3 border-t border-slate-200/70 p-5">
          <div className="space-y-2">
            <label htmlFor={`machine-count-${activity.key}`} className="block text-[12px] font-medium text-slate-700">
              Number of machines
              {activity.maxMachines && (
                <span className="ml-1 text-slate-500">(max {activity.maxMachines})</span>
              )}
            </label>
            <input
              id={`machine-count-${activity.key}`}
              type="number"
              min="1"
              max={activity.maxMachines || undefined}
              value={data.machineCount || ""}
              onChange={(e) => updateMachineCount(parseInt(e.target.value, 10) || 0)}
              className={`w-32 rounded-lg border ${
                machineCountError
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/10"
              } bg-white px-3.5 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:outline-none focus:ring-4`}
              placeholder="e.g., 2"
            />
            {machineCountError && (
              <p className="text-[12px] leading-relaxed text-rose-600">
                Maximum of {activity.maxMachines} machines allowed for this activity.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Day Hours Editor
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
