import React from 'react';
import { View, Text } from 'react-native';

interface EffortHeatmapProps {
  completedCount?: number;
  streakDays?: number;
}

export const EffortHeatmap: React.FC<EffortHeatmapProps> = ({
  completedCount = 12,
  streakDays = 5,
}) => {
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weeks = [0, 1, 2, 3, 4, 5, 6, 7];

  // Dummy activity generator for demo visual parity with ui-example Image 5 Screen 1
  const getCellIntensity = (dayIdx: number, weekIdx: number) => {
    const seed = (dayIdx * 3 + weekIdx * 5 + 7) % 10;
    if (weekIdx >= 6 && dayIdx <= 4) return 'bg-[#FF5722]'; // Highly active recently
    if (seed > 6) return 'bg-[#FF8A65]';
    if (seed > 3) return 'bg-orange-200';
    if (seed > 1) return 'bg-orange-100';
    return 'bg-slate-100';
  };

  return (
    <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Chuỗi chăm chỉ & năng suất
          </Text>
          <Text className="text-base font-black text-slate-900 mt-0.5">
            🔥 {streakDays} ngày liên tiếp • {completedCount} việc đã xong
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View className="flex-row items-center justify-between pt-1">
        {weeks.map((w) => (
          <View key={w} className="space-y-1.5">
            {days.map((d, dIdx) => (
              <View
                key={`${w}-${d}`}
                className={`w-4 h-4 rounded-md ${getCellIntensity(dIdx, w)}`}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Footer scale indicator */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <Text className="text-[11px] font-semibold text-slate-400">Ít việc</Text>
        <View className="flex-row items-center space-x-1.5">
          <View className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
          <View className="w-2.5 h-2.5 rounded-sm bg-orange-100" />
          <View className="w-2.5 h-2.5 rounded-sm bg-orange-200" />
          <View className="w-2.5 h-2.5 rounded-sm bg-[#FF8A65]" />
          <View className="w-2.5 h-2.5 rounded-sm bg-[#FF5722]" />
        </View>
        <Text className="text-[11px] font-semibold text-slate-400">Siêu năng suất</Text>
      </View>
    </View>
  );
};
