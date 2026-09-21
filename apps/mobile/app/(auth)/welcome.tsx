import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TactileButton } from '../../src/ui/TactileButton';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9] justify-between px-6 py-6">
      {/* Top Brand Logo Banner */}
      <View className="items-center mt-4">
        <Image
          source={require('../../assets/brand/logo-banner.png')}
          style={{ width: 240, height: 80, resizeMode: 'contain' }}
        />
        <View className="bg-purple-100/80 px-3 py-1 rounded-full border border-purple-200 mt-2">
          <Text className="text-[11px] font-black text-[#6C4DFF] tracking-wider uppercase">
            Quản Lý Phòng Trọ & Chia Việc Thông Minh
          </Text>
        </View>
      </View>

      {/* Mascot Hero Center */}
      <View className="items-center my-auto py-4">
        <View
          className="w-52 h-52 rounded-3xl bg-white items-center justify-center border-2 border-[#DDD6FE] p-3 shadow-md"
          style={{ elevation: 4 }}
        >
          <Image
            source={require('../../assets/brand/card-reminder.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
        </View>

        <View className="mt-6 px-4 items-center">
          <Text className="text-2xl font-black text-slate-900 text-center leading-tight">
            Đừng để một người{'\n'}
            <Text className="text-[#6C4DFF]">gánh cả phòng!</Text>
          </Text>
          <Text className="text-xs font-medium text-slate-500 text-center mt-2.5 leading-relaxed max-w-[290px]">
            Hệ thống điểm Effort & Karma tự động nhắc việc thay bạn. Không còn cảnh khó xử vì nhắc deadline!
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 mb-3">
        <TactileButton
          title="Đăng Nhập Vào Phòng ⚡"
          variant="primary"
          size="lg"
          onPress={() => router.push('/(auth)/login')}
        />

        <TactileButton
          title="Tạo Tài Khoản Mới"
          variant="secondary"
          size="md"
          onPress={() => router.push('/(auth)/register')}
        />
      </View>
    </SafeAreaView>
  );
}
