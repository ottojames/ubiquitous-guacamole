import * as React from 'react';
import { cn } from '@/lib/cn';

export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type DayRange = {
  open: string | null;
  close: string | null;
  lateIntoNextDay?: boolean;
};

export type ActivityHours = Record<DayKey, DayRange>;

export type ActivityGroup = {
  id: string;
  label: string;
  hours: ActivityHours;
  enabled?: boolean;
};

export type ActivitiesHoursProps = {
  value?: Record<string, ActivityGroup>;
  onChange?: (next: Record<string, ActivityGroup>) => void;
  persistKey?: string;
  defaultGroups?: ActivityGroup[];
  className?: string;
};

type CompressedWeeklyRange = {
  days: DayKey[];
  open: string;
  close: string;
  lateIntoNextDay: boolean;
};

type ActivitiesState = {
  groups: Record<string, ActivityGroup>;
  order: string[];
  expanded: Record<string, boolean>;
};

const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INDEX: Record<DayKey, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};
const DEFAULT_PERSIST_KEY = 'publish.activitiesHours';
const DEFAULT_OPEN_TIME = '09:00';
const DEFAULT_CLOSE_TIME = '17:00';

function getNextDay(day: DayKey): DayKey {
  const current = DAY_INDEX[day];
  const nextIndex = (current + 1) % DAY_KEYS.length;
  return DAY_KEYS[nextIndex];
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

function determineLateIntoNextDay(open: string | null, close: string | null): boolean {
  const start = timeToMinutes(open);
  const end = timeToMinutes(close);
  if (start == null || end == null) return false;
  return end <= start;
}

function createEmptyHours(): ActivityHours {
  return DAY_KEYS.reduce<ActivityHours>((acc, day) => {
    acc[day] = { open: null, close: null, lateIntoNextDay: false };
    return acc;
  }, {} as ActivityHours);
}

function cleanTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function normalizeDayRange(day: DayRange | null | undefined): DayRange {
  const open = cleanTime(day?.open);
  const close = cleanTime(day?.close);
  const hasBoth = Boolean(open && close);
  return {
    open: hasBoth ? open : open ?? null,
    close: hasBoth ? close : close ?? null,
    lateIntoNextDay: hasBoth ? Boolean(day?.lateIntoNextDay) : false,
  };
}

function normalizeHours(hours: ActivityHours | null | undefined): ActivityHours {
  const base = hours ?? ({} as ActivityHours);
  const normalized = { ...createEmptyHours() };
  for (const day of DAY_KEYS) {
    normalized[day] = normalizeDayRange(base[day]);
  }
  return normalized;
}

function normalizeGroup(group: ActivityGroup | null | undefined, fallbackId?: string): ActivityGroup {
  if (!group) {
    const fallback = fallbackId
      ? { id: fallbackId, label: fallbackId, hours: createEmptyHours() }
      : { id: 'unknown', label: 'Unknown activity', hours: createEmptyHours() };
    return normalizeGroup(fallback);
  }
  const id = group.id || fallbackId;
  if (!id) {
    throw new Error('Activity group requires an id');
  }
  return {
    id,
    label: group.label || id,
    hours: normalizeHours(group.hours),
    enabled: group.enabled,
  };
}

function listToRecord(groups: ActivityGroup[]): Record<string, ActivityGroup> {
  return groups.reduce<Record<string, ActivityGroup>>((acc, group) => {
    acc[group.id] = group;
    return acc;
  }, {});
}

function normalizeRecord(record: Record<string, ActivityGroup> | null | undefined): Record<string, ActivityGroup> {
  if (!record) return {};
  return Object.entries(record).reduce<Record<string, ActivityGroup>>((acc, [id, group]) => {
    acc[id] = normalizeGroup(group, id);
    return acc;
  }, {});
}

function createStateFromList(list: ActivityGroup[]): ActivitiesState {
  const normalizedList = list.map((group) => normalizeGroup(group));
  const order = normalizedList.map((group) => group.id);
  const expanded = order.reduce<Record<string, boolean>>((acc, id) => {
    acc[id] = false;
    return acc;
  }, {});
  return {
    groups: listToRecord(normalizedList),
    order,
    expanded,
  };
}

function readPersistedState(key: string, fallbackList: ActivityGroup[]): ActivitiesState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<ActivitiesState> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const groups = normalizeRecord(parsed.groups ?? {});
    if (!Object.keys(groups).length) {
      return createStateFromList(fallbackList);
    }
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((id: unknown): id is string => typeof id === 'string' && Boolean(groups[id]))
      : Object.keys(groups);
    const ensuredOrder = [...order];
    for (const id of Object.keys(groups)) {
      if (!ensuredOrder.includes(id)) ensuredOrder.push(id);
    }
    const expandedSource = parsed.expanded && typeof parsed.expanded === 'object' ? parsed.expanded : {};
    const expanded = ensuredOrder.reduce<Record<string, boolean>>((acc, id) => {
      const value = (expandedSource as Record<string, unknown>)[id];
      acc[id] = typeof value === 'boolean' ? value : false;
      return acc;
    }, {});
    return {
      groups,
      order: ensuredOrder,
      expanded,
    };
  } catch (error) {
    console.warn('Failed to read activities hours state', error);
    return null;
  }
}

