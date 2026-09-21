import React from 'react';
import { View, Text } from 'react-native';
import type { TaskCategory, TaskStatus } from '@duebro/shared-types';

interface CategoryBadgeProps {
  category: TaskCategory | string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const meta: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    cleaning: { label: 'Vệ sinh', bg: 'bg-sky-50', text: 'text-sky-700', icon: '🧹' },
    trash: { label: 'Đổ rác', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '🗑️' },
    kitchen: { label: 'Bếp núc', bg: 'bg-amber-50', text: 'text-amber-700', icon: '🍳' },
    shopping: { label: 'Mua sắm', bg: 'bg-violet-50', text: 'text-violet-700', icon: '🛒' },
    maintenance: { label: 'Sửa chữa', bg: 'bg-rose-50', text: 'text-rose-700', icon: '🔧' },
    other: { label: 'Việc chung', bg: 'bg-slate-100', text: 'text-slate-700', icon: '✨' },
  };

  const item = meta[category] || meta.other;
  const isSm = size === 'sm';

  return (
    <View className={`flex-row items-center rounded-full ${item.bg} ${isSm ? 'px-2 py-0.5' : 'px-2.5 py-1'}`}>
      <Text className={isSm ? 'text-[10px] mr-1' : 'text-xs mr-1'}>{item.icon}</Text>
      <Text className={`font-bold ${item.text} ${isSm ? 'text-[11px]' : 'text-xs'}`}>
        {item.label}
      </Text>
    </View>
  );
};

interface EffortBadgeProps {
  points: number;
  bonus?: boolean;
  size?: 'sm' | 'md';
}

export const EffortBadge: React.FC<EffortBadgeProps> = ({ points, bonus = false, size = 'md' }) => {
  const isSm = size === 'sm';

  return (
    <View className="flex-row items-center">
      <View
        className={`flex-row items-center rounded-full bg-orange-50 border border-orange-200/80 ${
          isSm ? 'px-2 py-0.5' : 'px-2.5 py-1'
        }`}
      >
        <Text className={`font-black text-[#FF5722] ${isSm ? 'text-[11px]' : 'text-xs'}`}>
          ⚡ {points}đ
        </Text>
      </View>
      {bonus && (
        <View
          className={`ml-1.5 rounded-full bg-amber-100 border border-amber-300 ${
            isSm ? 'px-1.5 py-0.5' : 'px-2 py-0.5'
          }`}
        >
          <Text className="text-[10px] font-black text-amber-800 uppercase tracking-tight">
            +10% Thưởng
          </Text>
        </View>
      )}
    </View>
  );
};

interface StatusBadgeProps {
  status: TaskStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const meta: Record<string, { label: string; bg: string; text: string }> = {
    open: { label: 'Bounty mở', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
    claimed: { label: 'Đang làm', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
    assigned: { label: 'Được giao', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700' },
    pending_approval: { label: 'Chờ duyệt', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' },
    disputed: { label: 'Chưa đạt', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' },
    completed: { label: 'Đã xong', bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-600' },
    expired: { label: 'Hết hạn', bg: 'bg-red-50 text-red-600 border-red-200', text: 'text-red-600' },
  };

  const item = meta[status] || { label: status, bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' };
  const isSm = size === 'sm';

  return (
    <View className={`rounded-full border px-2.5 py-0.5 ${item.bg}`}>
      <Text className={`font-bold ${item.text} ${isSm ? 'text-[10px]' : 'text-xs'}`}>
        {item.label}
      </Text>
    </View>
  );
};
