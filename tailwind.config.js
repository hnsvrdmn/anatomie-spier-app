/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        anatomy: {
          origin: '#ef4444',
          'origin-dark': '#dc2626',
          insertion: '#2563eb',
          'insertion-dark': '#1d4ed8',
          path: '#f97316',
          'path-stroke': '#ea580c',
          success: '#16a34a',
          warning: '#eab308',
          danger: '#dc2626',
        }
      },
      aspectRatio: {
        'skeleton': '542 / 1287',
      }
    },
  },
  plugins: [],
}
