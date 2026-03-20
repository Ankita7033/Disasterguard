/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', dark: '#B91C1C' },
        warning: { DEFAULT: '#F97316', light: '#FFEDD5', dark: '#C2410C' },
        success: { DEFAULT: '#22C55E', light: '#DCFCE7', dark: '#15803D' }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } }
      }
    }
  },
  plugins: []
}
