import React from "react";
import * as UI from "@/styles/ui";
import { NOTICE_CATEGORY_TREE, type NoticeDefinition } from "@/next/publish/config/noticeTypes";
import DisclosureSection from "@/next/publish/flow/components/DisclosureSection";

const STORAGE_PREFIX = "pn:notice-group:";

export type NoticeTypeStepProps = {
  selectedId: string | null;
  onSelect: (id: string, definition: NoticeDefinition) => void;
  onContinue: () => void;
  continuePending?: boolean;
  guardMessage?: string | null;
  onClearGuard?: () => void;
};

type OpenGroupsState = Record<string, boolean>;

function persistGroupState(id: string, open: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${id}`, open ? "open" : "closed");
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }
}

function readStoredState(id: string): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (stored === "open") return true;
    if (stored === "closed") return false;
  } catch {
    // ignore
  }
  return undefined;
}

export default function NoticeTypeStep({
  selectedId,
  onSelect,
  onContinue,
  continuePending,
  guardMessage,
  onClearGuard,
}: NoticeTypeStepProps) {
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

  const [openGroups, setOpenGroups] = React.useState<OpenGroupsState>({});
  React.useEffect(() => {
    const initial: OpenGroupsState = {};
    NOTICE_CATEGORY_TREE.forEach((category) => {
      const stored = readStoredState(category.id);
      const open = stored ?? (selectedCategoryId === category.id ? true : false);
      initial[category.id] = !!open;
    });
    setOpenGroups(initial);
  }, [selectedCategoryId]);

  const toggleGroup = React.useCallback((categoryId: string, nextOpen: boolean) => {
    setOpenGroups((prev) => {
      const currentOpen = prev[categoryId] ?? false;
      if (currentOpen === nextOpen) return prev;
      const next = { ...prev, [categoryId]: nextOpen };
      persistGroupState(categoryId, nextOpen);
      return next;
    });
  }, []);

  return (
    <section
      className={`${UI.wizardCard} space-y-8 p-0`}
      data-testid="notice-step-collapsible"
      aria-busy={continuePending ? "true" : undefined}
    >
      <div data-e2e="step-marker" data-step="step-1">
        STEP: NoticeTypeStep
      </div>
      <header className="space-y-8 px-8 pb-0 pt-12 sm:px-12">
        <span className={UI.wizardPill}>Step 1</span>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-[40px] lg:text-5xl">
            Confirm your notice type
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-slate-600">
            Choose the legislation and variation. This powers validation, structured templates, and pricing.
          </p>
        </div>
        {guardMessage ? (
          <div
            className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-4 text-sm text-amber-900 shadow-sm"
            role="alert"
          >
            {guardMessage}
          </div>
        ) : null}
      </header>

      <div className="space-y-8 px-6 pb-12 sm:px-12">
        <div
          className="max-h-[520px] space-y-5 overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white/75 p-6 shadow-inner"
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
                onToggle={(event) => toggleGroup(category.id, event.currentTarget.open)}
              >
                <div className="space-y-5">
                  {category.groups.map((group) => (
                    <div key={group.label} className="space-y-3">
                      <p className="text-sm font-bold text-slate-800">{group.label}</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid={`group-${category.id}-${group.label}`}>
                        {group.variants.map((variant) => {
                          const isSelected = variant.id === selectedId;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                onClearGuard?.();
                                onSelect(variant.id, variant.definition);
                              }}
                              className={`group rounded-2xl border px-4 py-4 text-left transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600/10 text-slate-900 shadow-[0_16px_40px_rgba(37,99,235,0.18)] scale-[1.02]"
                                  : "border-slate-200/70 bg-white/90 text-slate-800 hover:border-blue-600/40 hover:bg-blue-600/8 hover:scale-[1.01]"
                              }`}
                              data-testid={`notice-option-${variant.id}`}
                            >
                              <span className="block text-sm font-bold tracking-tight">{variant.label}</span>
                              <span className="mt-1 block text-xs font-medium text-slate-600">
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

        <footer className="sticky bottom-8 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-left text-sm font-medium leading-relaxed text-slate-700">
              {selectedId ? "Ready to continue" : "Select a notice type to proceed"}
            </div>
            <div className="text-xs text-slate-500">
              {selectedId ? "Tailored templates and pricing guidance are ready." : "Pick a notice to unlock tailored templates and pricing guidance."}
            </div>
          </div>
          <button
            type="button"
            className={`${UI.btnPrimary} min-w-[160px] transition-all duration-200 ${
              selectedId ? 'hover:scale-[1.02] opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={onContinue}
            disabled={!selectedId || continuePending}
            data-testid="notice-step-continue"
            aria-label={selectedId ? "Continue to next step" : "Select a notice type to continue"}
          >
            {continuePending ? "Working…" : "Continue"}
          </button>
        </footer>
      </div>
    </section>
  );
}
