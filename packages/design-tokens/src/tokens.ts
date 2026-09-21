import { colors } from './colors';

export const tokens = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    fontFamily: {
      body: 'System',
      display: 'System', // Bold display font
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16, // Minimum size per ARCH 11.3
      lg: 18,
      xl: 20,
      xxl: 24,
      heading: 32,
    },
  },
  touchTarget: {
    min: 44, // Minimum 44px touch target for mobile a11y
  },
  mascot: {
    states: ['happy', 'sarcastic', 'sos', 'sleeping'] as const,
  },
} as const;

export type MascotState = typeof tokens.mascot.states[number];
