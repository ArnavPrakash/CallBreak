/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#1a5c38',
          dark: '#0f3d25',
          light: '#2d7a4e',
        },
        gold: '#d4af37',
      },
    },
  },
  plugins: [],
};
