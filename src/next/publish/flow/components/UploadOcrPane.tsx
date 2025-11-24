import React from "react";
import AddressLookup, { mockProvider, type AddressResult } from "@/components/AddressLookup";
import AddressFields from "@/components/AddressFields";
import AddressAutocomplete, { type AddressOption } from "@/components/AddressAutocomplete";
import * as UI from "@/styles/ui";
import UploadDropzone, { type UploadStatus } from "@/components/publish/UploadDropzone";
import type { NoticeDefinition } from "@/next/publish/config/noticeTypes";
import {
  getMandatoryFieldsForOCR,
  type PlaceholderKey,
  type FieldBlueprint,
  getFormBlueprint,
  type FormBlueprint,
} from "@/next/publish/config/formBlueprints";
import { addDays, addMonths, toISODate } from "@/next/publish/utils/date";
import ActivitiesSelector, { type ActivityKey } from "@/components/publish/ActivitiesSelector";
import CouncilSelect, { type Council } from "@/components/CouncilSelect";
import CouncilDepartmentSelect, { type CouncilDepartment } from "@/components/CouncilDepartmentSelect";
import { getDepartmentTypeForCategory } from "@/next/publish/config/categoryToDepartment";
import councils from "@/data/councils.json";

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
  // Callbacks for Load Sample Data button
  onDetailChange?: (key: string, value: string) => void;
  onCouncilSelect?: (council: Council) => void;
  setLegalDetails?: (details: any) => void;
};

const GRID_SPAN_CLASSES: Record<number, string> = {
  12: "md:col-span-12",
  8: "md:col-span-8",
  6: "md:col-span-6",
  4: "md:col-span-4",
};

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10) - 1;
  const day = Number.parseInt(match[3]!, 10);
  const date = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function computeDeadline(rule: FormBlueprint["deadlineRule"], baseValue: string): string | null {
  if (!rule) return null;
  const baseDate = parseIsoDate(baseValue);
  if (!baseDate) return null;
  if ("offsetDays" in rule) {
    const adjusted = addDays(baseDate, rule.offsetDays);
    return toISODate(adjusted);
  }
  if ("addMonths" in rule) {
    const adjusted = addMonths(baseDate, rule.addMonths);
    return toISODate(adjusted);
  }
  return null;
}

function buildPremisesSampleOcrText(deadlineDate: Date): string {
  const deadlineDisplay = deadlineDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `LICENSING ACT 2003

Notice is hereby given that Wilson & Partners LLP of 15 Bedford Square, Bloomsbury, London, WC1B 3JA has applied to Westminster City Council for a new premises licence for The Blue Lion at 42 High Street, Westminster, London, SW1A 1AA.

The application seeks authorisation for the sale of alcohol on and off the premises, late night refreshment, and live and recorded music with opening hours Monday to Thursday 11:00–23:30, Friday to Saturday 11:00–00:30, and Sunday 12:00–23:00.

Any person may make representations in writing to the Licensing Team, Westminster City Council, 64 Victoria Street, London SW1E 6QP or by email to licensing@westminster.gov.uk no later than ${deadlineDisplay}. Representations must relate to the licensing objectives.

Signed,
Wilson & Partners LLP`;
}

