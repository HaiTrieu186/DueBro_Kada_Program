import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface TactileButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'purple' | 'ghost' | 'danger' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TactileButton: React.FC<TactileButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(pressed.value * 2, { duration: 80 }) }],
    shadowOffset: { width: 0, height: withTiming(pressed.value === 1 ? 0 : 2, { duration: 80 }) },
  }));

  const bg = {
    primary: Colors.charcoal,
    purple:  Colors.brand.purple,
    ghost:   Colors.card,
    danger:  Colors.red,
    mint:    Colors.mint,
  }[variant];

  const shadowColor = {
    primary: Colors.charcoal,
    purple:  Colors.brand.purpleShadow,
    ghost:   Colors.border,
    danger:  '#B91C1C',
    mint:    '#047857',
  }[variant];

  const textColor = variant === 'ghost' ? Colors.charcoal : '#fff';

  const pads = { sm: { paddingVertical: 8, paddingHorizontal: 14 }, md: { paddingVertical: 12, paddingHorizontal: 20 }, lg: { paddingVertical: 16, paddingHorizontal: 28 } }[size];
  const fontSize = { sm: 12, md: 14, lg: 16 }[size];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      style={[
        styles.base,
        { backgroundColor: bg, shadowColor, width: fullWidth ? '100%' : undefined },
        pads,
        animStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: textColor, fontSize }, textStyle]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  label: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
