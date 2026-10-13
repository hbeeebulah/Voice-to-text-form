/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        'surface': '#0f131c',
        'surface-dim': '#0f131c',
        'surface-bright': '#353943',
        'surface-container-lowest': '#0a0e17',
        'surface-container-low': '#181b25',
        'surface-container': '#1c1f29',
        'surface-container-high': '#262a34',
        'surface-container-highest': '#31353f',
        'surface-variant': '#31353f',
        'on-surface': '#dfe2ef',
        'on-surface-variant': '#c7c4d7',
        'outline': '#908fa0',
        'outline-variant': '#464554',
        'primary': '#c0c1ff',
        'primary-container': '#8083ff',
        'on-primary': '#1000a9',
        'on-primary-container': '#0d0096',
        'secondary': '#d0bcff',
        'secondary-container': '#571bc1',
        'secondary-fixed': '#e9ddff',
        'tertiary': '#4edea3',
        'tertiary-container': '#00885d',
        'on-tertiary': '#003824',
        'error': '#ffb4ab',
        'error-container': '#93000a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
        lora: ['Lora', 'serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
