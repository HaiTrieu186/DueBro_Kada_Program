import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, api } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../components/ui/TactileButton';
import { CategoryBadge, EffortBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import type { TaskInstance } from '@duebro/shared-types';

export default function MyTasksScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [proofModalTask, setProofModalTask] = useState<TaskInstance | null>(null);
  const [proofUrl, setProofUrl] = useState('https://images.unsplash.com/photo-1581578731548-c64695cc6952');

  const [sosModalTask, setSosModalTask] = useState<TaskInstance | null>(null);
  const [sosBonusPoints, setSosBonusPoints] = useState('5');
  const [sosMessage, setSosMessage] = useState('Mai mình thi giữa kỳ, nhờ bro cứu giúp việc này!');

  // 1. Fetch user's assigned tasks
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<TaskInstance[]>({
    queryKey: ['my_tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_instances')
        .select('*')
        .eq('claimed_by', user?.id ?? '')
        .order('due_at', { ascending: true });


      if (error) throw error;
      return (data as TaskInstance[]) || [];
    },
    enabled: !!user?.id,
  });

  // 2. Submit proof mutation
  const submitProofMutation = useMutation({
    mutationFn: async ({ taskId, url }: { taskId: string; url: string }) => {
      return api.submitProof(taskId, url);
    },
    onSuccess: () => {
      Alert.alert('Nộp bằng chứng thành công! 📸', 'Ảnh đã được gửi để các bạn cùng phòng duyệt.');
      setProofModalTask(null);
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    },
    onError: (err: any) => {
      Alert.alert('Không thể nộp bằng chứng', err.message || 'Lỗi hệ thống.');
    },
  });

  // 3. SOS Swap mutation
  const sosMutation = useMutation({
    mutationFn: async ({ taskId, bonus, msg }: { taskId: string; bonus: number; msg: string }) => {
      // In production, target user can be null or open to whole room
      return api.createSosSwap(taskId, user?.id ?? '', bonus, msg);
    },
    onSuccess: () => {
      Alert.alert('Đã gửi SOS Cứu Hộ! 🚨', 'Yêu cầu đổi việc kèm điểm thưởng đã được phát cho cả phòng.');
      setSosModalTask(null);
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    },
    onError: (err: any) => {
      Alert.alert('Không thể gửi SOS', err.message || 'Lỗi hệ thống.');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Theo Dõi Việc Cá Nhân
        </Text>
        <Text className="text-xl font-black text-slate-900">
          Việc Của Tôi 📝
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#FF5722" />
          <Text className="text-xs font-medium text-slate-400 mt-3">
            Đang tải danh sách việc của bạn...
          </Text>
        </View>
      ) : isError ? (
        <ErrorState
          title="Không thể tải việc cá nhân"
          message={(error as any)?.message}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          state="happy"
          title="Bạn Đã Hoàn Thành Hết Việc! 🎉"
          description="Không còn việc nào đang nợ. Bạn có thể sang tab 'Việc Nhà' để nhận thêm việc và tích điểm Karma."
          actionTitle="Kiểm tra lại"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const isSubmitted = item.status === 'pending_approval' || (item.status as string) === 'submitted';
            const isCompleted = item.status === 'completed';

            return (
              <View className="bg-white p-5 rounded-2xl border border-slate-200 mb-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <CategoryBadge category={item.category} />
                  <EffortBadge points={item.effort_points} />
                </View>

                <Text className="text-base font-bold text-slate-900 mb-1">
                  {item.title}
                </Text>

                <Text className="text-xs text-slate-500 mb-3">
                  ⏰ Hạn chót:{' '}
                  {new Date(item.due_at || (item as any).due_date).toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>


                {/* Status Indicator */}
                <View className="mb-4">
                  {isSubmitted && (
                    <View className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <Text className="text-xs font-bold text-amber-800">
                        ⏳ Đang chờ người trong phòng xác nhận hoàn thành
                      </Text>
                    </View>
                  )}
                  {isCompleted && (
                    <View className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <Text className="text-xs font-bold text-emerald-800">
                        ✅ Đã hoàn thành và được cộng điểm!
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions for in_progress tasks */}
                {!isSubmitted && !isCompleted && (
                  <View className="flex-row space-x-2 pt-3 border-t border-slate-100">
                    <View className="flex-1">
                      <TactileButton
                        title="🆘 SOS Đổi việc"
                        variant="outline"
                        size="sm"
                        onPress={() => setSosModalTask(item)}
                      />
                    </View>
                    <View className="flex-1">
                      <TactileButton
                        title="📷 Nộp ảnh"
                        variant="primary"
                        size="sm"
                        onPress={() => setProofModalTask(item)}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Proof Submission Modal */}
      <Modal visible={!!proofModalTask} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-6 rounded-t-3xl border-t border-slate-200">
            <Text className="text-xl font-bold text-slate-900 mb-1">
              Nộp Bằng Chứng Hoàn Thành 📸
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              {proofModalTask?.title}
            </Text>

            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              URL Ảnh Bằng Chứng (Mockup)
            </Text>
            <TextInput
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium mb-6"
              value={proofUrl}
              onChangeText={setProofUrl}
            />

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <TactileButton
                  title="Hủy"
                  variant="outline"
                  size="md"
                  onPress={() => setProofModalTask(null)}
                />
              </View>
              <View className="flex-1">
                <TactileButton
                  title="Gửi xác nhận"
                  variant="primary"
                  size="md"
                  isLoading={submitProofMutation.isPending}
                  onPress={() => {
                    if (proofModalTask) {
                      submitProofMutation.mutate({
                        taskId: proofModalTask.id,
                        url: proofUrl,
                      });
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* SOS Swap Modal */}
      <Modal visible={!!sosModalTask} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white p-6 rounded-t-3xl border-t border-slate-200">
            <Text className="text-xl font-bold text-slate-900 mb-1">
              Phát Tín Hiệu SOS Đổi Việc 🚨
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Nhờ bạn cùng phòng gánh việc với điểm thưởng Karma (ARCH Mục 7.3).
            </Text>

            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Điểm thưởng trích từ ví bạn (Karma)
            </Text>
            <TextInput
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium mb-4"
              keyboardType="numeric"
              value={sosBonusPoints}
              onChangeText={setSosBonusPoints}
            />

            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lời nhắn gửi roommate
            </Text>
            <TextInput
              className="w-full h-16 p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium mb-6"
              multiline
              value={sosMessage}
              onChangeText={setSosMessage}
            />

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <TactileButton
                  title="Hủy"
                  variant="outline"
                  size="md"
                  onPress={() => setSosModalTask(null)}
                />
              </View>
              <View className="flex-1">
                <TactileButton
                  title="Phát SOS 🚨"
                  variant="primary"
                  size="md"
                  isLoading={sosMutation.isPending}
                  onPress={() => {
                    if (sosModalTask) {
                      sosMutation.mutate({
                        taskId: sosModalTask.id,
                        bonus: parseInt(sosBonusPoints, 10) || 5,
                        msg: sosMessage,
                      });
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
