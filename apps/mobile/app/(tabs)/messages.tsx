import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, ChevronRight, Home } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useConnections } from '../../src/modules/chat/hooks';
import { EmptyState } from '../../src/ui/EmptyState';

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: connections = [], isLoading, refetch, isRefetching } = useConnections(user?.id);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80">
        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Hộp Thư Kết Nối
        </Text>
        <Text className="text-xl font-black text-slate-900">
          Tin Nhắn Roommate 💬
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C4DFF" />
        }
        renderItem={({ item }) => {
          const isProposed = item.status === 'room_proposed';
          const isHoused = item.status === 'housed';

          return (
            <Pressable
              onPress={() => router.push(`/chat/${item.id}` as any)}
              className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm active:bg-slate-50"
            >
              {/* Avatar */}
              <View className="rounded-2xl bg-[#EDE9FE] items-center justify-center mr-3.5 border border-[#6C4DFF]/20" style={{ width: 50, height: 50 }}>
                <Text className="text-2xl">😎</Text>
              </View>

              {/* Text Info */}
              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-extrabold text-slate-900">
                    {item.otherUser?.display_name || 'Roommate Bro'}
                  </Text>
                  {isProposed && (
                    <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-amber-800">Đã đề xuất phòng 🏠</Text>
                    </View>
                  )}
                  {isHoused && (
                    <View className="bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] font-bold text-emerald-800">Đang cùng phòng ✨</Text>
                    </View>
                  )}
                </View>

                <Text className="text-xs text-slate-400" numberOfLines={1}>
                  {isProposed
                    ? `Đề xuất tạo phòng "${item.proposed_room_name || 'Nhà chung'}"`
                    : 'Chạm để trò chuyện và bàn chuyện ở ghép...'}
                </Text>
              </View>

              <ChevronRight size={18} color="#94A3B8" className="ml-2" />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              mood="happy"
              title="Chưa có tin nhắn nào"
              description="Khi bro và bạn khác cùng 'Thích' nhau ở tab Khám phá, cuộc trò chuyện sẽ tự động xuất hiện tại đây."
              actionTitle="Khám phá ngay 🔍"
              onAction={() => router.push('/(tabs)/discover')}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
