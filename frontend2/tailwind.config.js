/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          black: '#050A1A',
          dark: '#0C1530',
          card: '#111E3F',
          border: '#2A3A63',
          text: '#F2F6FF',
          muted: '#A9BAD9',
          dim: '#7184AA',
          gold: '#F4C95D',
          yellow: '#FFCC66',
          green: '#56D39B',
          red: '#FF6F72',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 420ms ease-out both',
        'slide-up': 'slideUp 360ms ease-out both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
