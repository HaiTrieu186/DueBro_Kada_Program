import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface ProgressBarProps {
  achieved: number;
  target: number;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  achieved, target, showLabel = true, height = 10, color = Colors.brand.purple,
}) => {
  const pct = Math.min((achieved / target) * 100, 100);

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${pct}%` as any, { duration: 600 }),
  }));

  return (
    <View>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.labelLeft}>Weekly Target</Text>
          <Text style={styles.labelRight}>{achieved} / {target} PTS</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color, height: height - 4 }, barStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  labelLeft: { fontSize: 10, fontWeight: '600', color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  labelRight: { fontSize: 13, fontWeight: '700', color: Colors.charcoal, fontVariant: ['tabular-nums'] },
  track: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  fill: {
    borderRadius: 100,
  },
});
