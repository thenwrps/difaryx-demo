/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070B12',
        surface: '#101622',
        'surface-hover': '#121826',
        primary: '#1D4ED8',
        accent: '#4F46E5',
        border: 'rgba(255,255,255,0.08)',
        text: {
          main: '#FFFFFF',
          muted: '#9CA3AF',
          dim: '#4B5563'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
