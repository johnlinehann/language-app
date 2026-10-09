/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Original Kotoba palette: vermilion (torii), indigo (ai-zome), matcha.
        shu: { 50: '#fff3ef', 100: '#ffe1d7', 400: '#f07a5e', 500: '#e8553d', 600: '#cc3f29', 700: '#a8311f' },
        ai: { 50: '#eef2fb', 100: '#d9e1f5', 400: '#5a74c2', 500: '#3b55a6', 600: '#2c4189', 700: '#22336c', 900: '#141d3d' },
        matcha: { 50: '#f1f8ec', 100: '#dcefd0', 400: '#7fb85d', 500: '#5f9c3d', 600: '#4a7e2e' },
        kin: { 400: '#f2b84b', 500: '#e09b1d' },
        washi: { 50: '#fffaf3', 100: '#f7efe2', 200: '#ece0cc' },
        sumi: { 700: '#2b2b33', 800: '#1d1d24', 900: '#121218' },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
        slideup: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
      },
      animation: {
        pop: 'pop .2s ease-out',
        shake: 'shake .3s ease-in-out',
        slideup: 'slideup .22s ease-out',
      },
    },
  },
  plugins: [],
};
