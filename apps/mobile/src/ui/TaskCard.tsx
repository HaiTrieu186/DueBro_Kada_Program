import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Clock, Camera, User, CheckCircle2 } from 'lucide-react-native';
import { CategoryBadge, EffortBadge, StatusBadge } from './Badge';
import { getRemainingTime } from '../lib/time';
import type { TaskInstance } from '@duebro/shared-types';

interface TaskCardProps {
  task: TaskInstance;
  onPress: () => void;
  onClaim?: () => void;
  isClaiming?: boolean;
  isMine?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onClaim,
  isClaiming = false,
  isMine = false,
}) => {
  const timeInfo = getRemainingTime(task.due_at);
  const isOpen = task.status === 'open';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 border border-slate-100/90 shadow-sm active:bg-slate-50/80"
      accessibilityRole="button"
    >
      {/* Top row: Badges & Countdown */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-wrap gap-1.5 flex-1 mr-2">
          <CategoryBadge category={task.category} size="sm" />
          <EffortBadge points={task.effort_points} bonus={isOpen} size="sm" />
        </View>

        {/* Remaining Time Badge */}
        <View
          className={`flex-row items-center px-2 py-0.5 rounded-full ${
            timeInfo.isOverdue ? 'bg-red-50' : 'bg-slate-100'
          }`}
        >
          <Clock size={11} color={timeInfo.isOverdue ? '#DC2626' : '#64748B'} />
          <Text
            className={`text-[11px] font-bold ml-1 ${
              timeInfo.isOverdue ? 'text-red-600' : 'text-slate-600'
            }`}
          >
            {timeInfo.label}
          </Text>
        </View>
      </View>

      {/* Task Title */}
      <Text className="text-base font-black text-slate-900 mt-2.5 mb-1 leading-snug">
        {task.title}
      </Text>

      {/* Meta details */}
      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <View className="flex-row items-center space-x-2">
          {task.requires_photo ? (
            <View className="flex-row items-center bg-violet-50 px-2 py-0.5 rounded-md mr-2">
              <Camera size={11} color="#6366F1" />
              <Text className="text-[10px] font-bold text-indigo-700 ml-1">Cần ảnh</Text>
            </View>
          ) : null}

          <StatusBadge status={task.status} size="sm" />
        </View>

        {/* Quick action or Assignee */}
        {isOpen && onClaim ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            disabled={isClaiming}
            className="bg-[#6C4DFF] active:bg-[#5B3CE6] px-3.5 py-1.5 rounded-xl flex-row items-center shadow-sm"
          >
            <Text className="text-xs font-black text-white">
              {isClaiming ? 'Đang nhận...' : 'Nhận việc ⚡'}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center">
            {task.status === 'completed' ? (
              <CheckCircle2 size={16} color="#10B981" />
            ) : (
              <View className="flex-row items-center">
                <User size={13} color="#94A3B8" />
                <Text className="text-xs font-semibold text-slate-500 ml-1">
                  {isMine ? 'Tôi' : 'Bạn cùng phòng'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};
