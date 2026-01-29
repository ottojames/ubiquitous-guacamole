/**
 * Design tokens for the Publish flow
 * Stripe-level craft: consistent spacing, colors, typography, shadows
 */

export const tokens = {
  // Spacing scale (8px base)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // Border radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },

  // Typography
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.6',
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Colors
  colors: {
    // Neutrals
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },

    // Primary (Blue)
    blue: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },

    // Success (Emerald)
    emerald: {
      50: '#ECFDF5',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
    },

    // Warning (Amber)
    amber: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      400: '#FBBF24',
      600: '#D97706',
      800: '#92400E',
      900: '#78350F',
    },

    // Error (Rose)
    rose: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      800: '#9F1239',
      900: '#881337',
    },
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Layout
  layout: {
    maxWidth: '1280px',
    formWidth: '760px',
    railWidth: '360px',
    gutter: '24px',
  },

  // Z-index
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    overlay: 400,
    modal: 500,
    toast: 600,
  },
} as const;

// Utility classes based on tokens
export const classes = {
  // Cards
  card: `rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md`,
  cardRail: `rounded-2xl border border-slate-200/40 bg-white/50 backdrop-blur-sm shadow-none transition-opacity duration-300 opacity-90 hover:opacity-100`,

  // Buttons
  btnPrimary: `inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm`,
  btnSecondary: `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`,

  // Inputs
  input: `block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`,
  inputError: `block w-full rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20`,

  // Labels
  label: `block text-sm font-medium text-slate-700 mb-1.5`,
  labelRequired: `block text-sm font-medium text-slate-700 mb-1.5 after:content-['*'] after:ml-0.5 after:text-rose-500`,

  // Helper text
  helperText: `mt-1.5 text-xs text-slate-500`,
  errorText: `mt-1.5 text-xs font-medium text-rose-600`,

  // Section headers
  sectionTitle: `text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400`,

  // Status indicators
  statusDot: {
    success: `inline-block h-1.5 w-1.5 rounded-full bg-emerald-400`,
    warning: `inline-block h-1.5 w-1.5 rounded-full bg-amber-400`,
    error: `inline-block h-1.5 w-1.5 rounded-full bg-rose-400`,
  },
} as const;