export default function UploadOcrPane({
  definition,
  uploadComponentProps,
  showRequiredDetails,
  templateDraft,
  onChange,
  errors,
  onSwitchToTemplate,
  onDetailChange,
  onCouncilSelect,
  setLegalDetails,
}: UploadOcrPaneProps) {
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus>("idle");
  const [hasScrolledToForm, setHasScrolledToForm] = React.useState(false);
  const [autoLoadedSampleData, setAutoLoadedSampleData] = React.useState(false);
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

  const setOcrText = React.useCallback(
    (text: string) => {
      onChange(["ocrText"], text);
    },
    [onChange]
  );

  const hasExtractedOcrText = React.useMemo(() => {
    const raw = templateDraft?.ocrText;
    if (typeof raw === "string") return raw.trim().length > 0;
    return false;
  }, [templateDraft]);

  // Auto-scroll to form when it appears
  React.useEffect(() => {
    if (showRequiredDetails && uploadStatus === "ready" && !hasScrolledToForm) {
      setHasScrolledToForm(true);
      setTimeout(() => {
        const section = document.getElementById("required-details-section");
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300); // Small delay to let animation start
    }
  }, [showRequiredDetails, uploadStatus, hasScrolledToForm]);

  // DISABLED: Auto-load sample data was interfering with real uploads
  // Users should click "Load Sample Data" button to load demo data
  // React.useEffect(() => { ... }, []);

  // Get full blueprint for deadline calculation
  const fullBlueprint = React.useMemo(
    () => (definition ? getFormBlueprint(definition) : null),
    [definition]
  );

  const deadlineManualRef = React.useRef(false);
  const lastAutoDeadlineRef = React.useRef<string | null>(null);

  // Auto-compute deadline when APPLICATION_DATE or PUBLICATION_DATE changes
  React.useEffect(() => {
    if (!fullBlueprint?.deadlineRule) return;

    const rule = fullBlueprint.deadlineRule;
    const baseToken = rule.base;
    const baseValue = getValue(baseToken);

    if (!baseValue) {
      if (!deadlineManualRef.current && getValue("DEADLINE_DATE")) {
        setValue("DEADLINE_DATE", "");
      }
      return;
    }

    const computed = computeDeadline(rule, baseValue);
    if (!computed) return;

    const current = getValue("DEADLINE_DATE");

    // Only auto-set if user hasn't manually changed it, or if it matches the last auto value
    if (!deadlineManualRef.current || current === lastAutoDeadlineRef.current) {
      if (current !== computed) {
        lastAutoDeadlineRef.current = computed;
        setValue("DEADLINE_DATE", computed);
      }
    }
  }, [fullBlueprint, getValue, setValue, templateDraft]);

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

      {/* Keep upload dropzone mounted but hide after upload starts */}
      <div className={uploadStatus !== "idle" ? "hidden" : ""}>
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
      </div>

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

      {/* Load Sample Data Button - Always visible for demo purposes */}
      {showRequiredDetails && (
        <div className="rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-[14px] font-bold text-blue-900">
                  Demo Mode
                </p>
              </div>
              <p className="text-[13px] text-blue-700 leading-relaxed">
                Click to instantly fill the form fields with sample data. Your uploaded document text will be preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                // Preserve the existing OCR text if it exists
                const existingOcrText = (templateDraft?.ocrText as string) || "";
                console.log('[Load Sample Data] Existing OCR text length:', existingOcrText.length);

                // Load comprehensive sample data for demo using CORRECT field tokens from Zod schema
                if (definition?.id === "premises-licence" || definition?.id === "licensing-premises-new") {
                  // PART 1: Populate templateDraft (form blueprint fields) using setValue
                  // CRITICAL: Set variant first (required by schema)
                  setValue("variant", "licensing-premises-new");

                  // Auto-values (required by schema)
                  setValue("NOTICE_TYPE", "Premises Licence — New");
                  setValue("ACT_TITLE", "Licensing Act 2003");
                  setValue("REPRESENTATION_METHOD", "in writing");

                  // Applicant details
                  setValue("APPLICANT_NAME", "Wilson & Partners LLP");
                  setValue("APPLICANT_STATUS", "llp");
                  setValue("APPLICANT_TRADING_AS", "The Blue Lion Pub");
                  setValue("APPLICANT_ADDRESS", "15 Bedford Square, Bloomsbury, London, WC1B 3JA");
                  setValue("APPLICANT_COMPANY_NUMBER", "OC123456");

                  // Premises details
                  setValue("PREMISES_NAME", "The Blue Lion");
                  setValue("PREMISES_ADDRESS", "42 High Street, Westminster, London, SW1A 1AA");

                  // Licensable activities & hours (REQUIRED)
                  setValue("LICENSABLE_ACTIVITIES", "Sale of alcohol (on and off premises), Late night refreshment, Live music, Recorded music");
                  setValue("ACTIVITY_SCHEDULE", "Sale of alcohol (on/off): Mon–Sun 11:00–23:00\nLate night refreshment: Fri–Sat 23:00–00:30\nLive music: Fri–Sat 20:00–23:00\nRecorded music: Mon–Sun 11:00–23:00");
                  setValue("OPENING_HOURS", "Monday to Thursday: 11:00 - 23:30\nFriday to Saturday: 11:00 - 00:30\nSunday: 12:00 - 23:00");
                  setValue("DPS_NAME", "Sarah Mitchell");
                  setValue("DPS_LICENSING_AUTHORITY", "Westminster City Council");

                  // Dates (using correct token: DEADLINE_DATE not REPRESENTATION_DEADLINE)
                  const today = new Date();
                  setValue("APPLICATION_DATE", toISODate(today));
                  setValue("PUBLICATION_DATE", toISODate(addDays(today, 1)));
                  const deadlineDate = addDays(today, 28);
                  setValue("DEADLINE_DATE", toISODate(deadlineDate));

                  // CRITICAL: INSPECTION_TIMES is REQUIRED by schema (line 100)
                  setValue("INSPECTION_TIMES", "The premises licence register entry and plan may be inspected at Westminster City Council, 64 Victoria Street, London SW1E 6QP, Monday to Friday, 9:00 AM to 5:00 PM.");

                  // Authority & contact - set these AFTER selecting council to avoid conflicts
                  setValue("AUTHORITY_ADDRESS", "Licensing Team, 64 Victoria Street, London, SW1E 6QP");
                  setValue("AUTHORITY_PHONE", "020 7641 2500");
                  setValue("ONLINE_REGISTER_URL", "https://www.westminster.gov.uk/licences-and-permits/licensing");

                  // Note: AUTHORITY_NAME and AUTHORITY_EMAIL will be set by onCouncilSelect below

                  // CRITICAL: Schema requires EITHER REPRESENTATION_EMAIL OR REPRESENTATION_ADDRESS (line 119-125)
                  setValue("REPRESENTATION_EMAIL", "licensing@westminster.gov.uk");
                  setValue("REPRESENTATION_ADDRESS", "Westminster City Council, Licensing Team, 64 Victoria Street, London, SW1E 6QP");

                  // PART 2: Populate legalDetails (validation fields) using onDetailChange
                  if (onDetailChange) {
                    onDetailChange("applicationType", "premises-licence-new");
                    onDetailChange("applicantName", "Wilson & Partners LLP");
                    onDetailChange("premisesLine1", "42 High Street");
                    onDetailChange("premisesCity", "Westminster");
                    onDetailChange("premisesPostcode", "SW1A 1AA");
                    onDetailChange("contactEmail", "licensing@wilsonpartners.co.uk");
                    onDetailChange("contactPhone", "020 7946 0123");
                    onDetailChange("tradingName", "The Blue Lion Pub");
                    onDetailChange("premisesName", "The Blue Lion");
                    onDetailChange("representationDeadline", toISODate(deadlineDate));

                    // CRITICAL: Set council details
                    onDetailChange("councilName", "Westminster City Council");
                    onDetailChange("councilEmail", "licensing@westminster.gov.uk");
                    onDetailChange("councilAddress", "Licensing Team, 64 Victoria Street, London, SW1E 6QP");

                    // CRITICAL: Set recommended fields to avoid warnings
                    onDetailChange("applicationSummary", "Application for a new premises licence to provide sale of alcohol, late night refreshment, and live and recorded music at The Blue Lion public house.");
                    onDetailChange("viewingInformation", "The premises licence register entry and plan may be inspected at Westminster City Council, 64 Victoria Street, London SW1E 6QP, Monday to Friday, 9:00 AM to 5:00 PM.");
                    onDetailChange("representationContact", "Westminster City Council Licensing Team, 64 Victoria Street, London, SW1E 6QP. Email: licensing@westminster.gov.uk");
                  }

                  // PART 3: Select Westminster council using onCouncilSelect (for council object reference)
                  if (onCouncilSelect) {
                    const councilsList = councils as Council[];
                    console.log('[Load Sample Data] Looking for Westminster in councils:', councilsList.length, 'councils');

                    // Try multiple ways to find Westminster
                    let westminster = councilsList.find(c => c.name === "Westminster City Council");
                    if (!westminster) {
                      westminster = councilsList.find(c => c.name.toLowerCase().includes("westminster"));
                    }
                    if (!westminster) {
                      westminster = councilsList.find(c => c.slug === "westminster");
                    }

                    console.log('[Load Sample Data] Found Westminster council:', westminster);

                    if (westminster) {
                      console.log('[Load Sample Data] Calling onCouncilSelect with:', westminster);
                      onCouncilSelect(westminster);

                      // Also set the form fields directly to populate AUTHORITY_NAME without requiring dropdown confirmation
                      setValue("AUTHORITY_NAME", westminster.name);
                      setValue("AUTHORITY_EMAIL", westminster.email || "licensing@westminster.gov.uk");
                      console.log('[Load Sample Data] Set AUTHORITY fields directly to avoid dropdown confirmation');
                    } else {
                      console.error('[Load Sample Data] Westminster council not found in councils list!');
                      // Fallback: set fields directly if council not found
                      setValue("AUTHORITY_NAME", "Westminster City Council");
                      setValue("AUTHORITY_EMAIL", "licensing@westminster.gov.uk");
                    }
                  } else {
                    console.warn('[Load Sample Data] onCouncilSelect callback not available');
                    // Fallback: set fields directly
                    setValue("AUTHORITY_NAME", "Westminster City Council");
                    setValue("AUTHORITY_EMAIL", "licensing@westminster.gov.uk");
                  }

                  // PART 4: Set activities array in legalDetails
                  if (setLegalDetails) {
                    setLegalDetails((prev: any) => ({
                      ...prev,
                      activities: ["alcohol-on", "alcohol-off", "late-night-refreshment", "regulated-entertainment"],
                    }));
                  }

                  // IMPORTANT: Only set sample OCR text if there's no existing text from upload
                  if (!existingOcrText || existingOcrText.trim().length === 0) {
                    const sampleOcrText = buildPremisesSampleOcrText(deadlineDate);
                    setOcrText(sampleOcrText);
                    console.log('[Load Sample Data] Set sample OCR text (no existing text)');
                  } else {
                    console.log('[Load Sample Data] Preserved existing OCR text from upload');
                  }
                } else {
                  // Generic sample data for other notice types
                  setValue("APPLICANT_NAME", "Sample Applicant Ltd");
                  setValue("PREMISES_NAME", "Sample Premises");
                  setValue("PREMISES_ADDRESS", "123 Sample Street, London, SW1A 1AA");
                  setValue("AUTHORITY_EMAIL", "contact@example.com");

                  const today = new Date();
                  setValue("APPLICATION_DATE", toISODate(today));

                  // IMPORTANT: Only set sample OCR text if there's no existing text from upload
                  if (!existingOcrText || existingOcrText.trim().length === 0) {
                    setOcrText(
                      `Sample notice text for ${definition?.label ?? "this notice type"}.\nApplication date: ${toISODate(
                        today
                      )}\nPlease complete the remaining fields to generate a full preview.`
                    );
                    console.log('[Load Sample Data] Set sample OCR text (no existing text)');
                  } else {
                    console.log('[Load Sample Data] Preserved existing OCR text from upload');
                  }
                }
              }}
              className="ml-4 shrink-0 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fill Form with Demo Data
            </button>
          </div>
        </div>
      )}

      {(uploadStatus === "uploading" || uploadStatus === "ocr") && (
        <div className="rounded-xl border border-blue-200/70 bg-blue-50/50 px-4 py-3 animate-pulse">
          <p className="text-[13px] font-medium text-blue-900">
            {uploadStatus === "uploading" ? "⏳ Uploading document..." : "🔍 Extracting text from document..."}
          </p>
          <p className="mt-1 text-[12px] text-blue-700">
            This usually takes just a few seconds. We'll show you the required fields once complete.
          </p>
        </div>
      )}

      {uploadStatus === "ready" && !showRequiredDetails && (
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 px-4 py-3">
          <p className="text-[13px] font-medium text-amber-900">
            ✓ Document processed
          </p>
          <p className="mt-1 text-[12px] text-amber-700">
            Please scroll down to complete the required fields. All information must be entered manually for compliance.
          </p>
        </div>
      )}

      {blueprint && (
        <section
          id="required-details-section"
          className="space-y-8 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all duration-300 md:p-8 motion-safe:animate-fade-in-up"
        >
          <header className="space-y-5">
            {uploadStatus === "ready" && (
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 mb-4">
                <p className="text-[13px] font-medium text-emerald-900">
                  ✓ Text extraction complete
                </p>
                <p className="mt-1 text-[12px] text-emerald-700">
                  Please review and complete all required fields below. The extracted text is available for reference.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h3 className="text-[16px] font-semibold leading-tight tracking-tight text-slate-900">
                  Complete the required details
                </h3>
                <p className="text-[13px] leading-relaxed text-slate-600">
                  {uploadStatus === "ready"
                    ? "All fields must be manually entered to ensure accuracy. We've kept your uploaded document for reference."
                    : "Enter the application details manually. You can also upload a document to extract text for reference."}
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
                      onChange={(value) => {
                        // Mark deadline as manually edited
                        if (field.token === "DEADLINE_DATE") {
                          deadlineManualRef.current = true;
                        }
                        setValue(field.token, value);
                      }}
                      setValue={setValue}
                      errors={errors[field.token]}
                      definition={definition}
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
  setValue?: (token: PlaceholderKey, value: string) => void;
  errors?: string[];
  definition?: NoticeDefinition | null;
};

function FieldInput({ field, value, onChange, setValue, errors, definition }: FieldInputProps) {
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

  // Handle AUTHORITY_NAME field with CouncilSelect
  if (field.token === "AUTHORITY_NAME") {
    // Get department type from notice definition category
    const departmentType = definition?.category ? getDepartmentTypeForCategory(definition.category) : undefined;

    const handleCouncilDepartmentSelect = React.useCallback((department: CouncilDepartment) => {
      onChange(department.organizationName);
      // Auto-populate related fields
      if (setValue) {
        if (department.email) {
          setValue("AUTHORITY_EMAIL", department.email);
        }
      }
      // Store department ID for template lookup (not a PlaceholderKey, so use onChange directly)
      // This is used by the template service to match the correct council template
      if (setValue) {
        // @ts-ignore - DEPARTMENT_ID is not a PlaceholderKey but needed for template matching
        setValue("DEPARTMENT_ID", department.id);
      }
    }, [onChange, setValue]);

    return (
      <div className="space-y-2">
        {commonLabel}
        <CouncilDepartmentSelect
          value={value}
          departmentType={departmentType}
          onSelect={handleCouncilDepartmentSelect}
          onChangeText={onChange}
          id={inputId}
          name="authorityname"
          label=""
          placeholder={departmentType ? `Search ${departmentType} departments...` : "Search councils..."}
          required={field.required}
          error={errors?.[0]}
        />
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
  const errorInputClasses = "w-full rounded-lg border bg-white px-3.5 py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-4 border-rose-300 hover:border-rose-400 focus:border-rose-500 focus:ring-rose-500/10";

  let control: React.ReactNode = null;

  switch (field.type) {
    case "text":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().replace(/_/g, '')}
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
    case "textarea":
      // Render AddressFields for address-related fields
      if (isAddressField) {
        // Parse existing value into address components
        const parseAddress = (addressString: string) => {
          if (!addressString) {
            return {
              addressLine1: '',
              addressLine2: '',
              city: '',
              postcode: '',
            };
          }

          const parts = addressString.split(',').map(p => p.trim()).filter(Boolean);
          const postcodeRegex = /([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})$/i;
          const postcodeMatch = addressString.match(postcodeRegex);
          const postcode = postcodeMatch ? postcodeMatch[1] : '';

          // Remove postcode from parts if found
          const addressParts = postcode
            ? addressString.replace(postcodeRegex, '').split(',').map(p => p.trim()).filter(Boolean)
            : parts;

          // Logic: first part is line1, last part is city, middle parts are line2
          const line1 = addressParts[0] || '';
          const city = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';
          const line2 = addressParts.length > 2 ? addressParts.slice(1, -1).join(', ') : (addressParts[1] || '');

          return {
            addressLine1: line1,
            addressLine2: line2,
            city: city,
            postcode: postcode,
          };
        };

        const addressValue = parseAddress(value);

        const handleAddressSelect = React.useCallback(
          (option: AddressOption) => {
            // Map AddressOption to the format expected by onChange (comma-separated string)
            const parts = [
              option.line1,
              option.line2,
              option.line3,
              option.postcode,
            ].filter(Boolean);
            const joined = parts.join(', ');
            onChange(joined);
          },
          [onChange]
        );

        control = (
          <div className="space-y-4">
            <AddressAutocomplete
              label={field.label}
              onSelect={handleAddressSelect}
              inputTestId={`${field.token.toLowerCase()}-lookup`}
            />
            <AddressFields
              label=""
              namePrefix={field.token.toLowerCase()}
              testIdPrefix={field.token.toLowerCase()}
              required={field.required}
              value={addressValue}
              onChange={(address) => {
                // Convert back to comma-separated string for storage
                const parts = [
                  address.addressLine1,
                  address.addressLine2,
                  address.city,
                  address.postcode,
                ].filter(Boolean);
                onChange(parts.join(', '));
              }}
            />
          </div>
        );
      } else {
        control = (
          <textarea
            id={inputId}
            name={field.token.toLowerCase().replace(/_/g, '')}
            value={value}
            rows={field.rows ?? 4}
            className={`${errors?.length ? errorInputClasses : baseInputClasses} min-h-[100px] resize-y`}
            aria-required={field.required ? "true" : undefined}
            aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
            onChange={handleChange}
            maxLength={field.maxLength}
          />
        );
      }
      break;
    case "email":
    case "date":
    case "tel":
    case "url":
    case "number":
      control = (
        <input
          id={inputId}
          name={field.token.toLowerCase().includes('_date') ? field.token.toLowerCase() : field.token.toLowerCase().replace(/_/g, '')}
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
          name={field.token.toLowerCase().replace(/_/g, '')}
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
          name={field.token.toLowerCase().replace(/_/g, '')}
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
      {/* Don't show label for address fields as AddressAutocomplete has its own label */}
      {!isAddressField && commonLabel}

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
