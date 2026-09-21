import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../src/ui/TactileButton';

const DEMO_ACCOUNTS = [
  { name: 'Minh Anh (Cú đêm, IT, Trust 85)', email: 'seed+01@duebro.test', pass: 'DueBro@2026' },
  { name: 'Tuấn Kiệt (Ngăn nắp, BK, Trust 92)', email: 'seed+02@duebro.test', pass: 'DueBro@2026' },
  { name: 'Hải Đăng (Hà Nội, Vui vẻ, Trust 78)', email: 'seed+03@duebro.test', pass: 'DueBro@2026' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Bro ơi, vui lòng nhập đầy đủ email và mật khẩu nhé!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      if (data?.user) {
        // Kiểm tra xem bro đã hoàn thành hồ sơ lifestyle chưa để điều hướng chính xác
        const hasCompleted = await useAuthStore.getState().checkOnboardingStatus(data.user.id);
        if (hasCompleted) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(onboarding)/profile');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Bro kiểm tra lại email/mật khẩu nhé.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-3xl bg-[#F5F3FF] items-center justify-center border-2 border-[#DDD6FE] shadow-sm mb-3 p-1">
              <Image
                source={require('../../assets/brand/mascot-head.png')}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              Chào Bro Trở Lại! 👋
            </Text>
            <Text className="text-xs font-medium text-slate-500 mt-1 text-center">
              Đăng nhập để nhận việc, tích điểm và kết nối roommate
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-5">
            {errorMessage && (
              <View className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <Text className="text-xs text-red-600 font-medium">{errorMessage}</Text>
              </View>
            )}

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </Text>
              <TextInput
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#6C4DFF] focus:bg-white"
                placeholder="bro@sinhvien.edu.vn"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </Text>
              <TextInput
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#6C4DFF] focus:bg-white"
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Submit Button */}
            <TactileButton
              title="Đăng Nhập Vào Phòng ⚡"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleLogin}
            />

            {/* Switch to Register */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-xs text-slate-500">Chưa có tài khoản?</Text>
              <TactileButton
                title="Đăng ký mới"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/register')}
              />
            </View>
          </View>

          {/* Quick Demo Accounts for 7-minute Pitch */}
          <View className="bg-[#F5F3FF] border border-[#DDD6FE] p-4 rounded-2xl">
            <Text className="text-xs font-black text-[#6C4DFF] uppercase tracking-wider mb-2">
              ⚡ Tài Khoản Demo Nhanh (7-Min Pitch)
            </Text>
            <View className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <TactileButton
                  key={acc.email}
                  title={`👤 ${acc.name}`}
                  variant="secondary"
                  size="sm"
                  onPress={() => handleDemoFill(acc.email, acc.pass)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
