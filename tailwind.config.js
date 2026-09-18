/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        leather: {
          50: '#FAF6F0',
          100: '#F5EFEB',
          200: '#E8DCD1',
          300: '#D4BEAB',
          400: '#A88265',
          500: '#8C5E3C',
          600: '#6B4226',
          700: '#57351E',
          800: '#4A2E1F',
          900: '#331F14',
          950: '#1F130B',
        },
        gold: {
          50: '#FBF8EE',
          100: '#F6EFD7',
          200: '#ECDEB0',
          300: '#DEC783',
          400: '#C9A05E',
          500: '#B8935F',
          600: '#9E7943',
          700: '#7E5F34',
          800: '#654D2E',
          900: '#523F27',
        },
        cream: {
          50: '#FDFAF5',
          100: '#FAF6F0',
          200: '#F5EFEB',
          300: '#EFE7DC',
          400: '#E2D6C5',
          500: '#C8B9A1',
        },
        corporate: {
          50: '#FAF6F0',
          100: '#F5EFEB',
          200: '#E8DCD1',
          300: '#D4BEAB',
          400: '#9C8979',
          500: '#786455',
          600: '#5C4B3E',
          700: '#44372D',
          800: '#2F261E',
          900: '#1F1813',
          950: '#120E0B',
        },
        brand: {
          50: '#FAF6F0',
          100: '#F5EFEB',
          200: '#E8DCD1',
          300: '#DEC783',
          400: '#C9A05E',
          500: '#B8935F',
          600: '#6B4226',
          700: '#57351E',
          800: '#4A2E1F',
          900: '#331F14',
          950: '#1F130B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.07), 0 1px 2px -1px rgba(0, 0, 0, 0.07)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}