import React from 'react';
import { View, Text } from 'react-native';
import type { TaskCategory } from '@duebro/shared-types';

export type TrustTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'newbie';

export function getTrustTier(score: number, totalTasksCompleted: number = 0): { tier: TrustTier; label: string } {
  if (totalTasksCompleted < 3) {
    return { tier: 'newbie', label: 'Mới' };
  }
  if (score >= 90) return { tier: 'diamond', label: 'Kim Cương' };
  if (score >= 75) return { tier: 'gold', label: 'Vàng' };
  if (score >= 50) return { tier: 'silver', label: 'Bạc' };
  return { tier: 'bronze', label: 'Đồng' };
}

interface TrustBadgeProps {
  score?: number;
  completedTasks?: number;
  tier?: TrustTier;
  showScore?: boolean;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  score = 80,
  completedTasks = 5,
  tier: propTier,
  showScore = true,
}) => {
  const calculated = getTrustTier(score, completedTasks);
  const tier = propTier ?? calculated.tier;
  const label = calculated.label;

  const tierStyles: Record<TrustTier, { bg: string; text: string; dot: string }> = {
    diamond: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-600' },
    gold: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    silver: { bg: 'bg-slate-200', text: 'text-slate-800', dot: 'bg-slate-500' },
    bronze: { bg: 'bg-orange-100', text: 'text-orange-900', dot: 'bg-orange-700' },
    newbie: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  };

  const style = tierStyles[tier];

  return (
    <View className={`flex-row items-center px-2.5 py-1 rounded-full ${style.bg} self-start`}>
      <View className={`w-2 h-2 rounded-full mr-1.5 ${style.dot}`} />
      <Text className={`text-xs font-bold ${style.text}`}>
        {label} {showScore && tier !== 'newbie' ? `• ${Math.round(score)}` : ''}
      </Text>
    </View>
  );
};

interface CategoryBadgeProps {
  category: TaskCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const meta: Record<TaskCategory, { label: string; bg: string; text: string }> = {
    cleaning: { label: 'Dọn dẹp', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    trash: { label: 'Đổ rác', bg: 'bg-rose-100', text: 'text-rose-800' },
    kitchen: { label: 'Bếp núc', bg: 'bg-orange-100', text: 'text-orange-800' },
    shopping: { label: 'Mua sắm', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    maintenance: { label: 'Sửa chữa', bg: 'bg-cyan-100', text: 'text-cyan-800' },
    other: { label: 'Khác', bg: 'bg-slate-100', text: 'text-slate-800' },
  };

  const item = meta[category] || meta.other;

  return (
    <View className={`px-2 py-0.5 rounded-md ${item.bg} self-start`}>
      <Text className={`text-xs font-semibold ${item.text}`}>{item.label}</Text>
    </View>
  );
};

interface EffortBadgeProps {
  points: number;
  bonus?: boolean;
}

export const EffortBadge: React.FC<EffortBadgeProps> = ({ points, bonus = false }) => {
  return (
    <View className={`flex-row items-center px-2 py-1 rounded-lg ${bonus ? 'bg-amber-100' : 'bg-[#EDE9FE]'}`}>
      <Text className={`text-xs font-extrabold ${bonus ? 'text-amber-800' : 'text-[#6C4DFF]'}`}>
        ⚡ +{points} EP {bonus ? '🔥 (+10%)' : ''}
      </Text>
    </View>
  );
};
