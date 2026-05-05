/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Blue color for primary actions
        navy: '#0B1120',
        'navy-light': '#1e293b',
        background: '#ffffff',
        surface: '#f8fafc',
        'surface-hover': '#f1f5f9',
        border: '#e2e8f0',
        'text-main': '#0B1120',
        'text-muted': '#64748b',
        'text-dim': '#94a3b8',
        accent: '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
