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
        gold: {
          light: '#F3E5AB',
          DEFAULT: '#D4AF37',
          dark: '#AA7C11',
        },
        brown: {
          light: '#5D4037',
          DEFAULT: '#3E2723',
          dark: '#1B0000',
        },
        red: {
          light: '#E53935',
          DEFAULT: '#B71C1C',
          dark: '#7F0000',
        },
        cream: {
          light: '#FFFFFD',
          DEFAULT: '#FFF8E1',
          dark: '#F5ECCE',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-gold': '0 8px 32px 0 rgba(212, 175, 55, 0.15)',
      }
    },
  },
  plugins: [],
}
