import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface AvatarProps {
  initial: string;
  color: string;
  size?: number;
  showCheck?: boolean;
  showRing?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  initial, color, size = 32, showCheck = false, showRing = false,
}) => {
  return (
    <View style={[
      styles.container,
      {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: showRing ? 2 : 0,
        borderColor: Colors.card,
      }
    ]}>
      <Text style={[styles.initial, { fontSize: size * 0.38 }]}>
        {showCheck ? '✓' : initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: '700',
  },
});
