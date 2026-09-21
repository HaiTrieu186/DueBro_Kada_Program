import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBag, Sparkles, Shield, Gift } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useKarmaBalance, useHouseholdMutations, useMyRooms } from '../src/modules/household/hooks';
import { TactileButton } from '../src/ui/TactileButton';

export default function KarmaScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);
  const { data: myRooms = [] } = useMyRooms(user?.id);
  const roomId = activeRoom?.id || myRooms[0]?.room?.id;

  const { data: karmaBalance = 0, refetch } = useKarmaBalance(user?.id);
  const { redeemKarma } = useHouseholdMutations(roomId);

  const handleRedeemSkip = async () => {
    if (!roomId) {
      Alert.alert('Chưa có phòng', 'Bro cần tham gia phòng để đổi thưởng.');
      return;
    }

    if (karmaBalance < 30) {
      Alert.alert('Chưa đủ Karma', 'Bro cần tối thiểu 30 điểm Karma để đổi vé miễn việc này.');
      return;
    }

    Alert.alert(
      'Đổi Vé Miễn Việc Tự Giao 🎟️',
      'Chi 30 Karma để tự động bỏ qua 1 lần Auto-Assign kế tiếp. Bro có chắc chắn không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đổi ngay (-30 Karma)',
          onPress: async () => {
            try {
              await redeemKarma.mutateAsync({ roomId, rewardType: 'skip_next_task' });
              Alert.alert('Đổi thưởng thành công! 🎉', 'Vé miễn việc kế tiếp đã được lưu vào hồ sơ của bro.');
              refetch();
            } catch (err: any) {
              Alert.alert('Lỗi đổi thưởng', err.message);
            }
          },
        },
      ]
    );
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
              Điểm Tích Lũy Vĩnh Viễn
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Ví Karma & Đổi Thưởng 💎
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Karma Card */}
        <View className="bg-gradient-to-br bg-[#FF5722] rounded-3xl p-6 shadow-md mb-5 text-white">
          <Text className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
            Tổng số dư khả dụng
          </Text>
          <Text className="text-4xl font-black text-white mb-2">
            💎 {karmaBalance} Karma
          </Text>
          <Text className="text-xs text-white/90 leading-relaxed">
            Karma là điểm tích lũy vĩnh viễn (0.2 × Effort mỗi việc hoàn thành). Không bao giờ mất đi khi đổi tuần hay chuyển trọ.
          </Text>
        </View>

        {/* Karma Shop Items */}
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Cửa Hàng Karma (Karma Shop)
        </Text>

        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-12 h-12 rounded-2xl bg-amber-100 items-center justify-center mr-3">
                <Gift size={24} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-extrabold text-slate-900">
                  Vé Bỏ Qua Việc Tự Giao 🎟️
                </Text>
                <Text className="text-xs text-slate-400">
                  Hệ thống Auto-Assign sẽ bỏ qua bro 1 lần
                </Text>
              </View>
            </View>
            <View className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-black text-[#FF5722]">30 Karma</Text>
            </View>
          </View>

          <TactileButton
            title="Đổi Thưởng Ngay"
            variant="primary"
            size="md"
            disabled={karmaBalance < 30}
            isLoading={redeemKarma.isPending}
            onPress={handleRedeemSkip}
          />
        </View>

        {/* Karma Rules Explained */}
        <View className="bg-slate-100/80 rounded-3xl p-5 border border-slate-200/80">
          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color="#FF5722" />
            <Text className="text-xs font-black text-slate-800 ml-1.5 uppercase">
              Cách Kiếm Thêm Karma
            </Text>
          </View>
          <Text className="text-xs text-slate-600 mb-1.5">
            • Hoàn thành việc nhà: +20% điểm Effort của việc vào Karma.
          </Text>
          <Text className="text-xs text-slate-600 mb-1.5">
            • Ra tay cứu hộ SOS bạn cùng phòng: Nhận thêm thưởng Karma.
          </Text>
          <Text className="text-xs text-slate-600">
            • Không đổi trễ hạn để tránh bị trừ điểm phạt.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
