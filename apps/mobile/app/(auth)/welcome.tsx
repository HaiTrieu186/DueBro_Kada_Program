import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TactileButton } from '../../src/ui/TactileButton';
import { BroPeekingMascot } from '../../src/ui/BroPeekingMascot';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white justify-between px-6 py-8">
      {/* Top Brand Area */}
      <View className="items-center mt-6">
        <View className="w-16 h-16 rounded-3xl bg-[#FF5722] items-center justify-center shadow-lg shadow-orange-300/50 mb-3">
          <Text className="text-3xl">🏠</Text>
        </View>
        <Text className="text-3xl font-black text-slate-900 tracking-tight">
          Due <Text className="text-[#FF5722]">Bro</Text>
        </Text>
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Household OS & Roommate Matching
        </Text>
      </View>

      {/* Mascot Hero Center */}
      <View className="items-center my-auto py-6">
        <BroPeekingMascot
          mood="happy"
          speechText="Ở ghép văn minh, không lo chia việc! Bro bao hết!"
        />

        <View className="mt-8 px-4 items-center">
          <Text className="text-2xl font-black text-slate-900 text-center leading-tight">
            Chọn đúng bạn cùng phòng.{'\n'}
            <Text className="text-[#FF5722]">Tích lũy điểm tin cậy thật.</Text>
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-3 leading-relaxed max-w-[280px]">
            Hệ thống tính điểm Effort & Karma minh bạch giúp đời sống chung nhẹ nhàng, gắn kết.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 mb-2">
        <TactileButton
          title="Đăng Nhập"
          variant="primary"
          size="lg"
          onPress={() => router.push('/(auth)/login')}
        />

        <TactileButton
          title="Tạo Tài Khoản Mới"
          variant="outline"
          size="md"
          onPress={() => router.push('/(auth)/register')}
        />
      </View>
    </SafeAreaView>
  );
}
