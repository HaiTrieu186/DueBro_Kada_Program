import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../components/ui/TactileButton';
import { TrustBadge } from '../../components/ui/Badge';

interface MemberScore {
  userId: string;
  name: string;
  avatarUrl: string | null;
  trustScore: number;
  effortPoints: number;
  completedTasks: number;
}

export default function ScoreboardScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  // 1. Fetch room members leaderboard
  const { data: leaderboard = [], isLoading } = useQuery<MemberScore[]>({
    queryKey: ['room_leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, trust_score, karma_balance')
        .order('karma_balance', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((p: any, idx: number) => ({
        userId: p.id,
        name: p.display_name || `Thành viên #${idx + 1}`,
        avatarUrl: p.avatar_url,
        trustScore: p.trust_score ?? 80,
        effortPoints: p.karma_balance ?? 100,
        completedTasks: 5 - idx > 0 ? 5 - idx : 1,
      }));
    },
  });

  const handleSignOut = () => {
    Alert.alert('Đăng xuất', 'Bro có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Bảng Vinh Danh & Độ Tin Cậy
        </Text>
        <Text className="text-xl font-black text-slate-900">
          Bảng Điểm Phòng 402 🏆
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* User Status Card */}
        <View className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-2xl bg-orange-100 items-center justify-center border border-[#FF5722]/20 mr-3">
                <Text className="text-2xl">😎</Text>
              </View>
              <View>
                <Text className="text-lg font-black text-slate-900">
                  {profile?.display_name || 'Người Anh Em'}
                </Text>
                <View className="mt-1">
                  <TrustBadge score={profile?.trust_score ?? 85} />
                </View>
              </View>
            </View>

            <View className="items-end">
              <Text className="text-xs font-bold text-slate-400 uppercase">Ví Karma</Text>
              <Text className="text-xl font-black text-[#FF5722]">
                💎 {profile?.karma_balance ?? 120}
              </Text>
            </View>
          </View>

          {/* Weekly Quota Bar (ARCH Mục 7.2) */}
          <View className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-bold text-slate-700">
                Chỉ tiêu việc nhà tuần này (Quota)
              </Text>
              <Text className="text-xs font-extrabold text-[#FF5722]">
                2 / 3 việc (Đạt 66%)
              </Text>
            </View>
            <View className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <View className="w-2/3 h-full bg-[#FF5722] rounded-full" />
            </View>
            <Text className="text-[11px] text-slate-400 mt-2">
              💡 Hoàn thành thêm 1 việc trước Chủ Nhật 23:59 để giữ Trust Score không bị trừ.
            </Text>
          </View>
        </View>

        {/* Leaderboard Table */}
        <View className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
          <Text className="text-base font-black text-slate-900 mb-4">
            Bảng Xếp Hạng Đóng Góp Tuần 🥇
          </Text>

          <View className="space-y-3">
            {leaderboard.map((member, index) => {
              const rank = index + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

              return (
                <View
                  key={member.userId}
                  className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <View className="flex-row items-center">
                    <Text className="text-base font-black text-slate-700 w-8 text-center mr-2">
                      {medal}
                    </Text>
                    <View>
                      <Text className="text-sm font-bold text-slate-800">
                        {member.name}
                      </Text>
                      <View className="mt-0.5">
                        <TrustBadge score={member.trustScore} />
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-black text-[#FF5722]">
                      +{member.effortPoints} EP
                    </Text>
                    <Text className="text-[10px] font-semibold text-slate-400">
                      {member.completedTasks} việc xong
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Log out button */}
        <TactileButton
          title="Đăng xuất khỏi tài khoản"
          variant="outline"
          size="md"
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
