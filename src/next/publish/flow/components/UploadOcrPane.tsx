import React from "react";
import type { Council } from "@/components/CouncilSelect";
import CouncilSelect from "@/components/CouncilSelect";
import * as UI from "@/styles/ui";
import {
  APPLICATION_TYPE_OPTIONS,
  REQUIRED_FIELD_LABELS,
  type LegalDetails,
  type LegalMetaMap,
  type OCRHighlight,
  type RequiredFieldKey,
  type RequiredFieldStatus,
  type RecommendedFieldKey,
} from "@/next/publish/flow/lib/legalDetails";
import UploadDropzone, { type UploadStatus } from "@/components/publish/UploadDropzone";

type FocusRequest = {
  key: RequiredFieldKey | RecommendedFieldKey | null;
  nonce: number;
};

const OPTIONAL_KEYS = new Set<RequiredFieldKey | RecommendedFieldKey>([
  "tradingName",
  "premisesLine2",
  "premisesName",
  "applicationSummary",
  "representationDeadline",
  "viewingInformation",
  "representationContact",
  "contactEmail",
  "contactPhone",
]);

const STATUS_COPY: Record<RequiredFieldStatus["status"], { tone: string; dot: string; prefix: string }> = {
  found: { tone: "border-emerald-200/80 bg-emerald-50/70 text-emerald-700", dot: "bg-emerald-400", prefix: "detected" },
  review: { tone: "border-amber-200/80 bg-amber-50/75 text-amber-700", dot: "bg-amber-400", prefix: "needs review" },
  missing: { tone: "border-rose-200/80 bg-rose-50/80 text-rose-700", dot: "bg-rose-400", prefix: "required" },
};

export type UploadOcrPaneProps = {
  uploadComponentProps: {
    onText: (text: string) => void;
    onMeta?: (meta: { engine?: string; [k: string]: unknown }) => void;
    onStatusChange: (status: UploadStatus) => void;
  };
  showRequiredDetails: boolean;
  details: LegalDetails;
  meta: LegalMetaMap;
  statuses: RequiredFieldStatus[];
  errors: Partial<Record<RequiredFieldKey, string | null>>;
  recommendedWarnings: string[];
  selectedCouncil: Council | null;
  onChange: (key: keyof LegalDetails, value: string) => void;
  onCouncilSelect: (council: Council) => void;
  onCouncilInput: (value: string) => void;
  onSwitchToTemplate: () => void;
  onFieldFocus: (key: RequiredFieldKey | RecommendedFieldKey) => void;
  onHighlightRequest: (key: RequiredFieldKey | RecommendedFieldKey) => void;
  focusRequest: FocusRequest | null;
  ocrHighlights: OCRHighlight[];
  missingCount: number;
};

