import * as React from 'react';
import RequiredHint from '@/components/notice/RequiredHint';

export function normalizeUkPostcode(raw: string): string {
  const compact = raw.trim().replace(/\s+/g, '');
  if (!compact) return '';
  const upper = compact.toUpperCase();
  if (upper.length <= 3) return upper;
  return `${upper.slice(0, upper.length - 3)} ${upper.slice(-3)}`;
}

export function isValidUkPostcode(postcode: string): boolean {
  const UK_POSTCODE_REGEX =
    /^(GIR 0AA|[A-PR-UWYZ][A-HK-Y]?[0-9][0-9A-HJKPSTUW]? \d[ABD-HJLNP-UW-Z]{2})$/;
  return UK_POSTCODE_REGEX.test(postcode);
}

export type Address = {
  uprn?: string;
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  country?: 'UK';
};

type Suggestion = Address & {
  id: string;
  label: string;
};

type FieldKey = 'line1' | 'town' | 'postcode';

type FieldErrors = Record<FieldKey, string | null>;

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;
const ADDR_API_URL = ((import.meta.env as Record<string, unknown>).VITE_ADDR_API_URL as string | undefined) ?? '';
const ADDR_API_KEY = ((import.meta.env as Record<string, unknown>).VITE_ADDR_API_KEY as string | undefined) ?? '';

const isProductionRuntime = () =>
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') || Boolean(import.meta.env?.PROD);

function toSuggestion(raw: any, index: number): Suggestion | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const parts = raw.split(',').map((segment) => segment.trim()).filter(Boolean);
    if (!parts.length) return null;
    const postcode = normalizeUkPostcode(parts[parts.length - 1] ?? '');
    const town = parts.length > 2 ? parts[parts.length - 2] : parts[1] ?? '';
    const line1 = parts[0] ?? '';
    if (!line1 || !town || !postcode) return null;
    return {
      id: `${line1}-${town}-${postcode}-${index}`,
      label: raw,
      line1,
      town,
      line2: parts.length > 3 ? parts[1] : undefined,
      postcode,
      uprn: undefined,
      country: 'UK',
    };
  }

  if (typeof raw !== 'object') return null;

  const line1 = typeof raw.line1 === 'string' ? raw.line1.trim() : typeof raw.addressLine1 === 'string' ? raw.addressLine1.trim() : '';
  const line2Raw =
    typeof raw.line2 === 'string'
      ? raw.line2.trim()
      : typeof raw.addressLine2 === 'string'
        ? raw.addressLine2.trim()
        : typeof raw.street === 'string'
          ? raw.street.trim()
          : undefined;
  const town =
    typeof raw.town === 'string'
      ? raw.town.trim()
      : typeof raw.city === 'string'
        ? raw.city.trim()
        : typeof raw.locality === 'string'
          ? raw.locality.trim()
          : '';
  const postcodeRaw =
    typeof raw.postcode === 'string'
      ? raw.postcode
      : typeof raw.postCode === 'string'
        ? raw.postCode
        : typeof raw.post_code === 'string'
          ? raw.post_code
          : '';
  const postcode = normalizeUkPostcode(postcodeRaw);

  if (!line1 || !town || !postcode) return null;

  const uprn = typeof raw.uprn === 'string' ? raw.uprn.trim() : typeof raw.UPRN === 'string' ? raw.UPRN.trim() : undefined;
  const label =
    typeof raw.label === 'string' && raw.label.trim()
      ? raw.label.trim()
      : [line1, line2Raw, town, postcode].filter(Boolean).join(', ');
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : uprn && uprn.trim()
        ? uprn.trim()
        : `${line1}-${town}-${postcode}-${index}`;

  return {
    id,
    label,
    line1,
    line2: line2Raw || undefined,
    town,
    postcode,
    uprn,
    country: 'UK',
  };
}

