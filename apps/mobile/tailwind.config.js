/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
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
          DEFAULT: '#6366F1',
          light: '#EEF2FF',
          dark: '#4F46E5',
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
        surface: {
          DEFAULT: '#F8FAFC',
          card: '#FFFFFF',
          dark: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};