function writePersistedState(key: string, state: ActivitiesState) {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify(state);
    window.sessionStorage.setItem(key, payload);
  } catch (error) {
    console.warn('Failed to persist activities hours state', error);
  }
}

const DEFAULT_GROUPS: ActivityGroup[] = [
  {
    id: 'alcohol_on',
    label: 'Sale of alcohol (on/off premises)',
    hours: createEmptyHours(),
    enabled: true,
  },
  {
    id: 'late_refreshment',
    label: 'Late-night refreshment',
    hours: createEmptyHours(),
    enabled: true,
  },
].map((group) => normalizeGroup(group));

function resolveFallbackGroup(id: string, fallback: ActivityGroup[]): ActivityGroup {
  const match = fallback.find((group) => group.id === id);
  if (match) return normalizeGroup(match);
  return normalizeGroup({ id, label: id, hours: createEmptyHours(), enabled: true });
}

function sanitizeTimeInput(value: string): string | null {
  return value ? value.trim() || null : null;
}

export function compressWeeklyRanges(hours: ActivityHours): CompressedWeeklyRange[] {
  const ranges: CompressedWeeklyRange[] = [];
  let current: CompressedWeeklyRange | null = null;
  for (const day of DAY_KEYS) {
    const config = hours[day];
    const open = cleanTime(config?.open);
    const close = cleanTime(config?.close);
    if (!open || !close) {
      if (current) {
        ranges.push(current);
        current = null;
      }
      continue;
    }
    const late = Boolean(config?.lateIntoNextDay);
    if (current && current.open === open && current.close === close && current.lateIntoNextDay === late) {
      current.days.push(day);
      continue;
    }
    if (current) ranges.push(current);
    current = {
      days: [day],
      open,
      close,
      lateIntoNextDay: late,
    };
  }
  if (current) ranges.push(current);
  return ranges;
}

export function formatDaySpan(days: DayKey[]): string {
  if (!days.length) return '';
  if (days.length === 1) return days[0];
  const first = days[0];
  const last = days[days.length - 1];
  let previousIndex = DAY_INDEX[first];
  for (let i = 1; i < days.length; i += 1) {
    const current = DAY_INDEX[days[i]];
    if (current === undefined) return days.join(', ');
    if ((previousIndex + 1) % DAY_KEYS.length !== current) {
      return days.join(', ');
    }
    previousIndex = current;
  }
  return `${first}–${last}`;
}

export function formatRange(open: string, close: string, late: boolean): string {
  return late ? `${open}–${close}` : `${open}–${close}`;
}

type ActivityCardProps = {
  group: ActivityGroup;
  expanded: boolean;
  badges: string[];
  headerId: string;
  panelId: string;
  onToggle: () => void;
  onDayToggle: (day: DayKey, enabled: boolean) => void;
  onTimeChange: (day: DayKey, field: 'open' | 'close', value: string) => void;
  registerPanel: (node: HTMLDivElement | null) => void;
};

