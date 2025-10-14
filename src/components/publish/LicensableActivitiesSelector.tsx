import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export type ActivityGroup = {
  id: string;
  label: string;
  children: ActivityOption[];
};

export type ActivityOption = {
  id: string;
  label: string;
  description?: string;
};

const LICENSABLE_ACTIVITIES: ActivityGroup[] = [
  {
    id: "alcohol",
    label: "Sale of alcohol",
    children: [
      { id: "alcohol_on", label: "On the premises (on-sales)", description: "Consumption on the premises" },
      { id: "alcohol_off", label: "Off the premises (off-sales)", description: "Takeaway or delivery" },
      { id: "alcohol_on_off", label: "On & off the premises" },
    ],
  },
  {
    id: "entertainment",
    label: "Regulated entertainment",
    children: [
      { id: "live_music", label: "Performance of live music" },
      { id: "recorded_music", label: "Playing of recorded music" },
      { id: "dance", label: "Performance of dance" },
      { id: "films", label: "Exhibition of films" },
      { id: "indoor_sport", label: "Indoor sporting events" },
      { id: "boxing_wrestling", label: "Boxing or wrestling entertainment" },
    ],
  },
  {
    id: "late_night",
    label: "Late night refreshment",
    children: [
      { id: "late_night_refreshment", label: "Provision of hot food or drink between 23:00–05:00" },
    ],
  },
];

export interface LicensableActivitiesSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  onAlcoholChange?: (hasAlcohol: boolean) => void;
}

export default function LicensableActivitiesSelector({
  value,
  onChange,
  onAlcoholChange,
}: LicensableActivitiesSelectorProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(["alcohol", "entertainment", "late_night"]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleActivity = (activityId: string) => {
    const newValue = value.includes(activityId)
      ? value.filter((id) => id !== activityId)
      : [...value, activityId];

    onChange(newValue);

    // Notify if alcohol is selected/deselected
    if (onAlcoholChange) {
      const hasAlcohol = newValue.some((id) => id.startsWith("alcohol_"));
      onAlcoholChange(hasAlcohol);
    }
  };

  const selectedCount = value.length;

  return (
    <div className="space-y-4">
      {/* Sticky selection summary */}
      {selectedCount > 0 && (
        <div className="sticky top-0 z-10 rounded-lg border border-blue-200/70 bg-blue-50/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-blue-900">
              {selectedCount} {selectedCount === 1 ? "activity" : "activities"} selected:
            </span>
            <div className="flex flex-wrap gap-2">
              {value.map((activityId) => {
                const activity = LICENSABLE_ACTIVITIES.flatMap((g) => g.children).find((a) => a.id === activityId);
                return activity ? (
                  <span
                    key={activityId}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-[12px] font-medium text-blue-900"
                  >
                    {activity.label}
                    <button
                      type="button"
                      onClick={() => toggleActivity(activityId)}
                      className="hover:text-blue-700"
                      aria-label={`Remove ${activity.label}`}
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible groups */}
      <div className="space-y-3">
        {LICENSABLE_ACTIVITIES.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          return (
            <div key={group.id} className="rounded-lg border border-slate-200/70 bg-white">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50/50"
              >
                <span className="text-[14px] font-semibold text-slate-900">{group.label}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-2 border-t border-slate-200/70 px-4 py-3">
                  {group.children.map((activity) => {
                    const isSelected = value.includes(activity.id);
                    return (
                      <label
                        key={activity.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50/50"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleActivity(activity.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <div className="flex-1 space-y-0.5">
                          <span className="block text-[13px] font-medium text-slate-900">{activity.label}</span>
                          {activity.description && (
                            <span className="block text-[12px] text-slate-500">{activity.description}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
