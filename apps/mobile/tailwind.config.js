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
          DEFAULT: '#6C4DFF', // Electric Brand Purple
          hover: '#5B3CE6',
          light: '#EDE9FE',
          surface: '#F5F3FF',
          dark: '#4C2CC9',
        },
        secondary: {
          DEFAULT: '#7C3AED',
          light: '#F5F3FF',
          dark: '#5B21B6',
        },
        accent: {
          DEFAULT: '#FACC15', // Karma Yellow
          yellow: '#FACC15',
          red: '#FF4D4F',     // Deadline Alert / SOS
          green: '#22C55E',   // Success
          light: '#FEF9C3',
        },
        trust: {
          diamond: '#6C4DFF', // > 90
          gold: '#F59E0B',    // 75 - 89
          silver: '#71717A',  // 50 - 74
          bronze: '#A1A1AA',  // < 50
          newbie: '#6366F1',  // Nhãn "Mới"
        },
        surface: {
          DEFAULT: '#FAFAF9',
          card: '#FFFFFF',
          purple: '#F5F3FF',
          dark: '#181818',
        },
      },
    },
  },
  plugins: [],
};
