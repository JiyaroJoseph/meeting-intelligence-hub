/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          black: '#020617',
          dark: '#0f172a',
          card: '#111827',
          border: '#23304a',
          text: '#e5e7eb',
          muted: '#94a3b8',
          dim: '#64748b',
          gold: '#818cf8',
          yellow: '#60a5fa',
          green: '#34d399',
          red: '#f87171',
          slate: '#1e293b',
        },
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 260ms ease-out both',
        'slide-up': 'slideUp 240ms ease-out both',
        'pulse-soft': 'pulseSoft 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.65' },
        },
      },
    },
  },
  plugins: [],
}
