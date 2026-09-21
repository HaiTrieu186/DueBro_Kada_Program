import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  Settings,
  LogOut,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useUserTrust } from '../../src/modules/matching/hooks';
import { useKarmaBalance } from '../../src/modules/household/hooks';
import { TrustBadge } from '../../src/ui/TrustBadge';
import { EffortHeatmap } from '../../src/ui/EffortHeatmap';
import { TactileButton } from '../../src/ui/TactileButton';

export default function MeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const { data: trust } = useUserTrust(user?.id);
  const { data: karmaBalance = 0 } = useKarmaBalance(user?.id);

  const handleSignOut = async () => {
    Alert.alert('Đăng xuất', 'Bro có chắc chắn muốn đăng xuất khỏi Due Bro không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  // Determine Title based on Karma earned (ARCH Mục 5.3)
  const getBroTitle = (karma: number) => {
    if (karma >= 300) return 'Bro Huyền Thoại 👑';
    if (karma >= 100) return 'Bro Gương Mẫu 🥇';
    if (karma >= 30) return 'Bro Chăm Chỉ 🥈';
    return 'Bro Tập Sự 🌱';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tài Khoản & Danh Tiếng
          </Text>
          <Text className="text-xl font-black text-slate-900">
            Hồ Sơ Của Tôi 👤
          </Text>
        </View>

        {/* Notifications Icon Button */}
        <Pressable
          onPress={() => router.push('/notifications')}
          className="w-10 h-10 rounded-full bg-slate-100 active:bg-slate-200 items-center justify-center"
        >
          <Bell size={18} color="#475569" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* User Profile Card */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-orange-100 items-center justify-center mr-4 border-2 border-orange-200">
              <Text className="text-3xl">😎</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black text-slate-900">
                {profile?.display_name || 'Bro Người Dùng'}
              </Text>
              <Text className="text-xs font-bold text-[#FF5722] mt-0.5">
                {getBroTitle(karmaBalance)}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Score Card (Bayesian Trust - ARCH Mục 7.4) */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <ShieldCheck size={18} color="#10B981" />
              <Text className="text-sm font-black text-slate-900 ml-1.5">
                Điểm Tin Cậy (Trust Score)
              </Text>
            </View>
            <TrustBadge
              score={trust?.score ?? 70}
              level={trust?.level ?? 'silver'}
              isProvisional={trust?.is_provisional}
              isSimulated={trust?.is_simulated}
              size="sm"
            />
          </View>

          <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-slate-900">
                {trust?.score ?? 70}/100
              </Text>
              <Text className="text-[10px] font-bold text-slate-400">Chỉ số Trust</Text>
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-emerald-600">
                {trust?.resolved_count ?? 0}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400">Việc đã xong</Text>
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-amber-600">
                {trust?.dispute_count ?? 0}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400">Bị khiếu nại</Text>
            </View>
          </View>
        </View>

        {/* Productivity Activity Heatmap (ui-example Image 5 Screen 1) */}
        <EffortHeatmap completedCount={trust?.resolved_count ?? 12} streakDays={5} />

        {/* Karma Shop Card */}
        <Pressable
          onPress={() => router.push('/karma')}
          className="bg-gradient-to-r bg-orange-50 border border-orange-200 rounded-3xl p-5 mb-4 active:bg-orange-100"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-orange-500 items-center justify-center mr-3">
                <ShoppingBag size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text className="text-sm font-black text-slate-900">
                  Ví Điểm & Karma Shop
                </Text>
                <Text className="text-xs font-semibold text-orange-700 mt-0.5">
                  Đang có {karmaBalance} Karma • Đổi thẻ skip việc
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#FF5722" />
          </View>
        </Pressable>

        {/* Settings Links */}
        <View className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm mb-6">
          <Pressable
            onPress={() => router.push('/(onboarding)/profile')}
            className="flex-row items-center justify-between p-3.5 border-b border-slate-100 active:bg-slate-50 rounded-2xl"
          >
            <View className="flex-row items-center">
              <Settings size={18} color="#64748B" />
              <Text className="text-sm font-bold text-slate-800 ml-3">
                Chỉnh sửa hồ sơ lối sống
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/scoreboard')}
            className="flex-row items-center justify-between p-3.5 border-b border-slate-100 active:bg-slate-50 rounded-2xl"
          >
            <View className="flex-row items-center">
              <Trophy size={18} color="#64748B" />
              <Text className="text-sm font-bold text-slate-800 ml-3">
                Bảng xếp hạng tuần phòng
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/templates')}
            className="flex-row items-center justify-between p-3.5 active:bg-slate-50 rounded-2xl"
          >
            <View className="flex-row items-center">
              <Sparkles size={18} color="#64748B" />
              <Text className="text-sm font-bold text-slate-800 ml-3">
                Bộ việc nhà mẫu (Chore Templates)
              </Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </Pressable>
        </View>

        {/* Sign Out Button */}
        <TactileButton
          title="Đăng Xuất Khỏi Tài Khoản"
          variant="danger"
          size="md"
          leftIcon={<LogOut size={16} color="#FFFFFF" />}
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
