/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#22c55e',
          blue: '#3b82f6',
          orange: '#f97316',
          purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
}
