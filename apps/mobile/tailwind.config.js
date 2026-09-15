/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          purple:       '#7C3AED',
          purpleHover:  '#6D28D9',
          purpleLight:  '#F5F3FF',
          purpleBorder: '#DDD6FE',
          charcoal:     '#18181B',
          muted:        '#71717A',
          bg:           '#FAFAF9',
          surface:      '#F4F4F5',
          card:         '#FFFFFF',
          border:       '#E4E4E7',
          coral:        '#F97316',
          mint:         '#10B981',
        },
      },
      fontFamily: {
        outfit:  ['Outfit_700Bold'],
        sans:    ['PlusJakartaSans_500Medium'],
        mono:    ['JetBrainsMono_600SemiBold'],
      },
    },
  },
  plugins: [],
};
