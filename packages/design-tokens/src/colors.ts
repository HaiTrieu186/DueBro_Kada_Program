export const colors = {
  // Brand colors (DueBro Gen Z Streetwear & Cool Mascot)
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
    yellow: '#FACC15',  // Karma / Trophy / Star
    red: '#FF4D4F',     // Deadline Alert / SOS
    green: '#22C55E',   // Success / Completed
    light: '#FEF9C3',
  },

  // Semantic
  success: {
    DEFAULT: '#22C55E',
    light: '#DCFCE7',
    dark: '#16A34A',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },
  danger: {
    DEFAULT: '#FF4D4F',
    light: '#FEE2E2',
    dark: '#DC2626',
  },

  // Trust Score Tiers (Mục 7.4 ARCH)
  trust: {
    diamond: '#6C4DFF', // > 90
    gold: '#F59E0B',    // 75 - 89
    silver: '#71717A',  // 50 - 74
    bronze: '#A1A1AA',  // < 50
    newbie: '#6366F1',  // Nhãn "Mới"
  },

  // Surfaces & Backgrounds
  background: {
    DEFAULT: '#FAFAF9',
    card: '#FFFFFF',
    surface: '#F5F3FF',
    dark: '#181818',
  },
  text: {
    primary: '#181818',
    secondary: '#71717A',
    muted: '#A1A1AA',
    inverse: '#FFFFFF',
  },
  border: {
    DEFAULT: '#E4E4E7',
    focused: '#6C4DFF',
    purple: '#DDD6FE',
  },

  // Admin & Status Tokens (Preserved for Admin Dashboard & Prodify Style)
  status: {
    urgent: '#FF1744',
    open: '#2979FF',
    in_progress: '#FF9100',
    review: '#AA00FF',
    completed: '#00E676',
    disputed: '#D50000',
  },
  dark: {
    DEFAULT: '#1E1E2E',
    surface: '#2A2A3E',
    border: '#3E3E5E',
  },
  light: {
    DEFAULT: '#FFFFFF',
    surface: '#F5F5FA',
    border: '#E0E0E8',
  },
  prodify: {
    canvas: '#0c0c0e',
    surface1: '#131316',
    surface2: '#18181d',
    surface3: '#202027',
    accent: '#7C3AED',
    glow: '#9061F9',
  },
} as const;
