import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Copy, Sparkles, Plus, Trophy } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import {
  useMyRooms,
  useOpenTasks,
  useMyTasks,
  usePendingReviewTasks,
  useWeekBoard,
  useKarmaBalance,
  useHouseholdRealtime,
  useHouseholdMutations,
} from '../../src/modules/household/hooks';
import { TaskCard } from '../../src/ui/TaskCard';
import { BroPeekingMascot, type BroMood } from '../../src/ui/BroPeekingMascot';
import { EmptyState } from '../../src/ui/EmptyState';
import { TactileButton } from '../../src/ui/TactileButton';

type TabFilter = 'bounty' | 'mine' | 'review';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const activeRoom = useAuthStore((s) => s.activeRoom);
  const setActiveRoom = useAuthStore((s) => s.setActiveRoom);

  const [activeTab, setActiveTab] = useState<TabFilter>('bounty');

  // 1. Fetch user's room
  const { data: myRooms = [], isLoading: isLoadingRooms, refetch: refetchRooms } = useMyRooms(user?.id);

  // Sync active room if not set
  const currentRoom = activeRoom || (myRooms.length > 0 ? {
    id: myRooms[0].room.id,
    name: myRooms[0].room.name,
    invite_code: myRooms[0].room.invite_code,
    role: myRooms[0].role,
  } : null);

  const roomId = currentRoom?.id;

  // 2. Realtime listener
  useHouseholdRealtime(roomId);

  // 3. Household Queries
  const { data: openTasks = [], isLoading: isLoadingOpen, refetch: refetchOpen } = useOpenTasks(roomId);
  const { data: myTasks = [], isLoading: isLoadingMine, refetch: refetchMine } = useMyTasks(roomId, user?.id);
  const { data: reviewTasks = [], isLoading: isLoadingReview, refetch: refetchReview } = usePendingReviewTasks(roomId, user?.id);
  const { data: weekBoard = [] } = useWeekBoard(roomId);
  const { data: karmaBalance = 0 } = useKarmaBalance(user?.id);

  // 4. Mutations
  const { claimTask } = useHouseholdMutations(roomId);

  const handleClaim = async (taskId: string) => {
    try {
      await claimTask.mutateAsync(taskId);
      Alert.alert('Nhận việc thành công! ⚡', 'Bạn nhận việc tự nguyện (+10% điểm Effort). Chúc bro hoàn thành xuất sắc!');
    } catch (err: any) {
      Alert.alert('Không thể nhận việc', err.message || 'Lỗi hệ thống.');
    }
  };

  const handleCopyCode = () => {
    if (currentRoom?.invite_code) {
      Clipboard.setString(currentRoom.invite_code);
      Alert.alert('Đã sao chép mã!', `Mã mời phòng: ${currentRoom.invite_code}`);
    }
  };

  // Quota calculation
  const myQuota = weekBoard.find((w) => w.member_id === user?.id);
  const achieved = myQuota?.achieved_points ?? 0;
  const target = myQuota?.target_points ?? 60;
  const quotaPct = Math.min(100, Math.round((achieved / target) * 100));

  // Determine Mascot Mood
  let mascotMood: BroMood = 'idle';
  if (reviewTasks.length > 0) mascotMood = 'happy';
  if (myTasks.some((t) => new Date(t.due_at).getTime() < Date.now())) mascotMood = 'sarcastic';

  // No room state (ARCH Mục 11.1 & 15.3)
  if (!isLoadingRooms && (!currentRoom || myRooms.length === 0)) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-between p-6">
        <View className="items-center mt-6">
          <View className="w-16 h-16 rounded-3xl bg-[#FF5722] items-center justify-center shadow-lg shadow-orange-300 mb-3">
            <Text className="text-3xl">🏠</Text>
          </View>
          <Text className="text-2xl font-black text-slate-900">
            Chưa Tham Gia Phòng
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-1 max-w-[280px]">
            Tạo phòng với bạn thân hoặc nhập mã mời để cùng quản lý việc nhà ngay.
          </Text>
        </View>

        <BroPeekingMascot
          mood="happy"
          speechText="Chưa có phòng hả bro? Tạo ngay một phòng hoặc lướt tab Khám phá tìm bạn cùng thuê nhé!"
        />

        <View className="space-y-3 mb-4">
          <TactileButton
            title="Tạo Phòng Mới 🏠"
            variant="primary"
            size="lg"
            onPress={() => router.push('/room/create')}
          />
          <TactileButton
            title="Nhập Mã Mời Phòng 🔑"
            variant="outline"
            size="md"
            onPress={() => router.push('/room/join')}
          />
          <TactileButton
            title="Tìm Bạn Ở Ghép 🔍"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/discover')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Active tasks based on tab
  const displayTasks =
    activeTab === 'bounty' ? openTasks : activeTab === 'mine' ? myTasks : reviewTasks;
  const isListLoading =
    activeTab === 'bounty' ? isLoadingOpen : activeTab === 'mine' ? isLoadingMine : isLoadingReview;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Bar */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-slate-200/80 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Phòng đang ở
            </Text>
            <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
              {currentRoom?.name || 'Due Bro Hub'} 🏠
            </Text>
          </View>

          {/* Right Header Actions */}
          <View className="flex-row items-center space-x-2">
            {/* Copy Invite Code Pill */}
            <Pressable
              onPress={handleCopyCode}
              className="flex-row items-center bg-slate-100 active:bg-slate-200 px-2.5 py-1.5 rounded-full mr-2"
            >
              <Text className="text-[11px] font-black text-slate-700 mr-1">
                {currentRoom?.invite_code}
              </Text>
              <Copy size={12} color="#64748B" />
            </Pressable>

            {/* Karma Balance Pill */}
            <Pressable
              onPress={() => router.push('/karma')}
              className="flex-row items-center bg-orange-100 active:bg-orange-200 px-2.5 py-1.5 rounded-full mr-2"
            >
              <Text className="text-[11px] font-black text-[#FF5722]">
                💎 {karmaBalance}
              </Text>
            </Pressable>

            {/* Room Members Link */}
            <Pressable
              onPress={() => router.push('/room/members')}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <Users size={16} color="#475569" />
            </Pressable>
          </View>
        </View>

        {/* Mascot Peeking */}
        <BroPeekingMascot mood={mascotMood} />

        {/* Weekly Quota Bar */}
        <Pressable
          onPress={() => router.push('/scoreboard')}
          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 mt-1 active:bg-slate-100/80"
        >
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center">
              <Trophy size={14} color="#FF5722" />
              <Text className="text-xs font-bold text-slate-700 ml-1">
                Tiến độ tuần của tôi
              </Text>
            </View>
            <Text className="text-xs font-black text-[#FF5722]">
              {achieved} / {target} Effort ({quotaPct}%)
            </Text>
          </View>
          <View className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#FF5722] rounded-full"
              style={{ width: `${quotaPct}%` }}
            />
          </View>
        </Pressable>

        {/* Status Tab Filters (ui-example Image 5) */}
        <View className="flex-row items-center justify-between mt-3 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'bounty', label: `Săn việc (${openTasks.length})` },
            { id: 'mine', label: `Của tôi (${myTasks.length})` },
            { id: 'review', label: `Chờ duyệt (${reviewTasks.length})` },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabFilter)}
                className={`flex-1 py-2 rounded-xl items-center ${
                  isSelected ? 'bg-white shadow-sm' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-black ${
                    isSelected ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={displayTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isListLoading}
            onRefresh={() => {
              refetchRooms();
              refetchOpen();
              refetchMine();
              refetchReview();
            }}
            tintColor="#FF5722"
          />
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push(`/task/${item.id}` as any)}
            onClaim={() => handleClaim(item.id)}
            isClaiming={claimTask.isPending}
            isMine={item.claimed_by === user?.id}
          />
        )}
        ListEmptyComponent={
          !isListLoading ? (
            <EmptyState
              mood="happy"
              title={
                activeTab === 'bounty'
                  ? 'Nhà sạch bong rồi bro!'
                  : activeTab === 'mine'
                  ? 'Chưa có việc nào đang làm'
                  : 'Không có việc nào chờ duyệt'
              }
              description={
                activeTab === 'bounty'
                  ? 'Bảng săn việc đang trống. Bro có thể tạo việc mới hoặc nghỉ ngơi thư giãn.'
                  : activeTab === 'mine'
                  ? 'Mau qua tab Săn việc để nhận việc và kiếm thêm điểm Effort nhé!'
                  : 'Mọi việc nhà đã hoàn thành đều đã được duyệt xong xuôi.'
              }
              actionTitle={activeTab === 'bounty' ? 'Tạo việc mới ➕' : 'Săn việc ngay ⚡'}
              onAction={() =>
                activeTab === 'bounty' ? router.push('/task/create') : setActiveTab('bounty')
              }
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
