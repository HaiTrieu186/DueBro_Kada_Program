import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { colors } from '@duebro/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface TactileButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 8,
    }).start();
  };

  // Base dimensions - Ensure minimum 44px touch target (ARCH Mục 11 & a11y)
  const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
    sm: {
      container: 'min-h-[44px] px-3 py-2 rounded-xl',
      text: 'text-sm font-semibold',
    },
    md: {
      container: 'min-h-[48px] px-5 py-3 rounded-2xl',
      text: 'text-base font-bold',
    },
    lg: {
      container: 'min-h-[56px] px-6 py-4 rounded-2xl',
      text: 'text-lg font-extrabold',
    },
  };

  const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
    primary: {
      bg: 'bg-[#FF5722] active:bg-[#F4511E]',
      text: 'text-white',
    },
    secondary: {
      bg: 'bg-[#1976D2] active:bg-[#0D47A1]',
      text: 'text-white',
    },
    accent: {
      bg: 'bg-[#FFD600] active:bg-[#FFC400]',
      text: 'text-slate-900',
    },
    outline: {
      bg: 'bg-transparent border-2 border-slate-300 active:bg-slate-100',
      text: 'text-slate-800',
    },
    ghost: {
      bg: 'bg-transparent active:bg-slate-100',
      text: 'text-slate-700',
    },
    danger: {
      bg: 'bg-[#F44336] active:bg-[#D32F2F]',
      text: 'text-white',
    },
  };

  const selectedVariant = variantStyles[variant];
  const selectedSize = sizeClasses[size];
  const isDisabled = disabled || isLoading;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        className={`flex-row items-center justify-center shadow-sm ${selectedSize.container} ${selectedVariant.bg} ${
          isDisabled ? 'opacity-50' : 'opacity-100'
        }`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variant === 'accent' || variant === 'outline' || variant === 'ghost' ? '#0F172A' : '#FFFFFF'}
            size="small"
          />
        ) : (
          <React.Fragment>
            {leftIcon && <Animated.View className="mr-2">{leftIcon}</Animated.View>}
            <Text className={`${selectedSize.text} ${selectedVariant.text} text-center`}>
              {title}
            </Text>
            {rightIcon && <Animated.View className="ml-2">{rightIcon}</Animated.View>}
          </React.Fragment>
        )}
      </Pressable>
    </Animated.View>
  );
};
