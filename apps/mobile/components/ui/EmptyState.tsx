import React from 'react';
import { View, Text } from 'react-native';
import { TactileButton } from './TactileButton';
import type { MascotState } from '@duebro/design-tokens';

interface EmptyStateProps {
  state?: MascotState;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

const mascotEmoji: Record<MascotState, { emoji: string; badgeColor: string; broTitle: string }> = {
  happy: {
    emoji: '😎👍',
    badgeColor: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    broTitle: 'Bro Vui Vẻ',
  },
  sarcastic: {
    emoji: '😏🧹',
    badgeColor: 'bg-amber-100 border-amber-300 text-amber-800',
    broTitle: 'Bro Cà Khịa',
  },
  sos: {
    emoji: '🆘🚨',
    badgeColor: 'bg-rose-100 border-rose-300 text-rose-800',
    broTitle: 'Bro Cứu Hộ',
  },
  sleeping: {
    emoji: '😴💤',
    badgeColor: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    broTitle: 'Bro Đang Ngủ',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  state = 'happy',
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const currentMascot = mascotEmoji[state] || mascotEmoji.happy;

  return (
    <View className="items-center justify-center p-6 my-auto">
      {/* Mascot Graphic Avatar */}
      <View className="w-24 h-24 rounded-full bg-[#EDE9FE] items-center justify-center border-4 border-[#6C4DFF]/20 mb-4 shadow-sm">
        <Text className="text-4xl">{currentMascot.emoji}</Text>
      </View>

      {/* Mascot Badge Tag */}
      <View className={`px-3 py-1 rounded-full border mb-3 ${currentMascot.badgeColor}`}>
        <Text className="text-xs font-bold uppercase tracking-wider">
          {currentMascot.broTitle}
        </Text>
      </View>

      {/* Title & Description */}
      <Text className="text-xl font-bold text-slate-800 text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-slate-500 text-center max-w-[280px] leading-relaxed mb-6">
        {description}
      </Text>

      {/* Action Button */}
      {actionTitle && onAction && (
        <TactileButton
          title={actionTitle}
          variant="primary"
          onPress={onAction}
          size="md"
        />
      )}
    </View>
  );
};
