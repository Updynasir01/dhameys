/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9ebff',
          200: '#bbdbff',
          300: '#8ec4ff',
          400: '#59a3ff',
          500: '#2e7dfa',   // Primary brand blue
          600: '#1a5fd4',
          700: '#1649ab',
          800: '#183d8a',
          900: '#1a3570',
          950: '#121f47',
        },
        gold: {
          400: '#f5c842',
          500: '#e6b020',
          600: '#c9920a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'pulse-slow':  'pulse 3s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },               to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
