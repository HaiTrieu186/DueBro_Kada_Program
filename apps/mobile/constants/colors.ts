// Due Bro Design Tokens — Brand Colors
// Kế thừa chính xác từ HTML prototype (knowledge-base/public/)

export const Colors = {
  // --- Brand Primary ---
  brand: {
    purple:       '#7C3AED', // Electric Purple — signature
    purpleHover:  '#6D28D9',
    purpleLight:  '#F5F3FF',
    purpleBorder: '#DDD6FE',
    purpleShadow: '#5B21B6',
  },

  // --- Neutrals ---
  charcoal:  '#18181B', // Main text, active buttons
  muted:     '#71717A', // Secondary text
  bg:        '#FAFAF9', // App background (cream)
  surface:   '#F4F4F5', // Page background
  card:      '#FFFFFF', // Card backgrounds
  border:    '#E4E4E7', // Hairline borders
  surfaceAlt: '#F3F4F3',

  // --- Status / Feedback ---
  mint:       '#10B981', // Success, reward, points earned
  mintLight:  '#D1FAE5',
  coral:      '#F97316', // Urgent, alert, deadline
  coralLight: '#FFF7ED',
  coralBorder:'#FFEDD5',
  amber:      '#F59E0B',
  amberLight: '#FEF3C7',
  red:        '#EF4444',
  blue:       '#3B82F6',

  // --- Semantic ---
  urgent:  '#F97316',
  success: '#10B981',
  primary: '#18181B',
  accent:  '#7C3AED',

  // --- Overlays ---
  overlay:      'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export type ColorKey = keyof typeof Colors;
