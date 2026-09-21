import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Home } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useHouseholdMutations } from '../../src/modules/household/hooks';
import { TactileButton } from '../../src/ui/TactileButton';

export default function CreateRoomScreen() {
  const router = useRouter();
  const setActiveRoom = useAuthStore((s) => s.setActiveRoom);
  const [roomName, setRoomName] = useState('');
  const { createRoom } = useHouseholdMutations();

  const handleCreate = async () => {
    if (!roomName.trim()) {
      Alert.alert('Thiếu tên phòng', 'Bro vui lòng đặt tên cho ngôi nhà của mình nhé!');
      return;
    }

    try {
      const room = await createRoom.mutateAsync(roomName.trim());
      setActiveRoom({
        id: room.id,
        name: room.name,
        invite_code: room.invite_code,
        role: 'host',
      });
      Alert.alert('Tạo phòng thành công! 🎉', `Mã mời phòng của bro là: ${room.invite_code}. Giờ hãy chọn bộ việc mẫu nhé!`);
      router.replace('/templates');
    } catch (err: any) {
      Alert.alert('Lỗi tạo phòng', err.message || 'Không thể tạo phòng.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6 justify-between">
      <View>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-black text-slate-900">Tạo Phòng Mới 🏠</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
          >
            <X size={18} color="#475569" />
          </Pressable>
        </View>

        <View className="w-16 h-16 rounded-3xl bg-orange-100 items-center justify-center mb-4">
          <Home size={32} color="#FF5722" />
        </View>

        <Text className="text-2xl font-black text-slate-900 mb-2">
          Đặt Tên Ngôi Nhà Chung
        </Text>
        <Text className="text-xs text-slate-500 mb-6 leading-relaxed">
          Tên phòng sẽ hiển thị cho tất cả thành viên trong nhà. Bạn sẽ là Host của phòng này.
        </Text>

        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-700 uppercase mb-2">Tên phòng</Text>
          <TextInput
            className="w-full h-13 px-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-base"
            placeholder="VD: Phòng 402 Homies"
            value={roomName}
            onChangeText={setRoomName}
            autoFocus
          />
        </View>
      </View>

      <TactileButton
        title="Tạo Phòng Ngay 🚀"
        variant="primary"
        size="lg"
        isLoading={createRoom.isPending}
        onPress={handleCreate}
      />
    </SafeAreaView>
  );
}
