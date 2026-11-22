/** @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: c('canvas'),
        surface: c('surface'),
        sunken: c('sunken'),
        ink: c('ink'),
        muted: c('muted'),
        line: c('line'),
        brand: { DEFAULT: c('brand'), strong: c('brand-strong'), soft: c('brand-soft'), ink: c('brand-ink') },
        amber: { DEFAULT: c('amber'), soft: c('amber-soft') },
        danger: { DEFAULT: c('danger'), soft: c('danger-soft') },
        info: { DEFAULT: c('info'), soft: c('info-soft') },
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Unbounded', 'Onest', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        ctl: '10px',
        card: '18px',
      },
      boxShadow: {
        pop: '0 12px 40px -12px rgb(20 32 25 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': { from: { opacity: '0', transform: 'translateY(6px) scale(.98)' }, to: { opacity: '1', transform: 'none' } },
        pulse_ring: { '0%': { boxShadow: '0 0 0 0 rgb(var(--c-brand) / .45)' }, '100%': { boxShadow: '0 0 0 12px rgb(var(--c-brand) / 0)' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .18s ease-out',
        'pulse-ring': 'pulse_ring 1.6s ease-out infinite',
      },
    },
  },
  plugins: [],
};
