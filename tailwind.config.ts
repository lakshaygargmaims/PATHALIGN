import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#102B46',
          50: '#F0F5FA',
          100: '#DFE9F2',
          200: '#B9CEE2',
          300: '#8CABCC',
          400: '#5481AE',
          500: '#2F5F8F',
          600: '#1E4469',
          700: '#102B46',
          800: '#0B1F33',
          900: '#071523',
        },
        royal: {
          DEFAULT: '#2563EB',
          50: '#EFF5FF',
          100: '#DBE8FE',
          200: '#BFD7FE',
          300: '#93BBFD',
          400: '#6098FA',
          500: '#3B7AF6',
          600: '#2563EB',
          700: '#1D4FD8',
          800: '#1E43AF',
          900: '#1E3C8A',
        },
        teal: {
          DEFAULT: '#14B8A6',
          50: '#EFFEFC',
          100: '#D5FAF5',
          200: '#AEF4EA',
          300: '#7DE9DC',
          400: '#48D5C6',
          500: '#14B8A6',
          600: '#0D9C8E',
          700: '#0F7D73',
          800: '#11635C',
          900: '#12524D',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,43,70,0.04), 0 4px 16px rgba(16,43,70,0.06)',
        'card-hover': '0 2px 4px rgba(16,43,70,0.06), 0 10px 28px rgba(16,43,70,0.10)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
