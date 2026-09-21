import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Crown, Plane, LogOut, Copy, Users } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../store/authStore';
import { useRoomMembers, useHouseholdMutations, useMyRooms } from '../../src/modules/household/hooks';
import { TrustBadge } from '../../src/ui/TrustBadge';
import { TactileButton } from '../../src/ui/TactileButton';
import { EmptyState } from '../../src/ui/EmptyState';

export default function RoomMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ roomId?: string }>();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);
  const setActiveRoom = useAuthStore((s) => s.setActiveRoom);

  // 1. Fetch user rooms as fallback
  const { data: myRooms = [], isLoading: isLoadingRooms, refetch: refetchRooms } = useMyRooms(user?.id);

  const currentRoom = activeRoom || (myRooms.length > 0 ? {
    id: myRooms[0].room.id,
    name: myRooms[0].room.name,
    invite_code: myRooms[0].room.invite_code,
    role: myRooms[0].role,
  } : null);

  const roomId = params.roomId || currentRoom?.id;

  // Sync activeRoom to store if not set yet
  useEffect(() => {
    if (!activeRoom && currentRoom) {
      setActiveRoom(currentRoom);
    }
  }, [activeRoom, currentRoom, setActiveRoom]);

  // 2. Query room members
  const { data: members = [], isLoading: isLoadingMembers, refetch: refetchMembers } = useRoomMembers(roomId);
  const { leaveRoom, setAwayMode, clearAwayMode } = useHouseholdMutations(roomId);

  const me = members.find((m) => m.member_id === user?.id);
  const isAway = me?.away_status === 'away';

  const handleToggleAway = async (value: boolean) => {
    if (!roomId) {
      Alert.alert('Chưa có phòng', 'Bro cần tham gia hoặc tạo phòng trước khi bật chế độ vắng nhà.');
      return;
    }

    try {
      if (value) {
        // Set away for 7 days
        const from = new Date().toISOString().slice(0, 10);
        const toDate = new Date(Date.now() + 7 * 86400 * 1000).toISOString().slice(0, 10);
        await setAwayMode.mutateAsync({ roomId, from, to: toDate });
        Alert.alert('Đã bật chế độ Vắng nhà ✈️', 'Trong thời gian này bạn sẽ không bị Auto-Assign việc và chỉ tiêu tuần sẽ được miễn giảm.');
      } else {
        await clearAwayMode.mutateAsync(roomId);
        Alert.alert('Đã trở lại nhà! 🏠', 'Chào mừng bro trở lại tiếp tục đồng hành cùng phòng.');
      }
      refetchMembers();
      refetchRooms();
    } catch (err: any) {
      Alert.alert('Lỗi thao tác', err.message || 'Không thể cập nhật trạng thái vắng nhà.');
    }
  };

  const handleCopyInviteCode = async () => {
    if (currentRoom?.invite_code) {
      await Clipboard.setStringAsync(currentRoom.invite_code);
      Alert.alert('Đã sao chép! 📋', `Mã mời phòng: ${currentRoom.invite_code}\nHãy gửi mã này cho bạn cùng phòng để cùng tham gia nhé!`);
    }
  };

  const handleLeaveRoom = () => {
    if (!roomId) {
      Alert.alert('Chưa có phòng', 'Bro chưa tham gia phòng nào.');
      return;
    }

    Alert.alert(
      'Rời phòng',
      'Bạn có chắc chắn muốn rời khỏi phòng này? Các việc nhà bạn đang nhận sẽ tự động được mở lại trên Bounty Board.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời phòng',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveRoom.mutateAsync({ roomId });
              setActiveRoom(null);
              Alert.alert('Đã rời phòng', 'Bro đã rời khỏi phòng.');
              router.replace('/(tabs)/home');
            } catch (err: any) {
              Alert.alert('Lỗi rời phòng', err.message || 'Không thể rời phòng.');
            }
          },
        },
      ]
    );
  };

  const isLoading = isLoadingRooms || (!!roomId && isLoadingMembers);

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
              {currentRoom?.name || 'Phòng chung'}
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Thành Viên Trong Nhà 👥
            </Text>
          </View>
        </View>

        {currentRoom?.invite_code && (
          <Pressable
            onPress={handleCopyInviteCode}
            className="flex-row items-center bg-[#EDE9FE] active:bg-[#DDD6FE] px-3 py-1.5 rounded-full border border-[#6C4DFF]/20"
          >
            <Copy size={13} color="#6C4DFF" />
            <Text className="text-xs font-black text-[#6C4DFF] ml-1.5 uppercase">
              {currentRoom.invite_code}
            </Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C4DFF" />
          <Text className="text-xs text-slate-400 mt-2">Đang tải danh sách thành viên...</Text>
        </View>
      ) : !roomId ? (
        <View className="flex-1 p-6 items-center justify-center">
          <EmptyState
            mood="sleeping"
            title="Chưa tham gia phòng nào"
            description="Bro chưa có phòng chung. Hãy tạo phòng mới hoặc xin mã mời từ bạn cùng phòng nhé!"
          />
          <View className="w-full mt-6 space-y-3">
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
          </View>
        </View>
      ) : (
        <View className="flex-1 p-5">
          {/* Away mode toggle for myself */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-5 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center mb-1">
                <Plane size={18} color="#6C4DFF" />
                <Text className="text-sm font-black text-slate-900 ml-1.5">
                  Chế độ Vắng nhà (Away Mode)
                </Text>
              </View>
              <Text className="text-xs text-slate-500 leading-relaxed">
                Bật khi về quê hoặc bận thi cử để tạm dừng chỉ tiêu tuần và tránh bị Auto-Assign việc.
              </Text>
            </View>
            <Switch
              value={isAway}
              onValueChange={handleToggleAway}
              trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
              thumbColor={isAway ? '#6C4DFF' : '#F1F5F9'}
            />
          </View>

          {/* Member list */}
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Danh sách ({members.length} thành viên)
          </Text>

          <FlatList
            data={members}
            keyExtractor={(item) => item.member_id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isHost = item.role === 'host';
              const isMemberAway = item.away_status === 'away';
              const isMe = item.member_id === user?.id;

              return (
                <View className="flex-row items-center justify-between bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-12 h-12 rounded-2xl bg-[#EDE9FE] items-center justify-center mr-3 border border-[#6C4DFF]/20">
                      <Text className="text-xl">😎</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-extrabold text-slate-900 mr-2" numberOfLines={1}>
                          {item.profile?.display_name || 'Bro'} {isMe && '(Tôi)'}
                        </Text>
                        {isHost && (
                          <View className="bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex-row items-center">
                            <Crown size={10} color="#B45309" />
                            <Text className="text-[10px] font-black text-amber-800 ml-1">Host</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center mt-1">
                        {isMemberAway ? (
                          <View className="bg-purple-100 px-2 py-0.5 rounded-full mr-2">
                            <Text className="text-[10px] font-bold text-purple-700">Đang vắng nhà ✈️</Text>
                          </View>
                        ) : (
                          <TrustBadge score={85} level="gold" size="sm" />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* Leave Room Button */}
          <View className="mt-2 mb-4">
            <TactileButton
              title="Rời Khỏi Phòng Này"
              variant="outline"
              size="md"
              leftIcon={<LogOut size={16} color="#DC2626" />}
              onPress={handleLeaveRoom}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
