import React from 'react';
import * as UI from '@/styles/ui';
import { NOTICE_CATEGORY_TREE, type NoticeDefinition } from '@/next/publish/config/noticeTypes';
import DisclosureSection from '../components/DisclosureSection';

const STORAGE_PREFIX = 'pn:notice-group:';

export type NoticeTypeStepProps = {
  selectedId: string | null;
  onSelect: (id: string, definition: NoticeDefinition) => void;
  onContinue: () => void;
};

type OpenGroupsState = Record<string, boolean>;

function persistGroupState(id: string, open: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, open ? 'open' : 'closed');
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }
}

function readStoredState(id: string): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (stored === 'open') return true;
    if (stored === 'closed') return false;
  } catch {
    // ignore
  }
  return undefined;
}

export default function NoticeTypeStep({ selectedId, onSelect, onContinue }: NoticeTypeStepProps) {
  const variantToCategory = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const category of NOTICE_CATEGORY_TREE) {
      for (const group of category.groups) {
        for (const variant of group.variants) {
          map.set(variant.id, category.id);
        }
      }
    }
    return map;
  }, []);

  const selectedCategoryId = selectedId ? variantToCategory.get(selectedId) ?? null : null;

  const [openGroups, setOpenGroups] = React.useState<OpenGroupsState>(() => {
    const initial: OpenGroupsState = {};
    NOTICE_CATEGORY_TREE.forEach((category, index) => {
      const stored = readStoredState(category.id);
      let open = stored ?? index === 0;
      if (selectedCategoryId && category.id === selectedCategoryId) {
        open = true;
      }
      initial[category.id] = open;
    });
    return initial;
  });

  React.useEffect(() => {
    if (!selectedCategoryId) return;
    setOpenGroups((prev) => {
      if (prev[selectedCategoryId]) return prev;
      const next = { ...prev, [selectedCategoryId]: true };
      persistGroupState(selectedCategoryId, true);
      return next;
    });
  }, [selectedCategoryId]);

  const toggleGroup = React.useCallback((categoryId: string) => {
    setOpenGroups((prev) => {
      const nextOpen = !prev[categoryId];
      const next = { ...prev, [categoryId]: nextOpen };
      persistGroupState(categoryId, nextOpen);
      return next;
    });
  }, []);

  return (
    <section className={`${UI.card} p-0`} data-testid="notice-step">
      <header className="px-6 pt-6 pb-4">
        <h2 className="text-base font-semibold text-brand-navy">Step 1 · Confirm notice type</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Choose the exact legislation and variation. This controls validation, templates, and payment.
        </p>
      </header>
      <div className="h-px w-full bg-neutral-200/70" aria-hidden />
      <div
        className="max-h-[520px] overflow-y-auto space-y-4 px-4 pb-6 pt-4 sm:px-6"
        role="radiogroup"
        aria-label="Notice categories"
      >
        {NOTICE_CATEGORY_TREE.map((category) => {
          const isOpen = openGroups[category.id] ?? false;
          return (
            <DisclosureSection
              key={category.id}
              title={category.label}
              open={isOpen}
              onToggle={() => toggleGroup(category.id)}
            >
              <div className="space-y-5">
                {category.groups.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-sm font-medium text-neutral-700">{group.label}</p>
                    <div
                      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                      data-testid={`group-${category.id}-${group.label}`}
                    >
                      {group.variants.map((variant) => {
                        const isSelected = variant.id === selectedId;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => onSelect(variant.id, variant.definition)}
                            className={`rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                              isSelected
                                ? 'border-[#2563EB] bg-[#2563EB]/5 text-brand-navy shadow-sm'
                                : 'border-neutral-200 bg-white text-neutral-800 hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5'
                            } p-4`}
                            data-testid={`notice-option-${variant.id}`}
                          >
                            <span className="block text-sm font-semibold">{variant.label}</span>
                            <span className="mt-1 block text-xs text-neutral-600">
                              {category.label} · {variant.variant}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </DisclosureSection>
          );
        })}
      </div>
      <div className="flex items-center justify-end border-t border-neutral-200/70 px-6 py-4">
        <button
          type="button"
          className={`${UI.btnPrimary} min-w-[150px]`}
          onClick={onContinue}
          disabled={!selectedId}
          data-testid="notice-step-continue"
        >
          Continue
        </button>
      </div>
    </section>
  );
}
