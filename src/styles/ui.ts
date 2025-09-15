// New shared UI tokens (Stripe-like cleanliness)
// Use CSS hero band class for reliability across browsers
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

export const card =
  "bg-white border border-[rgba(25,38,80,.06)] rounded-2xl shadow-[0_6px_18px_rgba(2,6,23,.06)] focus-within:ring-2 focus-within:ring-blue-500/30";
export const cardHover =
  "transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform will-change-[box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(25,38,80,.10)] hover:ring-1 hover:ring-slate-200/60";
export const cardHeader = "text-sm font-semibold text-blue-900";
export const tinySubheader = "text-[11px] font-semibold uppercase tracking-wide text-slate-500";

export const h1 = "text-[36px] leading-[44px] font-semibold tracking-tight text-[#192650]";
export const h2 = "text-[28px] leading-[36px] font-semibold tracking-tight text-[#192650]";
export const h3 = "text-[20px] leading-[28px] font-medium text-[#192650]";

export const body = "text-[16px] leading-[26px]";
export const small = "text-[14px] leading-[22px]";

export const btnPrimary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#2563EB] text-white font-semibold shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition-all duration-200 hover:bg-[#1E4FD8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const btnSecondary =
  "inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-[#192650] font-medium border border-[rgba(25,38,80,0.10)] hover:border-[rgba(25,38,80,0.20)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";

// Stepper (Publish)
export const stepperTrack = "relative h-1 w-full rounded-full bg-blue-600/15";
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
export const input = "h-11 rounded-lg border border-[rgba(25,38,80,0.12)] bg-white px-3 text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-white";
export const pillBtn = btnPrimary;
export const ghostPill = btnSecondary;
export const prose = "prose max-w-none text-[14px] leading-6 prose-headings:mt-0";

// Back-compat shims for previous wrappers
export const siteCanvas = canvas + " text-[#222d35] min-h-screen";
export const heroGradientLight = 'hero-band';
