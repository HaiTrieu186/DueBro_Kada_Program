import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type BadgeVariant = 'urgent' | 'routine' | 'bill' | 'points' | 'purple' | 'mint' | 'sos';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  urgent:  { bg: Colors.coralLight,        text: Colors.coral,          border: Colors.coralBorder },
  routine: { bg: Colors.surface,           text: Colors.muted,          border: Colors.border },
  bill:    { bg: Colors.brand.purpleLight, text: Colors.brand.purple,   border: Colors.brand.purpleBorder },
  points:  { bg: '#ECFDF5',               text: '#065F46',             border: '#A7F3D0' },
  purple:  { bg: Colors.brand.purpleLight, text: Colors.brand.purple,   border: Colors.brand.purpleBorder },
  mint:    { bg: '#D1FAE5',               text: '#065F46',             border: '#6EE7B7' },
  sos:     { bg: '#FEE2E2',               text: '#991B1B',             border: '#FECACA' },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'routine' }) => {
  const s = BADGE_STYLES[variant];
  return (
    <View style={[styles.base, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
