import React from 'react';
import { View, Text } from 'react-native';

interface TrustBadgeProps {
  score?: number;
  level?: 'gold' | 'silver' | 'bronze' | 'new';
  isProvisional?: boolean;
  isSimulated?: boolean;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  score = 70,
  level = 'silver',
  isProvisional = false,
  isSimulated = false,
  showScore = true,
  size = 'md',
}) => {
  const getBadgeStyle = () => {
    if (isProvisional || level === 'new') {
      return {
        bg: 'bg-slate-100 border-slate-300',
        text: 'text-slate-700',
        title: 'Thành viên Mới',
        icon: '🌱',
      };
    }
    if (score >= 85 || level === 'gold') {
      return {
        bg: 'bg-amber-50 border-amber-300',
        text: 'text-amber-800',
        title: 'Bro Vàng',
        icon: '🥇',
      };
    }
    if (score >= 70 || level === 'silver') {
      return {
        bg: 'bg-sky-50 border-sky-300',
        text: 'text-sky-800',
        title: 'Bro Bạc',
        icon: '🥈',
      };
    }
    return {
      bg: 'bg-stone-100 border-stone-300',
      text: 'text-stone-700',
      title: 'Bro Đồng',
      icon: '🥉',
    };
  };

  const badge = getBadgeStyle();
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <View className="flex-row items-center flex-wrap gap-1">
      <View
        className={`flex-row items-center rounded-full border ${badge.bg} ${
          isSm ? 'px-2 py-0.5' : isLg ? 'px-3.5 py-1.5' : 'px-2.5 py-1'
        }`}
      >
        <Text className={isSm ? 'text-xs mr-1' : isLg ? 'text-base mr-1.5' : 'text-sm mr-1'}>
          {badge.icon}
        </Text>
        <Text
          className={`font-black ${badge.text} ${
            isSm ? 'text-[11px]' : isLg ? 'text-sm' : 'text-xs'
          }`}
        >
          {showScore && !isProvisional ? `${score} Trust` : badge.title}
        </Text>
      </View>

      {/* Nhãn bắt buộc cho demo: Hồ sơ mô phỏng (ARCH Mục 1.4) */}
      {isSimulated && (
        <View className="rounded-full bg-purple-100 border border-purple-200 px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-purple-700">Mô phỏng</Text>
        </View>
      )}

      {/* Nhãn thành viên mới nếu tạm thời */}
      {isProvisional && showScore && (
        <View className="rounded-full bg-slate-200 px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-slate-600">Mới</Text>
        </View>
      )}
    </View>
  );
};
