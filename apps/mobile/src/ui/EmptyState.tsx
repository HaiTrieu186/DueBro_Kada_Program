import React from 'react';
import { View, Text } from 'react-native';
import { TactileButton } from './TactileButton';

export type MascotMood = 'happy' | 'sarcastic' | 'sos' | 'sleeping';

interface EmptyStateProps {
  mood?: MascotMood;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

const mascotEmoji: Record<MascotMood, { emoji: string; badgeColor: string; broTitle: string }> = {
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
  mood = 'happy',
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const currentMascot = mascotEmoji[mood] || mascotEmoji.happy;

  return (
    <View className="items-center justify-center p-6 my-auto">
      {/* Mascot Graphic Avatar */}
      <View className="w-20 h-20 rounded-full bg-orange-100 items-center justify-center border-4 border-[#FF5722]/20 mb-3.5 shadow-sm">
        <Text className="text-3xl">{currentMascot.emoji}</Text>
      </View>

      {/* Mascot Badge Tag */}
      <View className={`px-3 py-0.5 rounded-full border mb-2.5 ${currentMascot.badgeColor}`}>
        <Text className="text-[11px] font-bold uppercase tracking-wider">
          {currentMascot.broTitle}
        </Text>
      </View>

      {/* Title & Description */}
      <Text className="text-lg font-black text-slate-900 text-center mb-1.5">
        {title}
      </Text>
      <Text className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed mb-5">
        {description}
      </Text>

      {/* Action Button */}
      {actionTitle && onAction ? (
        <TactileButton
          title={actionTitle}
          variant="primary"
          onPress={onAction}
          size="md"
        />
      ) : null}
    </View>
  );
};
