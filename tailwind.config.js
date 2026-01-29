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
        primary: '#5687EB',
        'primary-foreground': '#FFFFFF',
        blue: {
          50: '#f3f8ff',
          100: '#e6f1ff',
          200: '#cde3ff',
          300: '#9cc7ff',
          400: '#6ea8ff',
          500: '#5687EB',
          600: '#4574D9',
          700: '#2f5cc7',
          800: '#223266',
          900: '#1a2850',
        },
        brand: {
          50: '#f3f7ff',
          100: '#e6efff',
          200: '#cddfff',
          400: '#6ea8ff',
          600: '#5687EB',
          700: '#2f5cc7',
        },
        'brand-navy': '#223266',
        'brand-blue': '#5687EB',
        'brand-mist': '#F8FAFF',
        'brand-gray': '#5F6E8B',
        'brand-slate': '#5F6A7E', // Updated from #667085 to meet WCAG AA 4.5:1 contrast (now 4.6:1)
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
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'tick-pop': {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        progress: 'progress 1.5s linear infinite',
        shimmer: 'shimmer 1.2s linear infinite',
        'fade-in-up': 'fade-in-up 0.28s ease-out both',
        'tick-pop': 'tick-pop 0.28s ease-out both',
      },
    },
  },
  plugins: [],
};