async function fetchSuggestions(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  const base = ADDR_API_URL.trim();
  if (!base) return [];

  let url: URL;
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    url = base.startsWith('http') ? new URL(base) : new URL(base, origin);
  } catch {
    return [];
  }

  const key = url.searchParams.has('query') ? 'query' : url.searchParams.has('q') ? 'q' : 'q';
  url.searchParams.set(key, query);

  const headers: HeadersInit = { Accept: 'application/json' };
  if (ADDR_API_KEY) {
    headers['x-api-key'] = ADDR_API_KEY;
  }

  const response = await fetch(url.toString(), { signal, headers });
  if (!response.ok) {
    throw new Error(`Address lookup failed (${response.status})`);
  }

  const data = await response.json();
  const collection = Array.isArray((data as any)?.results)
    ? (data as any).results
    : Array.isArray((data as any)?.suggestions)
      ? (data as any).suggestions
      : Array.isArray(data)
        ? data
        : [];

  return collection
    .map((entry: any, index: number) => toSuggestion(entry, index))
    .filter(Boolean) as Suggestion[];
}

export type AddressBlockHandle = {
  validateAll: () => boolean;
};

type AddressBlockProps = {
  id?: string;
  label?: string;
  value: Address;
  onChange: (next: Address) => void;
  required?: boolean;
  captureUPRN?: boolean;
  describedById?: string;
};

const REQUIRED_FIELDS: FieldKey[] = ['line1', 'town', 'postcode'];

