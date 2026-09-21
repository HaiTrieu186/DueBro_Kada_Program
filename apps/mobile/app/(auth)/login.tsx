import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { TactileButton } from '../../components/ui/TactileButton';

// Quick demo accounts from seed_profiles.sql for the 7-minute live demo
const DEMO_ACCOUNTS = [
  { name: 'Minh Anh (Cú đêm, IT, Trust 85)', email: 'minh.anh@duebro.demo', pass: 'demo123456' },
  { name: 'Tuấn Kiệt (Ngăn nắp, BK, Trust 92)', email: 'tuan.kiet@duebro.demo', pass: 'demo123456' },
  { name: 'Hải Đăng (Hà Nội, Vui vẻ, Trust 78)', email: 'hai.dang@duebro.demo', pass: 'demo123456' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Bro ơi, vui lòng nhập đầy đủ email và mật khẩu nhé!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert('Đăng ký thành công', 'Chào mừng bro gia nhập Due Bro! Điền tiếp hồ sơ nhé.');
        router.replace('/(auth)/onboarding');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace('/(app)');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin nhé.');
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
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-3xl bg-[#FF5722] items-center justify-center shadow-lg shadow-orange-300 mb-4">
              <Text className="text-4xl">🤝</Text>
            </View>
            <Text className="text-3xl font-black text-slate-900 tracking-tight">
              Due Bro
            </Text>
            <Text className="text-sm font-medium text-slate-500 mt-1 text-center">
              Tìm bạn ở ghép ưng ý & Vận hành việc nhà cực chill
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-6">
            <Text className="text-xl font-bold text-slate-800 mb-1">
              {isSignUp ? 'Tạo Tài Khoản Mới' : 'Chào Bro Trở Lại! 👋'}
            </Text>
            <Text className="text-xs text-slate-400 mb-6">
              {isSignUp
                ? 'Gia nhập cộng đồng sinh viên văn minh, sòng phẳng.'
                : 'Đăng nhập để nhận việc, tích điểm và kết nối roommate.'}
            </Text>

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
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#FF5722] focus:bg-white"
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
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#FF5722] focus:bg-white"
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Submit Button */}
            <TactileButton
              title={isSignUp ? 'Đăng ký ngay 🚀' : 'Đăng nhập vào phòng ⚡'}
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleAuth}
            />

            {/* Switch Mode */}
            <View className="flex-row justify-center items-center mt-5">
              <Text className="text-xs text-slate-500">
                {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
              </Text>
              <TactileButton
                title={isSignUp ? 'Đăng nhập' : 'Đăng ký ngay'}
                variant="ghost"
                size="sm"
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
              />
            </View>
          </View>

          {/* Quick Demo Accounts for 7-minute Pitch */}
          <View className="bg-orange-50/70 border border-orange-200/60 p-4 rounded-2xl">
            <Text className="text-xs font-extrabold text-[#FF5722] uppercase tracking-wider mb-2">
              ⚡ Tài Khoản Demo Nhanh (7-Min Pitch)
            </Text>
            <View className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <TactileButton
                  key={acc.email}
                  title={`👤 ${acc.name}`}
                  variant="outline"
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
