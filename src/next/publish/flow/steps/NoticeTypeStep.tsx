import React from "react";
import { Check } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showGuidance, setShowGuidance] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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
      // All categories open by default for better accessibility
      const open = stored ?? true;
      initial[category.id] = !!open;
    });
    setOpenGroups(initial);
  }, [selectedCategoryId]);

  // Keyboard nav for search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const toggleGroup = React.useCallback((categoryId: string, nextOpen: boolean) => {
    setOpenGroups((prev) => {
      const currentOpen = prev[categoryId] ?? false;
      if (currentOpen === nextOpen) return prev;
      const next = { ...prev, [categoryId]: nextOpen };
      persistGroupState(categoryId, nextOpen);
      return next;
    });
  }, []);

  // Filter variants based on search
  const filteredTree = React.useMemo(() => {
    if (!searchQuery.trim()) return NOTICE_CATEGORY_TREE;

    const query = searchQuery.toLowerCase();
    return NOTICE_CATEGORY_TREE.map((category) => ({
      ...category,
      groups: category.groups.map((group) => ({
        ...group,
        variants: group.variants.filter(
          (variant) =>
            variant.label.toLowerCase().includes(query) ||
            category.label.toLowerCase().includes(query) ||
            variant.variant.toLowerCase().includes(query)
        ),
      })).filter((group) => group.variants.length > 0),
    })).filter((category) => category.groups.length > 0);
  }, [searchQuery]);

  // Auto-expand all categories when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const allOpen: OpenGroupsState = {};
      filteredTree.forEach((category) => {
        allOpen[category.id] = true;
      });
      setOpenGroups(allOpen);
    }
  }, [searchQuery, filteredTree]);

  const selectedVariant = React.useMemo(() => {
    if (!selectedId) return null;
    for (const category of NOTICE_CATEGORY_TREE) {
      for (const group of category.groups) {
        for (const variant of group.variants) {
          if (variant.id === selectedId) return variant;
        }
      }
    }
    return null;
  }, [selectedId]);

  const hasResults = filteredTree.length > 0;

  return (
    <section
      className="mx-auto max-w-6xl space-y-10"
      data-testid="notice-step-collapsible"
      aria-busy={continuePending ? "true" : undefined}
    >
      {/* Glass Section Header Card */}
      <header className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 p-8 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-sm md:p-12">
        {guardMessage ? (
          <div
            className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-6 py-4 text-base font-medium text-amber-900 shadow-sm"
            role="alert"
          >
            {guardMessage}
          </div>
        ) : null}

        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              What kind of notice are you publishing?
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600">
              Choose your notice type below. We'll prepare the right template and guidance.
            </p>
          </div>

          {/* Enhanced Search with Icon */}
          <div className="relative mx-auto max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notice types... (press Esc to clear)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-12 py-4 text-base text-slate-900 placeholder-slate-400 shadow-sm ring-1 ring-slate-200 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Search notice types"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search (or press Escape)"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Selected Notice Pill */}
          {selectedVariant && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white px-6 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">{selectedVariant.label}</p>
                  <p className="text-xs text-blue-700">{selectedVariant.variant}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelect("", selectedVariant.definition);
                  onClearGuard?.();
                }}
                className="rounded-full p-1.5 text-blue-600 transition-colors hover:bg-blue-100"
                aria-label="Clear selection"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-10">
        {!hasResults ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No matches found</h3>
            <p className="mt-3 text-lg text-slate-600">
              We couldn't find any notice types matching "<strong>{searchQuery}</strong>".
            </p>
            <p className="mt-2 text-base text-slate-500">
              Try different keywords or browse all categories below.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.4)] hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Clear search and browse all
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className="space-y-8"
            role="radiogroup"
            aria-label="Notice categories"
          >
          {filteredTree.map((category) => {
            const isOpen = openGroups[category.id] ?? false;
            return (
              <DisclosureSection
                key={category.id}
                title={category.label}
                open={isOpen}
                onToggle={(event) => toggleGroup(category.id, event.currentTarget.open)}
              >
                <div className="space-y-12">
                  {category.groups.map((group) => (
                    <div key={group.label} className="space-y-5">
                      <p className="text-sm font-bold uppercase tracking-wider text-slate-500">{group.label}</p>
                      <div className="grid gap-5 sm:grid-cols-2" data-testid={`group-${category.id}-${group.label}`}>
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
                              className={`group relative cursor-pointer rounded-2xl border px-7 py-6 text-left transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                                isSelected
                                  ? "border-blue-600 bg-gradient-to-br from-blue-50 to-white shadow-[0_8px_24px_rgba(37,99,235,0.2)] translate-y-[-4px] ring-2 ring-blue-600"
                                  : "border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] hover:border-blue-400 hover:shadow-[0_12px_32px_rgba(37,99,235,0.12)] hover:translate-y-[-4px] active:translate-y-[-1px] active:shadow-[0_4px_12px_rgba(37,99,235,0.08)]"
                              }`}
                              data-testid={`notice-option-${variant.id}`}
                            >
                              <span className={`block text-lg font-bold leading-snug ${
                                isSelected ? "text-blue-900" : "text-slate-900"
                              }`}>
                                {variant.label}
                              </span>
                              <span className={`mt-2 block text-sm leading-relaxed ${
                                isSelected ? "text-blue-700" : "text-slate-600"
                              }`}>
                                {variant.variant}
                              </span>
                              {isSelected && (
                                <div className="absolute right-5 top-5">
                                  <div className="rounded-full bg-blue-600 p-1">
                                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              )}
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
        )}

        {/* Sticky Frosted Action Bar with Guidance */}
        <div className="sticky bottom-6 -mx-4 sm:-mx-0">
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-[0_16px_48px_rgba(15,23,42,0.15)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-6 px-8 py-6">
              <div className="flex flex-1 items-center gap-6">
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900">
                    {selectedId ? "Looks good" : "Choose a notice type"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedId ? "We'll prepare your tailored template next." : "We'll tailor everything automatically for you."}
                  </p>
                </div>
                {selectedId && (
                  <button
                    type="button"
                    onClick={() => setShowGuidance(!showGuidance)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View guidance
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onContinue}
                disabled={!selectedId || continuePending}
                className={`inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                  selectedId
                    ? 'bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
                data-testid="notice-step-continue"
                aria-label={selectedId ? "Continue to next step" : "Select a notice type to continue"}
              >
                {continuePending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Working...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Guidance Panel */}
            {showGuidance && selectedVariant && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-200 border-t border-slate-200 bg-slate-50/80 px-8 py-6">
                <h3 className="mb-4 text-base font-bold text-slate-900">Key requirements for {selectedVariant.label}</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>Complete applicant and premises details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>Valid dates for application and representation deadlines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                    <span>Licensing authority contact information</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
