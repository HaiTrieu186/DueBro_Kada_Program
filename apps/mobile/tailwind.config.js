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
        primary: {
          DEFAULT: '#FF5722',
          hover: '#F4511E',
          light: '#FFCCBC',
          dark: '#E64A19',
        },
        secondary: {
          DEFAULT: '#1976D2',
          light: '#BBDEFB',
          dark: '#0D47A1',
        },
        accent: {
          DEFAULT: '#FFD600',
          light: '#FFF9C4',
        },
        trust: {
          diamond: '#9C27B0',
          gold: '#FFB300',
          silver: '#78909C',
          bronze: '#8D6E63',
          newbie: '#607D8B',
        },
      },
    },
  },
  plugins: [],
};
