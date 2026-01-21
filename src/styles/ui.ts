// New shared UI tokens (Stripe-like cleanliness)
// Use CSS hero band class for reliability across browsers

// ============================================================================
// TYPOGRAPHY - Consistent font stack across the app
// ============================================================================
// Primary font: Inter (loaded from Google Fonts in index.html)
// Fallbacks: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
// Monospace: 'Menlo', 'Monaco', 'Courier New', monospace
// ============================================================================
export const fontSans = "font-sans"; // Uses tailwind.config.js: Inter, ui-sans-serif, system-ui
export const fontMono = "font-mono"; // For code, IDs, reference numbers
export const fontSerif = "font-serif"; // For formal notice text (Georgia, Times)

// Inline font-family for components that can't use Tailwind classes (e.g., inline styles)
export const fontFamilySans = "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const fontFamilyMono = "'Menlo', 'Monaco', 'Courier New', monospace";

export const canvas   = "bg-[var(--canvas)]";
export const pageWrap = `hero-band min-h-screen text-[#222d35] ${canvas}`;
export const pageWrapLg = `hero-band-lg min-h-screen text-[#222d35] bg-[var(--canvas)]`;

export const container = "max-w-[1200px] mx-auto px-6 md:px-8";
export const sectionY = "py-14 md:py-20 lg:py-24";
export const stickyUnderHeader = "sticky top-[var(--headerH)]";

// Hero typography for dark-on-light gradient: white with light shadow for contrast
export const heroH1 =
  "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.28)] tracking-tight font-semibold text-[42px] leading-[50px] md:text-[56px] md:leading-[64px] lg:leading-[1.08] md:tracking-[-0.01em] lg:tracking-[-0.015em] max-w-[900px]";
export const heroSub =
  "text-white/85 drop-shadow-[0_1px_1px_rgba(0,0,0,0.22)] text-[16px] md:text-[18px] lg:text-[20px] leading-[28px] max-w-[60ch]";

// ============================================================================
// HEADING SCALE - Standardized heading sizes across the app
// ============================================================================
// Scale based on: 14, 16, 18, 20, 24, 28, 36, 48 (1.125 minor third ratio)
// Use these exports for consistent heading sizes:
//   - pageTitle: Landing/marketing page main headings (48px → 56px on desktop)
//   - sectionTitle: Major section headings (28px → 36px on desktop)
//   - h1-h6: Standard document hierarchy
//   - cardTitle, modalTitle: Component-specific headings
// ============================================================================

// Page-level headings (marketing pages, landing pages)
export const pageTitle = "text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900";
export const pageTitleLight = "text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]";
export const pageSubtitle = "text-lg md:text-xl text-slate-600 max-w-2xl";
export const pageSubtitleLight = "text-lg md:text-xl text-white/85 max-w-2xl";

// Section headings (within pages)
export const sectionTitle = "text-2xl md:text-3xl font-bold tracking-tight text-slate-900";
export const sectionSubtitle = "text-base md:text-lg text-slate-600";

// Component headings
export const cardTitle = "text-lg font-semibold text-slate-900";
export const modalTitle = "text-xl font-semibold text-slate-900";
export const dialogTitle = "text-lg font-semibold text-slate-900";

// Dashboard/stat headings
export const statValue = "text-3xl md:text-4xl font-bold text-slate-900";
export const statLabel = "text-sm font-medium text-slate-500";

export const card = "bg-white border border-[rgba(25,38,80,0.06)] rounded-2xl shadow-[0_8px_24px_rgba(25,38,80,0.06)]";
export const cardHover =
  "transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform will-change-[box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(25,38,80,.10)] hover:ring-1 hover:ring-slate-200/60";
export const cardHeader = "text-sm font-semibold text-blue-900";
export const tinySubheader = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

// Wizard surfaces
export const wizardCard =
  "relative overflow-hidden rounded-[28px] border border-[rgba(37,99,235,0.18)] bg-white/95 shadow-[0_32px_96px_rgba(15,23,42,0.14)] backdrop-blur";
export const wizardSection =
  "rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_14px_40px_rgba(15,23,42,0.08)]";
export const wizardPill =
  "inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-900";

