/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'sm': ['1rem', { lineHeight: '1.5' }],
        'base': ['1.125rem', { lineHeight: '1.6' }],
        'lg': ['1.25rem', { lineHeight: '1.5' }],
        'xl': ['1.5rem', { lineHeight: '1.4' }],
        '2xl': ['1.875rem', { lineHeight: '1.3' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      ringWidth: {
        DEFAULT: '3px',
        '0': '0px',
        '1': '1px',
        '2': '2px',
        '4': '4px',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      colors: {
        brand: {
          900: '#0a1628',
          800: '#132040',
          700: '#1e3264',
          600: '#2a4494',
          500: '#3558c0',
          100: '#e8edf8',
          50:  '#f3f5fc',
        },
      },
    },
  },
  plugins: [],
}
