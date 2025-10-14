import React from "react";
import AddressLookup, { mockProvider, type AddressResult } from "@/components/AddressLookup";
import * as UI from "@/styles/ui";
import UploadDropzone, { type UploadStatus } from "@/components/publish/UploadDropzone";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import {
  getMandatoryFieldsForOCR,
  type PlaceholderKey,
  type FieldBlueprint,
} from "@/next/publish/config/formBlueprints";
import ActivitiesSelector, { type ActivityKey } from "@/components/publish/ActivitiesSelector";

export type UploadOcrPaneProps = {
  definition: NoticeDefinition | null;
  uploadComponentProps: {
    onText: (text: string) => void;
    onMeta?: (meta: { engine?: string; [k: string]: unknown }) => void;
    onStatusChange: (status: UploadStatus) => void;
  };
  showRequiredDetails: boolean;
  templateDraft: Record<string, unknown> | null;
  onChange: (path: (string | number)[], value: unknown) => void;
  errors: Record<string, string[] | undefined>;
  onSwitchToTemplate: () => void;
};

const GRID_SPAN_CLASSES: Record<number, string> = {
  12: "md:col-span-12",
  8: "md:col-span-8",
  6: "md:col-span-6",
  4: "md:col-span-4",
};

export default function UploadOcrPane({
  definition,
  uploadComponentProps,
  showRequiredDetails,
  templateDraft,
  onChange,
  errors,
  onSwitchToTemplate,
}: UploadOcrPaneProps) {
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus>("idle");
  const blueprint = React.useMemo(
    () => (definition ? getMandatoryFieldsForOCR(definition) : null),
    [definition]
  );

  const getValue = React.useCallback(
    (token: PlaceholderKey): string => {
      const raw = templateDraft?.[token];
      if (typeof raw === "string") return raw;
      if (typeof raw === "number") return String(raw);
      return "";
    },
    [templateDraft]
  );

  const setValue = React.useCallback(
    (token: PlaceholderKey, value: string) => {
      onChange([token], value);
    },
    [onChange]
  );

  const missingCount = React.useMemo(() => {
    if (!blueprint) return 0;
    let count = 0;
    for (const section of blueprint.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const value = getValue(field.token);
          const hasError = errors[field.token]?.length;
          if (!value || hasError) {
            count++;
          }
        }
      }
    }
    return count;
  }, [blueprint, getValue, errors]);

  return (
    <div className="space-y-8">
      {/* Form title with subtle elegance */}
      {definition && (
        <div className="border-b border-slate-200/60 pb-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{definition.label}</h2>
        </div>
      )}

      <UploadDropzone
        heading="Upload your notice"
        description="PDF, DOCX, PNG or JPG up to 25MB."
        onText={uploadComponentProps.onText}
        onMeta={uploadComponentProps.onMeta}
        onStatusChange={(next) => {
          setUploadStatus(next);
          uploadComponentProps.onStatusChange(next);
        }}
      />
      {uploadStatus === "idle" && !showRequiredDetails && (
        <p className="text-sm leading-6 text-slate-500 transition-opacity duration-300">
          Don't have a file?{" "}
          <button
            type="button"
            className="font-medium text-blue-600 underline-offset-4 hover:underline"
            onClick={onSwitchToTemplate}
          >
            Use the template instead
          </button>
          .
        </p>
      )}

      {showRequiredDetails && blueprint && (
        <section
          className="space-y-8 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all duration-300 md:p-8 motion-safe:animate-fade-in-up"
        >
          <header className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h3 className="text-[16px] font-semibold leading-tight tracking-tight text-slate-900">
                  Complete the required details
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  All fields must be manually entered to ensure accuracy. We've kept your uploaded document for reference.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onSwitchToTemplate}
              >
                Use template instead
              </button>
            </div>
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
          </header>

          <div className="space-y-8">
            {blueprint.sections.map((section) => (
              <section key={section.id} className="space-y-5">
                <div className="space-y-1">
                  <h4 className="text-[14px] font-semibold tracking-tight text-slate-900">{section.title}</h4>
                  {section.description && (
                    <p className="text-[12px] text-slate-500">{section.description}</p>
                  )}
                </div>
                <div className="space-y-5">
                  {section.fields.map((field) => (
                    <FieldInput
                      key={`${section.id}-${field.token}`}
                      field={field}
                      value={getValue(field.token)}
                      onChange={(value) => setValue(field.token, value)}
                      errors={errors[field.token]}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type FieldInputProps = {
  field: FieldBlueprint;
  value: string;
  onChange: (value: string) => void;
  errors?: string[];
};

function FieldInput({ field, value, onChange, errors }: FieldInputProps) {
  const inputId = React.useId();
  const helperId = field.hint ? `${inputId}-hint` : undefined;
  const errorId = errors?.length ? `${inputId}-error` : undefined;

  // Detect address fields by token name
  const isAddressField = field.token.includes("ADDRESS") && field.type === "textarea";

  const commonLabel = (
    <label htmlFor={inputId} className="block text-[13px] font-medium text-slate-700">
      {field.label}
      {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
    </label>
  );

  // Handle LICENSABLE_ACTIVITIES field with custom component
  if (field.token === "LICENSABLE_ACTIVITIES") {
    const selectedActivities: ActivityKey[] = value
      ? value.split(",").map(s => s.trim() as ActivityKey).filter(Boolean)
      : [];

    return (
      <div className="space-y-2">
        <ActivitiesSelector
          value={selectedActivities}
          onChange={(newValue) => {
            onChange(newValue.join(", "));
          }}
        />
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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const raw = event.target.value;
    if (field.type === "number") {
      const normalised = raw.replace(/[^\d]/g, "");
      onChange(normalised);
      return;
    }
    onChange(raw);
  };

  const handleAddressResolved = React.useCallback(
    (address: AddressResult) => {
      const parts = [];
      if (address.line1) parts.push(address.line1);
      if (address.line2) parts.push(address.line2);
      if (address.line3) parts.push(address.line3);
      if (address.town) parts.push(address.town);
      if (address.county) parts.push(address.county);
      if (address.postcode) parts.push(address.postcode);
      if (address.country && address.country !== "UK") parts.push(address.country);
      onChange(parts.join(", "));
    },
    [onChange]
  );

  const baseInputClasses = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
  const errorInputClasses = "border-rose-300 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-500/10";

  let control: React.ReactNode = null;

  switch (field.type) {
    case "textarea":
      control = (
        <textarea
          id={inputId}
          value={value}
          rows={field.rows ?? 4}
          className={`${errors?.length ? errorInputClasses : baseInputClasses} min-h-[100px] resize-y`}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
    case "email":
    case "date":
    case "tel":
    case "url":
    case "number":
      control = (
        <input
          id={inputId}
          type={field.type === "number" ? "text" : field.type}
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
    case "select":
      control = (
        <select
          id={inputId}
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
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
          type="text"
          value={value}
          className={errors?.length ? errorInputClasses : baseInputClasses}
          aria-required={field.required ? "true" : undefined}
          aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
          onChange={handleChange}
          maxLength={field.maxLength}
        />
      );
      break;
  }

  return (
    <div className="space-y-2">
      {commonLabel}

      {isAddressField && (
        <div className="space-y-2">
          <AddressLookup
            provider={mockProvider}
            placeholder="Search for address or postcode"
            onResolved={handleAddressResolved}
            className="w-full"
          />
          <p className="text-[12px] text-slate-500">
            Search above to auto-fill, or type directly into the field below
          </p>
        </div>
      )}

      {control}

      {field.hint ? (
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
