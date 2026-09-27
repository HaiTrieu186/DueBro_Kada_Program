import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { TactileButton } from '../../src/ui/TactileButton';

const mascotHead = require('../../assets/brand/mascot-head.png');

export default function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMessage('Bro ơi, vui lòng nhập đầy đủ tên, email và mật khẩu nhé!');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu tối thiểu 6 ký tự nhé bro!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Trigger handle_new_user tự tạo profile, ta cập nhật display_name
        await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', data.user.id);
      }

      Alert.alert('Chào mừng bro!', 'Đăng ký thành công, hãy hoàn tất hồ sơ lối sống nhé!');
      router.replace('/(onboarding)/profile');
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký không thành công. Thử lại nhé bro.');
    } finally {
      setIsLoading(false);
    }
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
          {/* Header with Mascot */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-3xl bg-[#EDE9FE] items-center justify-center mb-3 border-2 border-[#6C4DFF]/20 shadow-md">
              <Image
                source={mascotHead}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-2xl font-black text-slate-900 tracking-tight">
              Gia Nhập Due Bro
            </Text>
            <Text className="text-xs font-semibold text-[#6C4DFF] mt-1">
              "Bro, it's due."
            </Text>
            <Text className="text-xs font-medium text-slate-500 mt-0.5 text-center">
              Tìm bạn ở ghép chuẩn gu & chia việc nhà sòng phẳng
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-4">
            {errorMessage && (
              <View className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <Text className="text-xs text-red-600 font-medium">{errorMessage}</Text>
              </View>
            )}

            {/* Display Name Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên hiển thị / Biệt danh
              </Text>
              <TextInput
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#6C4DFF] focus:bg-white"
                placeholder="VD: Hải Triều"
                placeholderTextColor="#94A3B8"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

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
                Mật khẩu (tối thiểu 6 ký tự)
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
              title="Tiếp Tục Điền Hồ Sơ ➡️"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleRegister}
            />

            {/* Switch to Login */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-xs text-slate-500">Đã có tài khoản?</Text>
              <TactileButton
                title="Đăng nhập"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(auth)/login')}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
