import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, KeyRound } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useHouseholdMutations } from '../../src/modules/household/hooks';
import { TactileButton } from '../../src/ui/TactileButton';

export default function JoinRoomScreen() {
  const router = useRouter();
  const setActiveRoom = useAuthStore((s) => s.setActiveRoom);
  const [inviteCode, setInviteCode] = useState('');
  const { joinRoom } = useHouseholdMutations();

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('Mã mời không đúng', 'Mã mời phòng gồm đúng 6 ký tự viết hoa.');
      return;
    }

    try {
      const room = await joinRoom.mutateAsync(code);
      setActiveRoom({
        id: room.id,
        name: room.name,
        invite_code: room.invite_code,
        role: 'member',
      });
      Alert.alert('Tham gia thành công! 🎉', `Chào mừng bro đến với ${room.name}!`);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Không thể vào phòng', err.message || 'Mã mời không đúng hoặc phòng đã đầy.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6 justify-between">
      <View>
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl font-black text-slate-900">Nhập Mã Vào Phòng 🔑</Text>
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
          >
            <X size={18} color="#475569" />
          </Pressable>
        </View>

        <View className="w-16 h-16 rounded-3xl bg-amber-100 items-center justify-center mb-4">
          <KeyRound size={32} color="#D97706" />
        </View>

        <Text className="text-2xl font-black text-slate-900 mb-2">
          Nhập Mã Mời 6 Chữ Số
        </Text>
        <Text className="text-xs text-slate-500 mb-6 leading-relaxed">
          Xin mã mời từ Host hoặc bạn cùng phòng để gia nhập không gian việc nhà chung.
        </Text>

        <View className="mb-4">
          <Text className="text-xs font-bold text-slate-700 uppercase mb-2">Mã mời (6 ký tự)</Text>
          <TextInput
            className="w-full h-14 px-4 rounded-2xl border-2 border-slate-200 bg-slate-50 font-black text-2xl text-center text-slate-900 tracking-widest uppercase focus:border-[#6C4DFF] focus:bg-white"
            placeholder="ABC123"
            placeholderTextColor="#CBD5E1"
            maxLength={6}
            autoCapitalize="characters"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            autoFocus
          />
        </View>
      </View>

      <TactileButton
        title="Gia Nhập Phòng ⚡"
        variant="primary"
        size="lg"
        isLoading={joinRoom.isPending}
        onPress={handleJoin}
      />
    </SafeAreaView>
  );
}
