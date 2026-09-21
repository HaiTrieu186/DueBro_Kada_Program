import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type BroMood = 'happy' | 'sarcastic' | 'sos' | 'idle';

interface BroPeekingMascotProps {
  mood?: BroMood;
  speechText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BroPeekingMascot: React.FC<BroPeekingMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
}) => {
  const getMascotMeta = () => {
    switch (mood) {
      case 'sarcastic':
        return {
          avatar: '😏',
          hat: '🧢',
          title: 'Bro Cà Khịa',
          defaultSpeech: 'Deadline đang gõ cửa kìa bro ơi, tính để việc đó tự dọn à?',
          bgColor: 'bg-amber-400',
        };
      case 'sos':
        return {
          avatar: '🚨',
          hat: '⛑️',
          title: 'Bro Cứu Hộ',
          defaultSpeech: 'Có đồng đội đang phát tín hiệu SOS cầu cứu!',
          bgColor: 'bg-rose-500',
        };
      case 'happy':
        return {
          avatar: '😎',
          hat: '👑',
          title: 'Bro Hết Nấc',
          defaultSpeech: 'Đỉnh nóc kịch trần! Cả nhà đang cày điểm cực mượt!',
          bgColor: 'bg-emerald-500',
        };
      default:
        return {
          avatar: '🤖',
          hat: '✨',
          title: 'Bro Trợ Lý',
          defaultSpeech: 'Hôm nay săn việc nhà nào đây bro?',
          bgColor: 'bg-[#FF5722]',
        };
    }
  };

  const meta = getMascotMeta();
  const displayText = speechText || meta.defaultSpeech;

  return (
    <View className="items-center my-2">
      {/* Speech Bubble */}
      {displayText ? (
        <View className="bg-white/95 border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-sm max-w-[90%] mb-1.5 flex-row items-center">
          <Text className="text-xs mr-1.5">{meta.hat}</Text>
          <Text className="text-xs font-medium text-slate-800 flex-1 leading-4">
            {displayText}
          </Text>
        </View>
      ) : null}

      {/* Peeking Mascot Body (Lấy cảm hứng từ ui-example Image 3) */}
      <View className="flex-row items-end justify-center">
        {/* Left hand/ear */}
        <View className="w-3.5 h-3.5 rounded-full bg-orange-400 -mr-1.5 mb-1 z-0 shadow-sm" />
        
        {/* Mascot Face */}
        <View
          className={`w-14 h-11 rounded-t-full ${meta.bgColor} items-center justify-center border-2 border-white shadow-md z-10`}
        >
          <Text className="text-2xl mt-0.5">{meta.avatar}</Text>
        </View>

        {/* Right hand/ear */}
        <View className="w-3.5 h-3.5 rounded-full bg-orange-400 -ml-1.5 mb-1 z-0 shadow-sm" />
      </View>
    </View>
  );
};