export default function UploadOcrPane({
  uploadComponentProps,
  showRequiredDetails,
  details,
  meta,
  statuses,
  errors,
  recommendedWarnings,
  selectedCouncil,
  onChange,
  onCouncilSelect,
  onCouncilInput,
  onSwitchToTemplate,
  onFieldFocus,
  onHighlightRequest,
  focusRequest,
  ocrHighlights,
  missingCount,
}: UploadOcrPaneProps) {
  const [showOptional, setShowOptional] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<UploadStatus>('idle');

  React.useEffect(() => {
    if (!focusRequest?.key) return;
    if (OPTIONAL_KEYS.has(focusRequest.key) && !showOptional) {
      setShowOptional(true);
    }
  }, [focusRequest, showOptional]);

  const applicationTypeRef = React.useRef<HTMLSelectElement | null>(null);
  const applicantRef = React.useRef<HTMLInputElement | null>(null);
  const tradingRef = React.useRef<HTMLInputElement | null>(null);
  const line1Ref = React.useRef<HTMLInputElement | null>(null);
  const line2Ref = React.useRef<HTMLInputElement | null>(null);
  const cityRef = React.useRef<HTMLInputElement | null>(null);
  const postcodeRef = React.useRef<HTMLInputElement | null>(null);
  const premisesNameRef = React.useRef<HTMLInputElement | null>(null);
  const councilRef = React.useRef<HTMLInputElement | null>(null);
  const summaryRef = React.useRef<HTMLTextAreaElement | null>(null);
  const deadlineRef = React.useRef<HTMLInputElement | null>(null);
  const viewingRef = React.useRef<HTMLInputElement | null>(null);
  const repsContactRef = React.useRef<HTMLInputElement | null>(null);
  const contactEmailRef = React.useRef<HTMLInputElement | null>(null);
  const contactPhoneRef = React.useRef<HTMLInputElement | null>(null);

  const focusMap = React.useMemo(
    () => ({
      applicationType: applicationTypeRef as React.RefObject<HTMLElement>,
      applicantName: applicantRef as React.RefObject<HTMLElement>,
      tradingName: tradingRef as React.RefObject<HTMLElement>,
      premisesLine1: line1Ref as React.RefObject<HTMLElement>,
      premisesLine2: line2Ref as React.RefObject<HTMLElement>,
      premisesCity: cityRef as React.RefObject<HTMLElement>,
      premisesPostcode: postcodeRef as React.RefObject<HTMLElement>,
      premisesName: premisesNameRef as React.RefObject<HTMLElement>,
      council: councilRef as React.RefObject<HTMLElement>,
      applicationSummary: summaryRef as React.RefObject<HTMLElement>,
      representationDeadline: deadlineRef as React.RefObject<HTMLElement>,
      viewingInformation: viewingRef as React.RefObject<HTMLElement>,
      representationContact: repsContactRef as React.RefObject<HTMLElement>,
      contactEmail: contactEmailRef as React.RefObject<HTMLElement>,
      contactPhone: contactPhoneRef as React.RefObject<HTMLElement>,
    }),
    []
  );

  React.useEffect(() => {
    if (!focusRequest?.key) return;
    const ref = focusMap[focusRequest.key];
    if (!ref?.current) return;
    const element = ref.current as HTMLElement;
    element.focus({ preventScroll: false });
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'ring-offset-white');
    const timeout = window.setTimeout(() => {
      element.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2', 'ring-offset-white');
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [focusRequest, focusMap]);

  const highlightAvailable = React.useCallback(
    (key: RequiredFieldKey | RecommendedFieldKey) =>
      ocrHighlights.some((highlight) => highlight.key === key),
    [ocrHighlights]
  );

  const highlightLink = (key: RequiredFieldKey | RecommendedFieldKey) => {
    if (!highlightAvailable(key)) return null;
    return (
      <button
        type="button"
        className="text-xs font-medium text-blue-600 underline-offset-4 hover:underline"
        onClick={() => onHighlightRequest(key)}
      >
        Show in text
      </button>
    );
  };

  const renderConfidence = (key: RequiredFieldKey | RecommendedFieldKey) => {
    const entry = meta[key];
    if (entry?.confidence == null) return null;
    const rounded = Math.round(entry.confidence * 100);
    const highConfidence = entry.confidence >= 0.8;
    const tone = highConfidence
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';
    const label = highConfidence ? 'Detected' : 'Low confidence';
    return (
      <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
        {label}
        <span>{rounded}% OCR</span>
      </span>
    );
  };

  const renderError = (key: RequiredFieldKey) => {
    const message = errors[key];
    if (!message) return null;
    return (
      <p id={`${key}-error`} className="text-xs text-rose-600">
        {message}
      </p>
    );
  };

  const fieldDescriptionId = (key: string, hasError: boolean) => {
    const ids = [`${key}-help`];
    if (hasError) ids.push(`${key}-error`);
    return ids.join(' ');
  };

  const handleChange = (key: keyof LegalDetails, value: string) => {
    onChange(key, value);
  };

  const statusChips = statuses.map((status) => {
    const copy = STATUS_COPY[status.status];
    const message = `${status.label} ${copy.prefix}`;
    return (
      <span
        key={status.key}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 motion-safe:animate-tick-pop ${copy.tone}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${copy.dot}`} aria-hidden />
        <span>{message}</span>
      </span>
    );
  });

  return (
    <div className="space-y-8">
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
      {uploadStatus === 'idle' && !showRequiredDetails && (
        <p className="text-sm leading-6 text-slate-500 transition-opacity duration-300">
          Don’t have a file?{' '}
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

      {showRequiredDetails && (
        <section
          className={`${UI.card} space-y-8 border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition-all duration-300 md:p-9 motion-safe:animate-fade-in-up`}
        >
          <header className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold leading-7 text-slate-900">A few details must appear on your notice.</h3>
                <p className="text-sm leading-6 text-slate-600">We surface what’s missing, highlight OCR matches, and keep the preview synced.</p>
              </div>
              <button type="button" className={`${UI.btnSecondary} shrink-0`} onClick={onSwitchToTemplate}>
                Use template instead
              </button>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Legal details • {missingCount ? `${missingCount} missing` : uploadStatus === 'ready' ? 'All detected' : 'In progress'}
              </span>
              <div className="flex flex-wrap gap-2 text-xs text-slate-700">{statusChips}</div>
            </div>
            {recommendedWarnings.length > 0 && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm">
                <p className="font-semibold">Recommended details</p>
                <ul className="mt-1.5 list-disc space-y-1.5 pl-4">
                  {recommendedWarnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </header>

          <div className="space-y-10">
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-slate-900">Applicant</h4>
                {highlightLink('applicantName')}
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <label htmlFor="applicant-name" className="text-sm font-medium text-slate-800">
                    Applicant legal name<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('applicantName')}
                  </label>
                  <input
                    id="applicant-name"
                    ref={applicantRef}
                    type="text"
                    value={details.applicantName}
                    onChange={(event) => handleChange('applicantName', event.target.value)}
                    onFocus={() => onFieldFocus('applicantName')}
                    className={`${UI.input}`}
                    aria-invalid={errors.applicantName ? 'true' : undefined}
                    aria-describedby={fieldDescriptionId('applicant-name', Boolean(errors.applicantName))}
                    placeholder="Full legal name"
                  />
                  <p id="applicant-name-help" className="text-xs leading-5 text-slate-500">
                    The person or organisation responsible for the notice.
                  </p>
                  {renderError('applicantName')}
                </div>

                {showOptional && (
                  <div className="space-y-3">
                    <label htmlFor="trading-name" className="text-sm font-medium text-slate-800">
                      Trading name (optional)
                    </label>
                    <input
                      id="trading-name"
                      ref={tradingRef}
                      type="text"
                      value={details.tradingName}
                      onChange={(event) => handleChange('tradingName', event.target.value)}
                      onFocus={() => onFieldFocus('tradingName')}
                      className={`${UI.input}`}
                      placeholder="e.g. The Midnight Fox"
                    />
                    <p id="trading-name-help" className="text-xs leading-5 text-slate-500">
                      We show this alongside the legal name if provided.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-slate-900">Location</h4>
                {highlightLink('premisesLine1')}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <label htmlFor="premises-line1" className="text-sm font-medium text-slate-800">
                    Address line 1<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('premisesLine1')}
                  </label>
                  <input
                    id="premises-line1"
                    ref={line1Ref}
                    type="text"
                    value={details.premisesLine1}
                    onChange={(event) => handleChange('premisesLine1', event.target.value)}
                    onFocus={() => onFieldFocus('premisesLine1')}
                    className={`${UI.input}`}
                    aria-invalid={errors.premisesLine1 ? 'true' : undefined}
                    aria-describedby={fieldDescriptionId('premises-line1', Boolean(errors.premisesLine1))}
                    placeholder="Building name and number"
                  />
                  <p id="premises-line1-help" className="text-xs leading-5 text-slate-500">
                    Main address for the premises.
                  </p>
                  {renderError('premisesLine1')}
                </div>

                {showOptional && (
                  <div className="space-y-3">
                    <label htmlFor="premises-line2" className="text-sm font-medium text-slate-800">
                      Address line 2 (optional)
                    </label>
                    <input
                      id="premises-line2"
                      ref={line2Ref}
                      type="text"
                      value={details.premisesLine2}
                      onChange={(event) => handleChange('premisesLine2', event.target.value)}
                      onFocus={() => onFieldFocus('premisesLine2')}
                      className={`${UI.input}`}
                      placeholder="Estate, village, etc."
                    />
                    <p id="premises-line2-help" className="text-xs leading-5 text-slate-500">
                      Appears if provided.
                    </p>
                  </div>
                )}

                {showOptional && (
                  <div className="space-y-3">
                    <label htmlFor="premises-name" className="text-sm font-medium text-slate-800">
                      Premises name (optional)
                    </label>
                    <input
                      id="premises-name"
                      ref={premisesNameRef}
                      type="text"
                      value={details.premisesName}
                      onChange={(event) => handleChange('premisesName', event.target.value)}
                      onFocus={() => onFieldFocus('premisesName')}
                      className={`${UI.input}`}
                      placeholder="e.g. The Old Brewery"
                    />
                    <p id="premises-name-help" className="text-xs leading-5 text-slate-500">
                      Shown above the address if supplied.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label htmlFor="premises-city" className="text-sm font-medium text-slate-800">
                    Town or city<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('premisesCity')}
                  </label>
                  <input
                    id="premises-city"
                    ref={cityRef}
                    type="text"
                    value={details.premisesCity}
                    onChange={(event) => handleChange('premisesCity', event.target.value)}
                    onFocus={() => onFieldFocus('premisesCity')}
                    className={`${UI.input}`}
                    aria-invalid={errors.premisesCity ? 'true' : undefined}
                    aria-describedby={fieldDescriptionId('premises-city', Boolean(errors.premisesCity))}
                    placeholder="Town or district"
                  />
                  <p id="premises-city-help" className="text-xs leading-5 text-slate-500">
                    Include the local area for clarity.
                  </p>
                  {renderError('premisesCity')}
                </div>

                <div className="space-y-3">
                  <label htmlFor="premises-postcode" className="text-sm font-medium text-slate-800">
                    Postcode<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('premisesPostcode')}
                  </label>
                  <input
                    id="premises-postcode"
                    ref={postcodeRef}
                    type="text"
                    value={details.premisesPostcode}
                    onChange={(event) => handleChange('premisesPostcode', event.target.value.toUpperCase())}
                    onFocus={() => onFieldFocus('premisesPostcode')}
                    className={`${UI.input}`}
                    aria-invalid={errors.premisesPostcode ? 'true' : undefined}
                    aria-describedby={fieldDescriptionId('premises-postcode', Boolean(errors.premisesPostcode))}
                    placeholder="AA1 1AA"
                  />
                  <p id="premises-postcode-help" className="text-xs leading-5 text-slate-500">
                    We show this near the title for accuracy.
                  </p>
                  {renderError('premisesPostcode')}
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-slate-900">Authority & application</h4>
                <div className="flex gap-2">
                  {highlightLink('applicationType')}
                  {highlightLink('council')}
                </div>
              </div>
              <div className="space-y-5">
                <div className="space-y-3">
                  <label htmlFor="application-type" className="text-sm font-medium text-slate-800">
                    Application type<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('applicationType')}
                  </label>
                  <select
                    id="application-type"
                    ref={applicationTypeRef}
                    value={details.applicationType}
                    onChange={(event) => handleChange('applicationType', event.target.value)}
                    onFocus={() => onFieldFocus('applicationType')}
                    className={`${UI.input}`}
                    aria-invalid={errors.applicationType ? 'true' : undefined}
                    aria-describedby={fieldDescriptionId('application-type', Boolean(errors.applicationType))}
                  >
                    <option value="">Select application type</option>
                    {APPLICATION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p id="application-type-help" className="text-xs leading-5 text-slate-500">
                    Controls the template wording and pricing.
                  </p>
                  {renderError('applicationType')}
                </div>

                <div className="space-y-3">
                  <label htmlFor="licensing-authority" className="text-sm font-medium text-slate-800">
                    Licensing authority<span className="ml-1 text-rose-600">*</span>
                    {renderConfidence('council')}
                  </label>
                  <CouncilSelect
                    value={details.councilName}
                    onSelect={(council) => {
                      onCouncilSelect(council);
                      handleChange('councilName', council.name);
                    }}
                    onChangeText={(value) => {
                      onCouncilInput(value);
                      handleChange('councilName', value);
                    }}
                    inputRef={councilRef as React.RefObject<HTMLInputElement | null>}
                    label=""
                    placeholder="Start typing the authority name"
                    required
                    error={errors.council ?? undefined}
                  />
                  <div className="flex items-center justify-between text-xs leading-5 text-slate-500">
                    <span>{selectedCouncil?.email ? selectedCouncil.email : 'We show their contact details automatically.'}</span>
                    {highlightLink('council')}
                  </div>
                </div>

                {showOptional && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-3">
                      <label htmlFor="reps-deadline" className="text-sm font-medium text-slate-800">
                        Representation deadline (optional)
                      </label>
                      <input
                        id="reps-deadline"
                        ref={deadlineRef}
                        type="date"
                        value={details.representationDeadline}
                        onChange={(event) => handleChange('representationDeadline', event.target.value)}
                        onFocus={() => onFieldFocus('representationDeadline')}
                        className={`${UI.input}`}
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="viewing-info" className="text-sm font-medium text-slate-800">
                        Where to view the application (optional)
                      </label>
                      <input
                        id="viewing-info"
                        ref={viewingRef}
                        type="text"
                        value={details.viewingInformation}
                        onChange={(event) => handleChange('viewingInformation', event.target.value)}
                        onFocus={() => onFieldFocus('viewingInformation')}
                        className={`${UI.input}`}
                        placeholder="URL or address"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="reps-contact" className="text-sm font-medium text-slate-800">
                        Where to send representations (optional)
                      </label>
                      <input
                        id="reps-contact"
                        ref={repsContactRef}
                        type="text"
                        value={details.representationContact}
                        onChange={(event) => handleChange('representationContact', event.target.value)}
                        onFocus={() => onFieldFocus('representationContact')}
                        className={`${UI.input}`}
                        placeholder="Email or postal address"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="contact-email" className="text-sm font-medium text-slate-800">
                        Contact email (optional)
                      </label>
                      <input
                        id="contact-email"
                        ref={contactEmailRef}
                        type="email"
                        value={details.contactEmail}
                        onChange={(event) => handleChange('contactEmail', event.target.value)}
                        onFocus={() => onFieldFocus('contactEmail')}
                        className={`${UI.input}`}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="contact-phone" className="text-sm font-medium text-slate-800">
                        Contact phone (optional)
                      </label>
                      <input
                        id="contact-phone"
                        ref={contactPhoneRef}
                        type="tel"
                        value={details.contactPhone}
                        onChange={(event) => handleChange('contactPhone', event.target.value)}
                        onFocus={() => onFieldFocus('contactPhone')}
                        className={`${UI.input}`}
                        placeholder="0X XXXX XXXX"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">Optional summary</h4>
                {highlightLink('applicationSummary')}
              </div>
              <textarea
                id="application-summary"
                ref={summaryRef}
                rows={showOptional ? 5 : 3}
                value={details.applicationSummary}
                onChange={(event) => handleChange('applicationSummary', event.target.value)}
                onFocus={() => onFieldFocus('applicationSummary')}
                className={`${UI.input} min-h-[120px]`}
                placeholder="Brief summary of the application."
              />
              <p id="application-summary-help" className="text-xs text-slate-500">
                Helps residents understand the change without reading the full notice.
              </p>
            </section>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
            onClick={() => setShowOptional((prev) => !prev)}
          >
            {showOptional ? 'Hide optional fields' : 'Show optional fields'}
          </button>
        </section>
      )}
    </div>
  );
}
