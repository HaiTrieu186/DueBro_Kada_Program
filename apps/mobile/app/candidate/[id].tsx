import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MapPin, Sun, DollarSign, Sparkles } from 'lucide-react-native';
import { useUserTrust } from '../../src/modules/matching/hooks';
import { TrustBadge } from '../../src/ui/TrustBadge';
import { TactileButton } from '../../src/ui/TactileButton';

export default function CandidateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trust, isLoading } = useUserTrust(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#FF5722" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between">
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-3 active:bg-slate-200"
          >
            <ChevronLeft size={20} color="#334155" />
          </Pressable>
          <Text className="text-xl font-black text-slate-900">
            Hồ Sơ Ứng Viên 👤
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm items-center mb-4">
          <View className="w-20 h-20 rounded-3xl bg-orange-100 items-center justify-center mb-3 border-2 border-orange-200">
            <Text className="text-4xl">😎</Text>
          </View>
          <Text className="text-2xl font-black text-slate-900">Ứng Viên Roommate</Text>
          <View className="flex-row items-center mt-1 mb-3">
            <MapPin size={13} color="#64748B" />
            <Text className="text-xs font-semibold text-slate-500 ml-1">TP. Hồ Chí Minh</Text>
          </View>

          <TrustBadge
            score={trust?.score ?? 75}
            level={trust?.level ?? 'silver'}
            isProvisional={trust?.is_provisional}
            isSimulated={trust?.is_simulated}
            size="md"
          />
        </View>

        {/* Trust Stats */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
          <Text className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
            Lịch sử uy tín tại Due Bro
          </Text>

          <View className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-4">
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-slate-900">{trust?.score ?? 75}/100</Text>
              <Text className="text-[10px] font-bold text-slate-400">Trust Score</Text>
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-emerald-600">
                {trust?.resolved_count ?? 0}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400">Việc hoàn thành</Text>
            </View>
            <View className="w-px h-8 bg-slate-200" />
            <View className="items-center flex-1">
              <Text className="text-lg font-black text-amber-600">
                {trust?.dispute_count ?? 0}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400">Khiếu nại</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
