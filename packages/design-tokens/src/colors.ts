export const colors = {
  // Brand colors (Gen Z vibrant & energetic)
  primary: {
    DEFAULT: '#FF5722', // Deep Orange
    hover: '#F4511E',
    light: '#FFCCBC',
    dark: '#E64A19',
  },
  secondary: {
    DEFAULT: '#1976D2', // Electric Blue
    light: '#BBDEFB',
    dark: '#0D47A1',
  },
  accent: {
    DEFAULT: '#FFD600', // Energetic Yellow (Mascot Bro vibe)
    light: '#FFF9C4',
  },

  // Semantic
  success: {
    DEFAULT: '#4CAF50',
    light: '#E8F5E9',
    dark: '#2E7D32',
  },
  warning: {
    DEFAULT: '#FFA000',
    light: '#FFF8E1',
    dark: '#F57C00',
  },
  danger: {
    DEFAULT: '#F44336',
    light: '#FFEBEE',
    dark: '#C62828',
  },

  // Trust Score Tiers (Mục 7.4 ARCH)
  trust: {
    diamond: '#9C27B0', // > 90
    gold: '#FFB300',    // 75 - 89
    silver: '#78909C',  // 50 - 74
    bronze: '#8D6E63',  // < 50
    newbie: '#607D8B',  // Nhãn "Mới"
  },

  // Surfaces & Backgrounds
  background: {
    DEFAULT: '#F8FAFC',
    card: '#FFFFFF',
    dark: '#0F172A',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    inverse: '#FFFFFF',
  },
  border: {
    DEFAULT: '#E2E8F0',
    focused: '#FF5722',
  },
} as const;
