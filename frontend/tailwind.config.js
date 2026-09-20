/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#070a0f',
          900: '#0d131d',
          850: '#131c2b',
          800: '#1b273b',
          700: '#263752',
          600: '#384d70',
          500: '#4e6792',
          400: '#738cb8',
          300: '#a3b6d8',
          200: '#cbd7ec',
          100: '#e5ecf6',
        }
      }
    },
  },
  plugins: [],
}
