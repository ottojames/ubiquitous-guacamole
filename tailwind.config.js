/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: ['min-h-[420px]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        body: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: '#2563EB',
        'primary-foreground': '#FFFFFF',
        brand: {
          50: '#f3f7ff',
          100: '#e6efff',
          200: '#cddfff',
          400: '#6ea8ff',
          600: '#2563eb',
          700: '#1e40af',
        },
        'brand-navy': '#192650',
        'brand-blue': '#3866AF',
        'brand-mist': '#F8FAFF',
        'brand-gray': '#5F6E8B',
        'brand-slate': '#667085',
        'brand-lilac': '#E8EAFB',
      },
      borderRadius: { pill: '999px', '2xl': '24px' },
      boxShadow: { card: '0 8px 28px rgba(2,8,23,.08), 0 2px 6px rgba(2,8,23,.05)' },
      keyframes: {
        progress: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        progress: 'progress 1.5s linear infinite',
        shimmer: 'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [],
};
