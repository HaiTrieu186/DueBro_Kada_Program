// Due Bro Design Tokens - Brand Colors (Architecture Section 11)
export const colors = {
  primary: {
    DEFAULT: '#7C3AED', // Electric Purple
    light: '#9061F9',
    dark: '#5B21B6',
  },
  dark: {
    DEFAULT: '#181818', // Than chì / Charcoal
    secondary: '#242424',
    tertiary: '#383838',
  },
  light: {
    DEFAULT: '#FAFAF9', // Trắng kem / Warm white
    secondary: '#F5F5F4',
    tertiary: '#E7E5E4',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export type Colors = typeof colors;