// Document hierarchy headings (forms, content pages)
// Use these for semantic HTML structure (h1-h6 elements)
export const h1 = "text-[36px] leading-[44px] font-semibold tracking-tight text-[#192650]";
export const h2 = "text-[28px] leading-[36px] font-semibold tracking-tight text-[#192650]";
export const h3 = "text-[20px] leading-[28px] font-medium text-[#192650]";
export const h4 = "text-[18px] leading-[26px] font-medium text-[#192650]";
export const h5 = "text-[16px] leading-[24px] font-semibold text-[#192650]";
export const h6 = "text-[14px] leading-[22px] font-semibold uppercase tracking-wide text-slate-500";

export const body = "text-[16px] leading-[26px]";
export const small = "text-[14px] leading-[22px]";

export const btnPrimary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-200 hover:bg-[#1E4FD8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const btnSecondary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-[#192650] font-medium border border-[rgba(25,38,80,0.10)] hover:border-[rgba(25,38,80,0.20)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";

// Stepper (Publish)
export const stepperTrack = "h-1 rounded-full bg-blue-600/20";
export const stepperFill = "h-1 rounded-full bg-[#2563EB]";
export const stepDot = "w-8 h-8 rounded-full grid place-items-center border border-slate-200 bg-white";
export const stepDotActive =
  "w-9 h-9 ring-2 ring-blue-600 ring-offset-2 ring-offset-white text-blue-700 border-transparent";
export const stepDotBase = stepDot;

// Keep legacy exports for compatibility in existing components
export const gradientBg = "min-h-screen bg-[linear-gradient(112deg,_#192650_0%,_#3866af_50%,_#ffffff_100%)]";
export const railCard = card + " p-4";
export const section = card + " p-5 md:p-6 space-y-4";
export const label = "text-sm font-medium text-slate-800";
export const input = "h-11 rounded-lg border border-[rgba(25,38,80,0.12)] bg-white px-3 text-[15px] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const pillBtn = btnPrimary;
export const ghostPill = btnSecondary;
export const prose = "prose max-w-none text-[14px] leading-6 prose-headings:mt-0";

// ============================================================================
// FORM INPUTS - Standardized input styles for consistent forms
// ============================================================================
// All inputs use blue-600 focus ring for consistency with primary color
// Height: 44px (11 Tailwind units) for touch-friendly targets
// Border radius: 12px (lg/xl) for modern look
// ============================================================================

// Base input style (without width - add w-full or specific width as needed)
export const inputBase =
  "h-11 px-3 rounded-xl border border-slate-300 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 hover:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

// Full-width input (most common usage)
export const inputFull = `w-full ${inputBase}`;

// Input with error state
export const inputError =
  "h-11 px-3 rounded-xl border border-rose-300 bg-rose-50/30 text-[15px] text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-600/30 focus:border-rose-600 hover:border-rose-400";

// Small input for compact layouts (e.g., filters, inline forms)
export const inputSmall =
  "h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 hover:border-slate-400";

// Textarea (multiline input)
export const textareaBase =
  "px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 hover:border-slate-400 resize-y disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed";

// Input with icon on left (use with pl-10 on the input, wrap in relative container)
export const inputWithIconLeft = `${inputBase} pl-10`;
export const inputIconLeft = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none";

// Input with icon on right (use with pr-10 on the input)
export const inputWithIconRight = `${inputBase} pr-10`;
export const inputIconRight = "absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none";

// Back-compat shims for previous wrappers
export const siteCanvas = canvas + " text-[#222d35] min-h-screen";
export const heroGradientLight = 'hero-band';

// ============================================================================
// SEMANTIC COLORS - Use these for consistent color usage across the app
// ============================================================================
// Success: emerald-600 (#059669)
// Error: rose-600 (#E11D48)
// Warning: amber-600 (#D97706)
// Info: blue-600 (#2563EB)
// ============================================================================

// Success states (emerald)
export const successBg = "bg-emerald-50";
export const successBgDark = "bg-emerald-600";
export const successText = "text-emerald-600";
export const successTextDark = "text-emerald-700";
export const successBorder = "border-emerald-200";
export const successBorderDark = "border-emerald-600";

// Error states (rose)
export const errorBg = "bg-rose-50";
export const errorBgDark = "bg-rose-600";
export const errorText = "text-rose-600";
export const errorTextDark = "text-rose-700";
export const errorBorder = "border-rose-200";
export const errorBorderDark = "border-rose-600";

// Warning states (amber)
export const warningBg = "bg-amber-50";
export const warningBgDark = "bg-amber-600";
export const warningText = "text-amber-600";
export const warningTextDark = "text-amber-700";
export const warningBorder = "border-amber-200";
export const warningBorderDark = "border-amber-600";

// Info states (blue - same as primary)
export const infoBg = "bg-blue-50";
export const infoBgDark = "bg-blue-600";
export const infoText = "text-blue-600";
export const infoTextDark = "text-blue-700";
export const infoBorder = "border-blue-200";
export const infoBorderDark = "border-blue-600";

// Alert/Banner components
export const alertSuccess = "rounded-lg p-4 bg-emerald-50 border border-emerald-200 text-emerald-700";
export const alertError = "rounded-lg p-4 bg-rose-50 border border-rose-200 text-rose-700";
export const alertWarning = "rounded-lg p-4 bg-amber-50 border border-amber-200 text-amber-700";
export const alertInfo = "rounded-lg p-4 bg-blue-50 border border-blue-200 text-blue-700";

// Badge components
export const badgeSuccess = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800";
export const badgeError = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800";
export const badgeWarning = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800";
export const badgeInfo = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800";
export const badgeNeutral = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800";

// Button variants for semantic colors
export const btnDanger =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-rose-600 text-white font-semibold shadow-[0_6px_16px_rgba(225,29,72,0.35)] transition-all duration-200 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:ring-offset-2 focus:ring-offset-white";
export const btnSuccess =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-[0_6px_16px_rgba(5,150,105,0.35)] transition-all duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 focus:ring-offset-white";
export const btnWarning =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold shadow-[0_6px_16px_rgba(217,119,6,0.35)] transition-all duration-200 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 focus:ring-offset-white";

// Inverted button styles (for use on dark/colored backgrounds)
export const btnPrimaryInverse =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-blue-700 font-semibold shadow-lg transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600";
export const btnSecondaryInverse =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl border-2 border-white/30 bg-white/10 text-white font-semibold backdrop-blur transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-blue-600";

// ============================================================================
// TEXT COLORS - Standardized text colors for consistent typography
// ============================================================================
// Primary text: slate-900 (#0f172a) - headings, important text
// Secondary text: slate-600 (#475569) - body text, descriptions
// Tertiary text: slate-500 (#64748b) - labels, captions, subtle text
// Muted text: slate-400 (#94a3b8) - placeholders, disabled text
// Inverse text: white (#ffffff) - text on dark backgrounds
// Link text: blue-600 (#2563EB) - interactive links
// ============================================================================

// Primary text (headings, important content)
export const textPrimary = "text-slate-900";
export const textPrimaryHex = "#0f172a";

// Secondary text (body text, descriptions)
export const textSecondary = "text-slate-600";
export const textSecondaryHex = "#475569";

// Tertiary text (labels, captions, subtle text)
export const textTertiary = "text-slate-500";
export const textTertiaryHex = "#64748b";

// Muted text (placeholders, disabled states)
export const textMuted = "text-slate-400";
export const textMutedHex = "#94a3b8";

// Inverse text (on dark backgrounds)
export const textInverse = "text-white";
export const textInverseSubtle = "text-white/85";

// Link colors
export const textLink = "text-blue-600 hover:text-blue-700";
export const textLinkSubtle = "text-slate-600 hover:text-blue-600";

// Light mode backgrounds
export const bgPage = "bg-slate-50";       // Page backgrounds
export const bgCard = "bg-white";          // Card backgrounds
export const bgSubtle = "bg-slate-100";    // Subtle backgrounds (hovers, sections)
export const bgMuted = "bg-slate-200";     // Muted backgrounds (disabled, borders)

// Dark mode text (for dark backgrounds like admin, modals)
export const textPrimaryDark = "text-white";
export const textSecondaryDark = "text-slate-300";
export const textTertiaryDark = "text-slate-400";
export const textMutedDark = "text-slate-500";
