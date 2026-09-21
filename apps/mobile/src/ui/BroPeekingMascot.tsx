import React from 'react';
import { View, Text, Image } from 'react-native';

export type BroMood = 'happy' | 'sarcastic' | 'sos' | 'idle' | 'due';

interface BroPeekingMascotProps {
  mood?: BroMood;
  speechText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const MASCOT_IMAGES = {
  idle: require('../../assets/brand/mascot-head.png'),
  happy: require('../../assets/brand/mascot-happy.png'),
  sarcastic: require('../../assets/brand/mascot-sarcastic.png'),
  sos: require('../../assets/brand/mascot-sos.png'),
  due: require('../../assets/brand/mascot-megaphone.png'),
};

export const BroPeekingMascot: React.FC<BroPeekingMascotProps> = ({
  mood = 'idle',
  speechText,
  size = 'md',
}) => {
  const getMascotMeta = () => {
    switch (mood) {
      case 'sarcastic':
        return {
          badge: '💀',
          title: 'Bro Cà Khịa',
          defaultSpeech: 'Bro... task này tính để sang tuần luôn hả?',
          bubbleBorder: 'border-yellow-200',
          bubbleBg: 'bg-yellow-50/95',
          accentColor: '#FACC15',
        };
      case 'sos':
        return {
          badge: '🚨',
          title: 'Bro Cứu Hộ',
          defaultSpeech: 'Task bị trễ rồi! Có Bro nào cứu bồ không?',
          bubbleBorder: 'border-red-200',
          bubbleBg: 'bg-red-50/95',
          accentColor: '#FF4D4F',
        };
      case 'due':
        return {
          badge: '⚡',
          title: 'Bro Nhắc Việc',
          defaultSpeech: 'Bro, it\'s due! Đến hạn rồi đó!',
          bubbleBorder: 'border-purple-300',
          bubbleBg: 'bg-purple-50/95',
          accentColor: '#6C4DFF',
        };
      case 'happy':
        return {
          badge: '🔥',
          title: 'Bro Hết Nấc',
          defaultSpeech: 'Đỉnh nóc kịch trần! Cả nhà cày điểm cực mượt!',
          bubbleBorder: 'border-green-200',
          bubbleBg: 'bg-green-50/95',
          accentColor: '#22C55E',
        };
      default:
        return {
          badge: '🧢',
          title: 'Bro Trợ Lý',
          defaultSpeech: 'Hôm nay săn việc nhà nào đây bro?',
          bubbleBorder: 'border-purple-200',
          bubbleBg: 'bg-white/95',
          accentColor: '#6C4DFF',
        };
    }
  };

  const meta = getMascotMeta();
  const displayText = speechText || meta.defaultSpeech;

  const sizeConfig = {
    sm: { img: 40, offset: -8 },
    md: { img: 52, offset: -10 },
    lg: { img: 68, offset: -14 },
  }[size];

  return (
    <View className="items-center my-2">
      {/* Speech Bubble */}
      {displayText ? (
        <View
          className={`border ${meta.bubbleBorder} ${meta.bubbleBg} rounded-2xl px-4 py-2.5 shadow-sm max-w-[92%] mb-1.5 flex-row items-center`}
          style={{ shadowColor: meta.accentColor, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
        >
          <Text className="text-sm mr-1.5">{meta.badge}</Text>
          <Text className="text-xs font-semibold text-slate-800 flex-1 leading-4">
            {displayText}
          </Text>
        </View>
      ) : null}

      {/* Mascot Peeking from bottom banner */}
      <View className="items-center justify-center">
        <View
          className="rounded-full bg-purple-100/80 p-1 border-2 border-white shadow-sm"
          style={{ elevation: 3 }}
        >
          <Image
            source={MASCOT_IMAGES[mood] || MASCOT_IMAGES.idle}
            style={{ width: sizeConfig.img, height: sizeConfig.img, resizeMode: 'contain' }}
          />
        </View>
      </View>
    </View>
  );
};
