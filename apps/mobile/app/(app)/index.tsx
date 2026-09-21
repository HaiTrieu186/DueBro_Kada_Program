import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, api } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../components/ui/TactileButton';
import { CategoryBadge, EffortBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import type { TaskCategory, TaskInstance } from '@duebro/shared-types';

const CATEGORIES: { id: string; label: string; value: TaskCategory | 'all' }[] = [
  { id: '1', label: 'Tất cả', value: 'all' },
  { id: '2', label: 'Dọn dẹp', value: 'cleaning' },
  { id: '3', label: 'Đổ rác', value: 'trash' },
  { id: '4', label: 'Bếp núc', value: 'kitchen' },
  { id: '5', label: 'Mua sắm', value: 'shopping' },
];

export default function BountyBoardScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');

  // 1. Fetch open tasks in the user's room
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<TaskInstance[]>({
    queryKey: ['bounty_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_instances')
        .select('*')
        .eq('status', 'open')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data as TaskInstance[]) || [];
    },
  });

  // 2. Setup Realtime subscription on task_instances (ARCH Mục 9.1)
  useEffect(() => {
    const channel = supabase
      .channel('bounty_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_instances' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bounty_tasks'] });
          queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 3. Claim task mutation
  const claimMutation = useMutation({
    mutationFn: (taskId: string) => api.claimTask(taskId),
    onSuccess: () => {
      Alert.alert('Nhận việc thành công! 🎉', 'Bạn đã nhận việc tự nguyện (+10% điểm). Mau hoàn thành đúng hạn nhé bro!');
      queryClient.invalidateQueries({ queryKey: ['bounty_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    },
    onError: (err: any) => {
      Alert.alert('Không thể nhận việc', err.message || 'Có lỗi xảy ra, thử lại sau.');
    },
  });

  const filteredTasks = selectedCategory === 'all'
    ? tasks
    : tasks.filter((t) => t.category === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header bar */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Bảng Săn Việc Nhà (Bounty Board)
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Phòng 402 — Due Bro Hub 🏠
            </Text>
          </View>
          <View className="items-end">
            <View className="px-2.5 py-1 rounded-full bg-orange-100 flex-row items-center">
              <Text className="text-xs font-black text-[#FF5722]">
                💎 {profile?.karma_balance ?? 120} Karma
              </Text>
            </View>
          </View>
        </View>

        {/* Category filter tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          className="mt-2 -mx-2"
          contentContainerStyle={{ paddingHorizontal: 8 }}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.value;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item.value)}
                className={`px-3 py-1.5 rounded-full mr-2 border ${
                  isActive
                    ? 'bg-[#FF5722] border-[#FF5722]'
                    : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#FF5722" />
          <Text className="text-xs font-medium text-slate-400 mt-3">
            Đang tải bảng việc mở...
          </Text>
        </View>
      ) : isError ? (
        <ErrorState
          title="Không thể tải bảng việc"
          message={(error as any)?.message}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          state="happy"
          title="Phòng Sạch Tinh Tươm!"
          description="Hiện không còn việc nhà nào đang mở. Tận hưởng không gian sống cực chill cùng anh em nhé!"
          actionTitle="Làm mới bảng tin"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FF5722"
            />
          }
          renderItem={({ item }) => (
            <View className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <CategoryBadge category={item.category} />
                <EffortBadge
                  points={Math.round(item.effort_points * 1.1)}
                  bonus={true}
                />
              </View>

              <Text className="text-base font-bold text-slate-900 mb-1">
                {item.title}
              </Text>
              <Text className="text-xs text-slate-500 mb-4">
                ⏰ Hạn chót: {new Date(item.due_date).toLocaleDateString('vi-VN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                <View className="flex-row items-center">
                  <Text className="text-xs font-medium text-slate-400">
                    {item.requires_photo ? '📷 Yêu cầu chụp ảnh' : '✨ Không cần ảnh'}
                  </Text>
                </View>
                <TactileButton
                  title="Nhận việc ⚡ (+10%)"
                  variant="primary"
                  size="sm"
                  isLoading={claimMutation.isPending && claimMutation.variables === item.id}
                  onPress={() => claimMutation.mutate(item.id)}
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
