import React from 'react';
import { View, Text, Image } from 'react-native';
import { TactileButton } from './TactileButton';

export type MascotMood = 'happy' | 'sarcastic' | 'sos' | 'sleeping' | 'cleaning' | 'reminder';

interface EmptyStateProps {
  mood?: MascotMood;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
}

const MASCOT_IMAGES = {
  happy: require('../../assets/brand/mascot-like.png'),
  sarcastic: require('../../assets/brand/mascot-sarcastic.png'),
  sos: require('../../assets/brand/mascot-sos.png'),
  sleeping: require('../../assets/brand/mascot-sleeping.png'),
  cleaning: require('../../assets/brand/card-cleaning.png'),
  reminder: require('../../assets/brand/card-reminder.png'),
};

const mascotMeta: Record<MascotMood, { badgeColor: string; broTitle: string }> = {
  happy: {
    badgeColor: 'bg-green-50 border-green-200 text-green-700',
    broTitle: 'Bro Chill',
  },
  sarcastic: {
    badgeColor: 'bg-yellow-50 border-yellow-200 text-amber-800',
    broTitle: 'Bro Cà Khịa',
  },
  sos: {
    badgeColor: 'bg-red-50 border-red-200 text-red-700',
    broTitle: 'Bro Cứu Hộ',
  },
  sleeping: {
    badgeColor: 'bg-purple-50 border-purple-200 text-[#6C4DFF]',
    broTitle: 'Bro Đang Ngủ',
  },
  cleaning: {
    badgeColor: 'bg-purple-50 border-purple-200 text-[#6C4DFF]',
    broTitle: 'Bro Dọn Dẹp',
  },
  reminder: {
    badgeColor: 'bg-purple-50 border-purple-200 text-[#6C4DFF]',
    broTitle: 'Bro Nhắc Việc',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  mood = 'happy',
  title,
  description,
  actionTitle,
  onAction,
}) => {
  const currentMeta = mascotMeta[mood] || mascotMeta.happy;
  const imageSource = MASCOT_IMAGES[mood] || MASCOT_IMAGES.happy;

  return (
    <View className="items-center justify-center p-6 my-auto">
      {/* Mascot Graphic Avatar */}
      <View
        className="w-24 h-24 rounded-3xl bg-[#F5F3FF] items-center justify-center border-2 border-[#DDD6FE] mb-3.5 shadow-sm p-2"
        style={{ elevation: 2 }}
      >
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
        />
      </View>

      {/* Mascot Badge Tag */}
      <View className={`px-3 py-0.5 rounded-full border mb-2.5 ${currentMeta.badgeColor}`}>
        <Text className="text-[11px] font-bold uppercase tracking-wider">
          {currentMeta.broTitle}
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
