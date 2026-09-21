import React from 'react';
import { View } from 'react-native';

/**
 * Placeholder component for the center "+" tab button in bottom navigation.
 * Tab press event is intercepted in (tabs)/_layout.tsx to push /task/create modal.
 */
export default function CreateTabPlaceholder() {
  return <View className="flex-1 bg-white" />;
}
