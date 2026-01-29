import React from "react";
import { Info } from "lucide-react";

// ============================================================================
// Types & Data
// ============================================================================

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

// ============================================================================
// Props
// ============================================================================

export interface ActivitiesSelectorProps {
  value: ActivityKey[];
  onChange: (value: ActivityKey[]) => void;
  showClubActivities?: boolean;
  onAlcoholChange?: (hasAlcohol: boolean) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ActivitiesSelector({
  value,
  onChange,
  showClubActivities = false,
  onAlcoholChange,
}: ActivitiesSelectorProps) {
  const activities = showClubActivities
    ? ACTIVITY_DEFINITIONS
    : ACTIVITY_DEFINITIONS.filter((a) => a.group !== "club");

  const [expandedInfo, setExpandedInfo] = React.useState<ActivityKey | null>(null);

  const toggleActivity = (key: ActivityKey) => {
    const newValue = value.includes(key)
      ? value.filter((k) => k !== key)
      : [...value, key];

    onChange(newValue);

    // Notify about alcohol selection
    if (onAlcoholChange) {
      const hasAlcohol = newValue.some((k) => k.startsWith("alcohol_"));
      onAlcoholChange(hasAlcohol);
    }
  };

  const toggleInfo = (key: ActivityKey) => {
    setExpandedInfo(expandedInfo === key ? null : key);
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="space-y-1">
        <label className="block text-[13px] font-medium text-slate-700">
          Licensable activities
        </label>
        <p className="text-[12px] leading-relaxed text-slate-500">
          Tick each activity you're applying for. Hours should already be on your uploaded notice.
        </p>
      </div>

      {/* Activities list */}
      <div className="space-y-2">
        {activities.map((activity) => {
          const isSelected = value.includes(activity.key);
          const showInfo = expandedInfo === activity.key;

          return (
            <div key={activity.key} className="rounded-lg border border-slate-200/70 bg-white">
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleActivity(activity.key)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  id={`activity-${activity.key}`}
                />
                <label
                  htmlFor={`activity-${activity.key}`}
                  className="flex-1 cursor-pointer text-[13px] font-medium text-slate-900"
                >
                  {activity.label}
                </label>
                <button
                  type="button"
                  onClick={() => toggleInfo(activity.key)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                  aria-label="What this activity means"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {showInfo && (
                <div className="border-t border-slate-200/70 bg-slate-50/50 px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-slate-600">{activity.info}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      {value.length > 0 && (
        <div className="rounded-lg border border-blue-200/70 bg-blue-50/50 px-4 py-3">
          <p className="text-[12px] font-medium text-blue-900">
            {value.length} {value.length === 1 ? "activity" : "activities"} selected
          </p>
        </div>
      )}
    </div>
  );
}