function ActivityCard({
  group,
  expanded,
  badges,
  headerId,
  panelId,
  onToggle,
  onDayToggle,
  onTimeChange,
  registerPanel,
}: ActivityCardProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = React.useState(0);

  React.useEffect(() => {
    registerPanel(panelRef.current);
    return () => registerPanel(null);
  }, [registerPanel]);

  React.useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    let frame: number | null = null;
    let observer: ResizeObserver | null = null;

    const updateHeight = () => {
      if (!innerRef.current) return;
      const height = innerRef.current.scrollHeight;
      setMaxHeight(expanded ? height : 0);
    };

    if (expanded) {
      frame = requestAnimationFrame(updateHeight);
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          frame = requestAnimationFrame(updateHeight);
        });
        observer.observe(node);
      }
    } else {
      setMaxHeight(0);
    }

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [expanded, group.hours]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
        )}
        aria-expanded={expanded}
        aria-controls={panelId}
        id={headerId}
        data-testid={`act-${group.id}-header`}
        onClick={onToggle}
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{group.label}</span>
          <div className="flex flex-wrap gap-1.5 text-xs" data-testid={`act-${group.id}-badges`}>
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-muted px-2 py-1 text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200',
            expanded ? 'rotate-90' : 'rotate-0'
          )}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </span>
      </button>
      <div
        ref={panelRef}
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        data-testid={`act-${group.id}-panel`}
        tabIndex={-1}
        aria-hidden={!expanded}
        style={{
          maxHeight: `${maxHeight}px`,
        }}
        className={cn(
          'overflow-hidden transition-[max-height] duration-300 ease-in-out',
          expanded ? 'border-t border-border bg-background' : 'border-t border-border'
        )}
      >
        <div ref={innerRef} className="space-y-2 px-4 py-3">
          {DAY_KEYS.map((day) => {
            const dayConfig = group.hours[day] ?? { open: null, close: null };
            const dayEnabled = Boolean(dayConfig.open !== null || dayConfig.close !== null);
            return (
              <div
                key={day}
                className="flex flex-col gap-2 rounded-xl border border-border bg-muted/15 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border text-primary focus:ring-primary/60"
                    checked={dayEnabled}
                    onChange={(event) => onDayToggle(day, event.target.checked)}
                    data-testid={`act-${group.id}-${day}-enabled`}
                  />
                  <span className="w-12 text-sm font-medium text-foreground">{day}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Open</span>
                    <input
                      type="time"
                      className="w-24 rounded-xl border border-input bg-background px-2 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={dayConfig.open ?? ''}
                      onChange={(event) => onTimeChange(day, 'open', event.target.value)}
                      disabled={!dayEnabled}
                      data-testid={`act-${group.id}-${day}-open`}
                      step={900}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Close</span>
                    <input
                      type="time"
                      className="w-24 rounded-xl border border-input bg-background px-2 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={dayConfig.close ?? ''}
                      onChange={(event) => onTimeChange(day, 'close', event.target.value)}
                      disabled={!dayEnabled}
                      data-testid={`act-${group.id}-${day}-close`}
                      step={900}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesHours({
  value,
  onChange,
  persistKey: persistKeyProp,
  defaultGroups,
  className,
}: ActivitiesHoursProps) {
  const persistKey = persistKeyProp ?? DEFAULT_PERSIST_KEY;
  const fallbackGroups = React.useMemo(() => {
    if (defaultGroups && defaultGroups.length) {
      return defaultGroups.map((group) => normalizeGroup(group));
    }
    return DEFAULT_GROUPS;
  }, [defaultGroups]);

  const isControlled = value !== undefined && typeof onChange === 'function';

  const initialUncontrolledStateRef = React.useRef<ActivitiesState | null>(null);
  if (!isControlled && initialUncontrolledStateRef.current === null) {
    const persisted = readPersistedState(persistKey, fallbackGroups);
    initialUncontrolledStateRef.current = persisted ?? createStateFromList(fallbackGroups);
  }

  const [groupsState, setGroupsState] = React.useState<Record<string, ActivityGroup>>(() => {
    if (isControlled) return {};
    const initial = initialUncontrolledStateRef.current ?? createStateFromList(fallbackGroups);
    return initial.groups;
  });

  const [order, setOrder] = React.useState<string[]>(() => {
    if (isControlled) {
      const normalized = normalizeRecord(value);
      const ids = Object.keys(normalized);
      if (ids.length) return ids;
      return fallbackGroups.map((group) => group.id);
    }
    const initial = initialUncontrolledStateRef.current ?? createStateFromList(fallbackGroups);
    return initial.order;
  });

  const [expandedState, setExpandedState] = React.useState<Record<string, boolean>>(() => {
    if (isControlled) {
      const normalized = normalizeRecord(value);
      const ids = Object.keys(normalized);
      return ids.reduce<Record<string, boolean>>((acc, id) => {
        acc[id] = false;
        return acc;
      }, {});
    }
    const initial = initialUncontrolledStateRef.current ?? createStateFromList(fallbackGroups);
    return initial.expanded;
  });

  const groups = React.useMemo(() => {
    return isControlled ? normalizeRecord(value) : groupsState;
  }, [isControlled, value, groupsState]);

  React.useEffect(() => {
    const ids = Object.keys(groups);
    setOrder((prev) => {
      const filtered = prev.filter((id) => ids.includes(id));
      let changed = filtered.length !== prev.length;
      for (const id of ids) {
        if (!filtered.includes(id)) {
          filtered.push(id);
          changed = true;
        }
      }
      return changed ? [...filtered] : prev;
    });
    setExpandedState((prev) => {
      if (!ids.length) return {};
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const id of ids) {
        if (prev[id] !== undefined) {
          next[id] = prev[id];
        } else {
          next[id] = false;
          changed = true;
        }
      }
      for (const key of Object.keys(prev)) {
        if (!ids.includes(key)) {
          changed = true;
          break;
        }
      }
      if (!Object.values(next).some(Boolean) && ids.length) {
        next[ids[0]] = false;
      }
      return changed ? next : prev;
    });
  }, [groups]);

  React.useEffect(() => {
    if (isControlled) return;
    writePersistedState(persistKey, {
      groups: groupsState,
      order,
      expanded: expandedState,
    });
  }, [expandedState, groupsState, isControlled, order, persistKey]);

  const panelRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const registerPanel = React.useCallback((id: string, node: HTMLDivElement | null) => {
    panelRefs.current[id] = node;
  }, []);

  const previousExpandedRef = React.useRef<Record<string, boolean>>({});
  React.useEffect(() => {
    const previous = previousExpandedRef.current;
    const ids = Object.keys(expandedState);
    for (const id of ids) {
      if (expandedState[id] && !previous[id]) {
        const node = panelRefs.current[id];
        if (node) {
          requestAnimationFrame(() => node.focus());
        }
      }
    }
    previousExpandedRef.current = { ...expandedState };
  }, [expandedState]);

  const commitGroup = React.useCallback(
    (groupId: string, mutate: (prev: ActivityGroup) => ActivityGroup) => {
      if (isControlled) {
        const base = normalizeRecord(value);
        const source = base[groupId] ?? resolveFallbackGroup(groupId, fallbackGroups);
        const next = normalizeGroup(mutate(source), groupId);
        const snapshot = { ...base, [groupId]: next };
        onChange?.(snapshot);
        return;
      }
      setGroupsState((prev) => {
        const source = prev[groupId] ?? resolveFallbackGroup(groupId, fallbackGroups);
        const next = normalizeGroup(mutate(source), groupId);
        return { ...prev, [groupId]: next };
      });
    },
    [fallbackGroups, isControlled, onChange, value]
  );

  const toggleExpanded = React.useCallback((groupId: string) => {
    setExpandedState((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const handleDayToggle = React.useCallback(
    (groupId: string, day: DayKey, enabled: boolean) => {
      commitGroup(groupId, (prev) => {
        const nextHours = { ...prev.hours };
        if (enabled) {
          const existing = nextHours[day];
          const open = existing?.open ?? DEFAULT_OPEN_TIME;
          const close = existing?.close ?? DEFAULT_CLOSE_TIME;
          nextHours[day] = {
            open,
            close,
            lateIntoNextDay: determineLateIntoNextDay(open, close),
          };
        } else {
          nextHours[day] = { open: null, close: null, lateIntoNextDay: false };
        }
        return { ...prev, hours: nextHours };
      });
    },
    [commitGroup]
  );

  const handleTimeChange = React.useCallback(
    (groupId: string, day: DayKey, field: 'open' | 'close', rawValue: string) => {
      commitGroup(groupId, (prev) => {
        const nextHours = { ...prev.hours };
        const current = nextHours[day] ?? { open: null, close: null, lateIntoNextDay: false };
        const nextValue = sanitizeTimeInput(rawValue);
        const open = field === 'open' ? nextValue : current.open;
        const close = field === 'close' ? nextValue : current.close;
        const late = determineLateIntoNextDay(open, close);
        nextHours[day] = {
          open,
          close,
          lateIntoNextDay: open && close ? late : false,
        };
        return { ...prev, hours: nextHours };
      });
    },
    [commitGroup]
  );

  const orderedGroups = order
    .map((id) => groups[id] ?? null)
    .filter((group): group is ActivityGroup => Boolean(group));

  return (
    <div className={cn('space-y-4', className)}>
      {orderedGroups.map((group) => {
        const compressed = compressWeeklyRanges(group.hours);
        let badges: string[];
        if (group.enabled === false) {
          badges = ['Disabled'];
        } else if (!compressed.length) {
          badges = ['No hours set'];
        } else {
          badges = compressed.map((range) => {
            const displayDays = [...range.days];
            if (range.lateIntoNextDay && displayDays.length === 1) {
              displayDays.push(getNextDay(displayDays[0]));
            }
            const dayLabel = formatDaySpan(displayDays);
            const rangeLabel = formatRange(range.open, range.close, range.lateIntoNextDay);
            return `${dayLabel} ${rangeLabel}`.trim();
          });
        }
        const headerId = `act-${group.id}-header`;
        const panelId = `act-${group.id}-panel`;
        return (
          <ActivityCard
            key={group.id}
            group={group}
            expanded={Boolean(expandedState[group.id])}
            badges={badges}
            headerId={headerId}
            panelId={panelId}
            onToggle={() => toggleExpanded(group.id)}
            onDayToggle={(day, enabled) => handleDayToggle(group.id, day, enabled)}
            onTimeChange={(day, field, value) => handleTimeChange(group.id, day, field, value)}
            registerPanel={(node) => registerPanel(group.id, node)}
          />
        );
      })}
    </div>
  );
}
