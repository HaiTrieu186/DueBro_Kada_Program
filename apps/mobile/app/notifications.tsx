import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, Sparkles, AlertCircle, MessageSquare } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useMyNotifications } from '../src/modules/notifications/hooks';
import { EmptyState } from '../src/ui/EmptyState';

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: notifications = [], isLoading, refetch, isRefetching } = useMyNotifications(user?.id);

  const getNotificationIcon = (kind: string, level?: string | null) => {
    if (level === 'sarcastic' || level === 'sos') return '🚨';
    if (kind === 'match') return '🎉';
    if (kind === 'nudge') return '🤖';
    return '🔔';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-3 active:bg-slate-200"
          >
            <ChevronLeft size={20} color="#334155" />
          </Pressable>
          <View>
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Trung Tâm Tin Báo
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Thông Báo Cá Nhân 🔔
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF5722" />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (item.task_id) {
                router.push(`/task/${item.task_id}` as any);
              }
            }}
            className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex-row items-start active:bg-slate-50"
          >
            <View className="w-10 h-10 rounded-2xl bg-orange-100 items-center justify-center mr-3.5 mt-0.5">
              <Text className="text-lg">{getNotificationIcon(item.kind, item.level)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">
                  {item.is_llm ? '✨ Lời nhắc từ Bro' : 'Hệ thống'}
                </Text>
                <Text className="text-[10px] text-slate-400">
                  {new Date(item.sent_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text className="text-sm font-bold text-slate-800 leading-snug">
                {item.message}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              mood="happy"
              title="Không có thông báo mới"
              description="Hộp thư thông báo của bro đang hoàn toàn sạch sẽ."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
