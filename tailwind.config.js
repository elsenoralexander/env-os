/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'quiron-primary': '#00B1A8',
        'quiron-secondary': '#023E54',
        'quiron-accent': '#E03E52',
        'quiron-gray': '#4B4F54',
        'quiron-bg': '#F0F4F8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'premium': '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
        'premium-hover': '0 20px 48px 0 rgba(31, 38, 135, 0.2)',
      }
    },
  },
  plugins: [],
}
