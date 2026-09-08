/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#14b8a6',
          foreground: '#ffffff',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#e8ecff',
          container: '#dae2fd',
          elevated: '#d2d9f4',
          variant: '#bcc9e8',
        },
        civic: {
          navy: '#1e3a5f',
          teal: '#0d9488',
          sand: '#f5f0e8',
          slate: '#64748b',
        },
        status: {
          open: '#d97706',
          'open-bg': '#fef3c7',
          progress: '#0284c7',
          'progress-bg': '#e0f2fe',
          resolved: '#059669',
          'resolved-bg': '#d1fae5',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 25px -5px rgb(13 148 136 / 0.14), 0 4px 6px -4px rgb(15 23 42 / 0.1)',
      },
    },
  },
  plugins: [],
}