const AddressBlock = React.forwardRef<AddressBlockHandle, AddressBlockProps>(function AddressBlock(
  { id, label = 'Address', value, onChange, required, captureUPRN = true, describedById },
  ref
) {
  const fieldsetId = id ?? React.useId();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = React.useState(value.line1 ?? '');
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<FieldErrors>({ line1: null, town: null, postcode: null });
  const [touched, setTouched] = React.useState<Record<FieldKey, boolean>>({
    line1: Boolean(value.line1?.trim()),
    town: Boolean(value.town?.trim()),
    postcode: Boolean(value.postcode?.trim()),
  });
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const listboxId = `${fieldsetId}-suggestions`;
  const line1Id = `${fieldsetId}-line1`;
  const line2Id = `${fieldsetId}-line2`;
  const townId = `${fieldsetId}-town`;
  const postcodeId = `${fieldsetId}-postcode`;
  const uprnId = `${fieldsetId}-uprn`;

  const errorIds: Record<FieldKey, string> = {
    line1: `${line1Id}-error`,
    town: `${townId}-error`,
    postcode: `${postcodeId}-error`,
  };

  const updateAddress = React.useCallback(
    (patch: Partial<Address>) => {
      const next = { ...value, ...patch } as Address;
      if (!next.country) next.country = 'UK';
      onChange(next);
    },
    [onChange, value]
  );

  const commitField = React.useCallback(
    (field: keyof Address, raw: string) => {
      const nextValue = raw;
      const patch = { [field]: nextValue } as Partial<Address>;
      if (
        captureUPRN &&
        (field === 'line1' || field === 'town' || field === 'postcode') &&
        raw !== (value[field as keyof Address] as string | undefined)
      ) {
        patch.uprn = undefined;
      }
      updateAddress(patch);
    },
    [captureUPRN, updateAddress, value]
  );

  const validateField = React.useCallback(
    (field: FieldKey, rawValue: string) => {
      if (!required) {
        return { error: null, value: field === 'postcode' ? normalizeUkPostcode(rawValue) : rawValue };
      }

      if (field === 'line1' || field === 'town') {
        const trimmed = rawValue.trim();
        return { error: trimmed ? null : 'Required', value: rawValue };
      }

      const normalized = normalizeUkPostcode(rawValue);
      if (!normalized) {
        return { error: 'Required', value: normalized };
      }
      if (!isValidUkPostcode(normalized)) {
        return { error: 'Enter a valid UK postcode', value: normalized };
      }
      return { error: null, value: normalized };
    },
    [required]
  );

  const setFieldError = React.useCallback((field: FieldKey, message: string | null) => {
    setErrors((prev) => {
      if (prev[field] === message) return prev;
      return { ...prev, [field]: message };
    });
  }, []);

  const markTouched = React.useCallback((field: FieldKey) => {
    setTouched((prev) => {
      if (prev[field]) return prev;
      return { ...prev, [field]: true };
    });
  }, []);

  const validateAll = React.useCallback(() => {
    const nextErrors: FieldErrors = { line1: null, town: null, postcode: null };
    let normalizedPostcode = value.postcode;

    REQUIRED_FIELDS.forEach((field) => {
      const rawFieldValue = (value[field] as string | undefined) ?? '';
      const { error, value: maybeNormalized } = validateField(field, rawFieldValue);
      nextErrors[field] = error;
      if (field === 'postcode') {
        normalizedPostcode = maybeNormalized;
      }
    });

    if (normalizedPostcode !== value.postcode) {
      commitField('postcode', normalizedPostcode);
    }

    setErrors(nextErrors);
    setTouched({ line1: true, town: true, postcode: true });
    setSubmitAttempted(true);

    return !Object.values(nextErrors).some(Boolean);
  }, [commitField, validateField, value]);

  React.useImperativeHandle(ref, () => ({ validateAll }), [validateAll]);

  const handleSuggestionSelect = React.useCallback(
    (item: Suggestion) => {
      const next: Address = {
        ...value,
        line1: item.line1,
        line2: item.line2 ?? value.line2,
        town: item.town,
        postcode: item.postcode,
        uprn: captureUPRN ? item.uprn : undefined,
        country: 'UK',
      };
      setSearchTerm(item.line1);
      setSuggestions([]);
      setActiveIndex(-1);
      setOpen(false);
      setError(null);
      onChange(next);

      if (required) {
        setErrors({ line1: null, town: null, postcode: null });
        setTouched({ line1: true, town: true, postcode: true });
        setSubmitAttempted(false);
      }
    },
    [captureUPRN, onChange, value]
  );

  React.useEffect(() => {
    if (isProductionRuntime()) {
      return;
    }
    const node = rootRef.current;
    if (!node) return;
    const handleTestSelect = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Suggestion>>).detail;
      if (!detail) return;
      const fallbackLabel = [detail.line1, detail.line2, detail.town, detail.postcode].filter(Boolean).join(', ');
      handleSuggestionSelect({
        id: detail.id ?? 'test-suggestion',
        label: detail.label ?? (fallbackLabel || 'Test suggestion'),
        line1: detail.line1 ?? value.line1,
        line2: detail.line2 ?? value.line2,
        town: detail.town ?? value.town,
        postcode: normalizeUkPostcode(detail.postcode ?? value.postcode),
        uprn: detail.uprn,
        country: 'UK',
      });
    };
    node.addEventListener('address-block:test-select', handleTestSelect as EventListener);
    return () => {
      node.removeEventListener('address-block:test-select', handleTestSelect as EventListener);
    };
  }, [handleSuggestionSelect, value.line1, value.line2, value.town, value.postcode]);

  const activeDescendant =
    open && activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  React.useEffect(() => {
    if (value.line1 !== searchTerm) {
      setSearchTerm(value.line1);
    }
  }, [searchTerm, value.line1]);

  React.useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < MIN_QUERY_LENGTH || !ADDR_API_URL.trim()) {
      setSuggestions([]);
      setActiveIndex(-1);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchSuggestions(trimmed, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setActiveIndex(results.length ? 0 : -1);
          setOpen(results.length > 0);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setActiveIndex(-1);
          setOpen(false);
          setError(err instanceof Error ? err.message : 'Address lookup unavailable.');
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
      setActiveIndex(-1);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLine1KeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        if (suggestions.length) {
          setOpen(true);
          setActiveIndex(event.key === 'ArrowDown' ? 0 : suggestions.length - 1);
          event.preventDefault();
        }
        return;
      }

      if (!open) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= suggestions.length ? 0 : nextIndex;
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const nextIndex = prev - 1;
          return nextIndex < 0 ? suggestions.length - 1 : nextIndex;
        });
      } else if (event.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          event.preventDefault();
          handleSuggestionSelect(suggestions[activeIndex]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [activeIndex, handleSuggestionSelect, open, suggestions]
  );

  React.useEffect(() => {
    if (!required) return;
    setErrors((prev) => {
      let mutated = false;
      const next: FieldErrors = { ...prev };
      REQUIRED_FIELDS.forEach((field) => {
        if (!touched[field] && !submitAttempted) return;
        const rawValue = (value[field] as string | undefined) ?? '';
        const { error } = validateField(field, rawValue);
        if (next[field] !== error) {
          next[field] = error;
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [required, submitAttempted, touched, validateField, value]);

  React.useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const nearestForm = node.closest('form');
    if (!nearestForm) return;
    const handleSubmit = (event: Event) => {
      if (!validateAll()) {
        event.preventDefault();
      }
    };
    nearestForm.addEventListener('submit', handleSubmit);
    return () => {
      nearestForm.removeEventListener('submit', handleSubmit);
    };
  }, [validateAll]);

  React.useEffect(() => {
    if (isProductionRuntime()) {
      return;
    }
    const node = rootRef.current;
    if (!node) return;
    const handleValidate = () => {
      validateAll();
    };
    node.addEventListener('address-block:validate', handleValidate as EventListener);
    return () => {
      node.removeEventListener('address-block:validate', handleValidate as EventListener);
    };
  }, [validateAll]);

  const inputBaseClasses =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary';
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-500';

  const fieldLabels: Record<FieldKey, string> = {
    line1: 'Address line 1',
    town: 'Town or city',
    postcode: 'Postcode',
  };

  const visibleErrors = REQUIRED_FIELDS.filter((field) => errors[field] && (touched[field] || submitAttempted));

  return (
    <div ref={rootRef} className="space-y-4" data-address-block-id={fieldsetId}>
      <fieldset id={fieldsetId} className="space-y-4" aria-describedby={describedById}>
        <legend className="text-sm font-medium text-foreground">{label}</legend>

        {submitAttempted && visibleErrors.length > 0 && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
            aria-live="polite"
            data-testid="addr-error-summary"
          >
            <p className="font-medium">Check the highlighted address details</p>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {visibleErrors.map((field) => {
                const errorMessage = errors[field];
                const fieldId = field === 'line1' ? line1Id : field === 'town' ? townId : postcodeId;
                const fallback = `${fieldLabels[field]} is required`;
                return (
                  <li key={field}>
                    <a className="underline" href={`#${fieldId}`}>
                      {errorMessage && errorMessage !== 'Required' ? errorMessage : fallback}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="relative space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={line1Id} className="text-sm font-medium text-foreground">
              Address line 1
            </label>
            {required && <RequiredHint aria-hidden="true">Required</RequiredHint>}
          </div>
          <input
            id={line1Id}
            type="text"
            className={`${inputBaseClasses} ${errors.line1 && (touched.line1 || submitAttempted) ? errorClasses : ''}`}
            value={value.line1}
            data-testid="addr-line1"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              commitField('line1', event.target.value);
              if (touched.line1 || submitAttempted) {
                const { error } = validateField('line1', event.target.value);
                setFieldError('line1', error);
              }
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onKeyDown={handleLine1KeyDown}
            onBlur={(event) => {
              markTouched('line1');
              const { error } = validateField('line1', event.target.value);
              setFieldError('line1', error);
            }}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            role="combobox"
            aria-activedescendant={activeDescendant}
            aria-describedby={[describedById, errors.line1 && (touched.line1 || submitAttempted) ? errorIds.line1 : undefined]
              .filter(Boolean)
              .join(' ') || undefined}
            aria-invalid={errors.line1 && (touched.line1 || submitAttempted) ? 'true' : undefined}
            aria-required={required || undefined}
            autoComplete="address-line1"
          />
          {open && suggestions.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-popover shadow-lg"
            >
              {suggestions.map((item, index) => {
                const optionId = `${listboxId}-option-${index}`;
                const isActive = index === activeIndex;
                return (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      id={optionId}
                      role="option"
                      aria-selected={isActive}
                      className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-primary/10 ${isActive ? 'bg-primary/10' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(item)}
                    >
                      <span className="font-medium text-foreground">{item.label}</span>
                      {item.uprn && <span className="text-xs text-muted-foreground">UPRN: {item.uprn}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {errors.line1 && (touched.line1 || submitAttempted) && (
            <RequiredHint
              id={errorIds.line1}
              role="alert"
              aria-live="polite"
              className="mt-1 text-xs font-medium text-red-600"
              data-testid="addr-error-line1"
            >
              {errors.line1 === 'Required' ? 'Enter address line 1' : errors.line1}
            </RequiredHint>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={line2Id} className="text-sm font-medium text-foreground">
            Address line 2 (optional)
          </label>
          <input
            id={line2Id}
            type="text"
            className={inputBaseClasses}
            value={value.line2 ?? ''}
            onChange={(event) => commitField('line2', event.target.value)}
            autoComplete="address-line2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={townId} className="text-sm font-medium text-foreground">
                Town or city
              </label>
              {required && <RequiredHint aria-hidden="true">Required</RequiredHint>}
            </div>
            <input
              id={townId}
              type="text"
              className={`${inputBaseClasses} ${errors.town && (touched.town || submitAttempted) ? errorClasses : ''}`}
              value={value.town}
              data-testid="addr-town"
              onChange={(event) => {
                commitField('town', event.target.value);
                if (touched.town || submitAttempted) {
                  const { error } = validateField('town', event.target.value);
                  setFieldError('town', error);
                }
              }}
              onBlur={(event) => {
                markTouched('town');
                const { error } = validateField('town', event.target.value);
                setFieldError('town', error);
              }}
              aria-required={required || undefined}
              aria-describedby={errors.town && (touched.town || submitAttempted) ? errorIds.town : undefined}
              aria-invalid={errors.town && (touched.town || submitAttempted) ? 'true' : undefined}
              autoComplete="address-level2"
            />
            {errors.town && (touched.town || submitAttempted) && (
              <RequiredHint
                id={errorIds.town}
                role="alert"
                aria-live="polite"
                className="mt-1 text-xs font-medium text-red-600"
                data-testid="addr-error-town"
              >
                {errors.town === 'Required' ? 'Enter a town or city' : errors.town}
              </RequiredHint>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={postcodeId} className="text-sm font-medium text-foreground">
                Postcode
              </label>
              {required && <RequiredHint aria-hidden="true">Required</RequiredHint>}
            </div>
            <input
              id={postcodeId}
              type="text"
              className={`${inputBaseClasses} uppercase ${errors.postcode && (touched.postcode || submitAttempted) ? errorClasses : ''}`}
              value={value.postcode}
              data-testid="addr-postcode"
              onChange={(event) => {
                commitField('postcode', event.target.value);
                if (touched.postcode || submitAttempted) {
                  const { error } = validateField('postcode', event.target.value);
                  setFieldError('postcode', error);
                }
              }}
              onBlur={(event) => {
                markTouched('postcode');
                const { error, value: normalised } = validateField('postcode', event.target.value);
                setFieldError('postcode', error);
                if (normalised !== value.postcode) {
                  commitField('postcode', normalised);
                }
              }}
              aria-required={required || undefined}
              aria-describedby={errors.postcode && (touched.postcode || submitAttempted) ? errorIds.postcode : undefined}
              aria-invalid={errors.postcode && (touched.postcode || submitAttempted) ? 'true' : undefined}
              autoComplete="postal-code"
            />
            {errors.postcode && (touched.postcode || submitAttempted) && (
              <RequiredHint
                id={errorIds.postcode}
                role="alert"
                aria-live="polite"
                className="mt-1 text-xs font-medium text-red-600"
                data-testid="addr-error-postcode"
              >
                {errors.postcode === 'Required' ? 'Enter a postcode' : errors.postcode}
              </RequiredHint>
            )}
          </div>
        </div>

        {captureUPRN && (
          <div className="space-y-1">
            <label htmlFor={uprnId} className="text-sm font-medium text-foreground">
              UPRN
            </label>
            <input
              id={uprnId}
              type="text"
              className={inputBaseClasses}
              value={value.uprn ?? ''}
              data-testid="addr-uprn"
              onChange={(event) => updateAddress({ uprn: event.target.value })}
              autoComplete="on"
            />
            <p className="mt-1 text-xs text-muted-foreground">Automatically captured when selecting from suggestions.</p>
          </div>
        )}

        {loading && (
          <p className="text-xs text-muted-foreground">Searching for matching addresses…</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </fieldset>
    </div>
  );
});

export default AddressBlock;
