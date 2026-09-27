import React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy, Medal } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useWeekBoard, useRoomMembers, useMyRooms } from '../src/modules/household/hooks';

export default function ScoreboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);
  const { data: myRooms = [] } = useMyRooms(user?.id);
  const roomId = activeRoom?.id || myRooms[0]?.room?.id;

  const { data: weekBoard = [], isLoading, refetch, isRefetching } = useWeekBoard(roomId);
  const { data: members = [] } = useRoomMembers(roomId);

  const memberProfileMap = new Map(members.map((m) => [m.member_id, m.profile]));

  // Sort by achieved_points desc
  const sortedBoard = [...weekBoard].sort((a, b) => b.achieved_points - a.achieved_points);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
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
              {activeRoom?.name || 'Phòng 402'}
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Bảng Xếp Hạng Tuần 🏆
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sortedBoard}
        keyExtractor={(item) => item.member_id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C4DFF" />
        }
        renderItem={({ item, index }) => {
          const profile = memberProfileMap.get(item.member_id);
          const isMe = item.member_id === user?.id;
          const target = item.target_points || 60;
          const pct = Math.min(100, Math.round((item.achieved_points / target) * 100));

          const medal =
            index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

          return (
            <View
              className={`p-4 rounded-2xl mb-3 border ${
                isMe
                  ? 'bg-[#EDE9FE]/50 border-[#6C4DFF]/40'
                  : 'bg-white border-slate-100'
              } shadow-sm`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <Text className="text-xl mr-3 font-black">{medal}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
                      {profile?.display_name || 'Bro'} {isMe && '(Tôi)'}
                    </Text>
                    <Text className="text-xs text-slate-400">
                      Mục tiêu tuần: {target} Effort
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-base font-black text-[#6C4DFF]">
                    {item.achieved_points}đ
                  </Text>
                  <Text className="text-[10px] font-bold text-slate-400">
                    {pct}% chỉ tiêu
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className={`h-full rounded-full ${
                    pct >= 100 ? 'bg-emerald-500' : 'bg-[#6C4DFF]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center p-8 my-auto">
              <Trophy size={36} color="#CBD5E1" />
              <Text className="text-sm font-bold text-slate-700 mt-2">
                Chưa có dữ liệu tuần này
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                Các bạn trong phòng hãy tích cực nhận việc nhà để ghi điểm tuần nhé!
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
