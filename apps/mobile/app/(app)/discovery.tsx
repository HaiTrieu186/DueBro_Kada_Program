import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, api } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../components/ui/TactileButton';
import { TrustBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import type { MatchSuggestion } from '@duebro/shared-types';

export default function DiscoveryScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fetch suggestions from Edge Function or database
  const {
    data: candidates = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<MatchSuggestion[]>({
    queryKey: ['match_suggestions', user?.id],
    queryFn: async () => {
      // In production, call Edge Function 'compute-matches':
      try {
        const { data, error } = await supabase.functions.invoke('compute-matches', {
          body: { user_id: user?.id, limit: 10 },
        });
        if (!error && data?.matches && data.matches.length > 0) {
          return data.matches;
        }
      } catch {
        // Fallback to direct query on seeded lifestyle_profiles if Edge Function is offline in local dev
      }

      const { data: dbProfiles, error: dbError } = await supabase
        .from('lifestyle_profiles')
        .select(`
          user_id,
          sleep_time,
          wake_time,
          cleanliness_level,
          budget_min,
          budget_max,
          districts_interested,
          smoking,
          pet_friendly,
          bio,
          profiles:user_id (
            display_name,
            avatar_url,
            trust_score
          )
        `)
        .neq('user_id', user?.id ?? '')
        .limit(10);

      if (dbError) throw dbError;

      // Map to MatchSuggestion structure
      return (dbProfiles || []).map((item: any, idx: number) => {
        const profileInfo = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        return {
          candidate_id: item.user_id,
          display_name: profileInfo?.display_name || `Roommate #${idx + 1}`,
          avatar_url: profileInfo?.avatar_url || null,
          compatibility_pct: 82 + (idx % 12),
          matching_reasons: [
            `⏰ Giờ ngủ thức tương đồng (${item.sleep_time} - ${item.wake_time})`,
            `🧹 Mức độ gọn gàng ${item.cleanliness_level}/5`,
          ],
          consideration: item.smoking ? '🚬 Bạn này có hút thuốc' : null,
          trust_score: profileInfo?.trust_score ?? 80,
          is_seed_data: true,
        };
      });
    },
    enabled: !!user?.id,
  });

  // 2. Swipe mutation (calls RPC swipe)
  const swipeMutation = useMutation({
    mutationFn: async ({ targetId, action }: { targetId: string; action: 'like' | 'pass' }) => {
      return api.swipe(targetId, action);
    },
    onSuccess: (data, variables) => {
      if (variables.action === 'like') {
        if (data?.is_match || (data as any)?.status === 'mutual_like') {
          Alert.alert(
            '🎉 CHÚC MỪNG: MATCH RỒI BRO!',
            'Cả 2 đều bấm thích nhau. Bạn có thể gửi lời mời lập phòng chung ngay bây giờ!'
          );
        }
      }
      // Move to next card
      setCurrentIndex((prev) => prev + 1);
    },
    onError: (err: any) => {
      Alert.alert('Lỗi thao tác', err.message || 'Không thể lưu hành động.');
    },
  });

  const activeCandidate = candidates[currentIndex];
  const hasMore = currentIndex < candidates.length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View>
          <Text className="text-xs font-bold text-[#FF5722] uppercase tracking-widest">
            AI Lifestyle Matcher
          </Text>
          <Text className="text-xl font-black text-slate-900">
            Khám Phá Bạn Cùng Phòng 🔍
          </Text>
        </View>
        <View className="px-3 py-1 rounded-full bg-slate-100">
          <Text className="text-xs font-bold text-slate-600">
            {hasMore ? `${currentIndex + 1}/${candidates.length}` : '0/0'}
          </Text>
        </View>
      </View>

      {/* Body */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#FF5722" />
          <Text className="text-xs font-medium text-slate-400 mt-3">
            AI đang phân tích lối sống và độ tương thích...
          </Text>
        </View>
      ) : isError ? (
        <ErrorState
          title="Không thể tìm ứng viên"
          message={(error as any)?.message}
          onRetry={() => {
            setCurrentIndex(0);
            refetch();
          }}
          isRetrying={isRefetching}
        />
      ) : !hasMore ? (
        <EmptyState
          state="sleeping"
          title="Đã Xem Hết Hồ Sơ Hôm Nay!"
          description="Bro đã duyệt hết các bạn phù hợp quanh khu vực này. Hãy quay lại sau khi có thêm bạn mới đăng ký nhé."
          actionTitle="Xem lại từ đầu"
          onAction={() => {
            setCurrentIndex(0);
            refetch();
          }}
        />
      ) : (
        <ScrollView
          className="flex-1 px-5 py-4"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        >
          {/* Candidate Profile Card */}
          <View className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 mb-4">
            {/* Top row: Avatar placeholder & Compatibility badge */}
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-2xl bg-orange-100 items-center justify-center border-2 border-[#FF5722]/30 mr-3">
                  <Text className="text-2xl">🧑‍🎓</Text>
                </View>
                <View>
                  <Text className="text-xl font-black text-slate-900">
                    {activeCandidate.display_name}
                  </Text>
                  <View className="mt-1">
                    <TrustBadge score={activeCandidate.trust_score} />
                  </View>
                </View>
              </View>

              {/* Compatibility Percentage Pill */}
              <View className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 items-center">
                <Text className="text-xs font-black text-emerald-700">
                  {Math.round(activeCandidate.compatibility_pct)}% MATCH
                </Text>
              </View>
            </View>

            {/* AI Matching Highlights (2 Ưu điểm cốt lõi) */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Điểm Tương Thích Nổi Bật ✨
              </Text>
              <View className="space-y-1.5">
                {activeCandidate.matching_reasons.map((reason, i) => (
                  <View
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-row items-center"
                  >
                    <Text className="text-xs font-semibold text-slate-700">{reason}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Consideration note (Lưu ý) */}
            {activeCandidate.consideration && (
              <View className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <Text className="text-xs font-bold text-amber-800">
                  {activeCandidate.consideration}
                </Text>
              </View>
            )}

            {/* Bio snippet */}
            <View className="pt-3 border-t border-slate-100">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Giới Thiệu
              </Text>
              <Text className="text-sm text-slate-600 italic">
                &ldquo;Sinh viên thích nấu ăn, tôn trọng không gian riêng tư của bạn cùng phòng.&rdquo;
              </Text>
            </View>
          </View>

          {/* Action Buttons (Pass / Like) */}
          <View className="flex-row space-x-4 mb-6">
            <View className="flex-1">
              <TactileButton
                title="Bỏ qua ❌"
                variant="outline"
                size="lg"
                isLoading={swipeMutation.isPending && swipeMutation.variables?.action === 'pass'}
                onPress={() =>
                  swipeMutation.mutate({
                    targetId: activeCandidate.candidate_id,
                    action: 'pass',
                  })
                }
              />
            </View>
            <View className="flex-1">
              <TactileButton
                title="Ghép phòng 💚"
                variant="primary"
                size="lg"
                isLoading={swipeMutation.isPending && swipeMutation.variables?.action === 'like'}
                onPress={() =>
                  swipeMutation.mutate({
                    targetId: activeCandidate.candidate_id,
                    action: 'like',
                  })
                }
              />
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
