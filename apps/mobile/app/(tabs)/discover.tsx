import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, X, Sparkles, MapPin, Moon, Sun, DollarSign, MessageCircle } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useMatchingSuggestions, useSwipeMutation } from '../../src/modules/matching/hooks';
import { TrustBadge } from '../../src/ui/TrustBadge';
import { TactileButton } from '../../src/ui/TactileButton';
import { EmptyState } from '../../src/ui/EmptyState';

const mascotHappy = require('../../assets/brand/mascot-happy.png');

export default function DiscoverScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModalData, setMatchModalData] = useState<{
    matched: boolean;
    connectionId?: string;
    candidateName: string;
  } | null>(null);

  const { data: candidates = [], isLoading, refetch, isRefetching } = useMatchingSuggestions(user?.id);
  const swipeMutation = useSwipeMutation();

  const currentCandidate = candidates[currentIndex];

  const handleSwipe = async (action: 'liked' | 'passed') => {
    if (!currentCandidate) return;

    try {
      const result = await swipeMutation.mutateAsync({
        candidateId: currentCandidate.candidate_id,
        action,
      });

      if (action === 'liked' && result.matched) {
        setMatchModalData({
          matched: true,
          connectionId: result.connection_id,
          candidateName: currentCandidate.display_name,
        });
      }

      // Advance to next card
      setCurrentIndex((prev) => prev + 1);
    } catch (err: any) {
      Alert.alert('Lỗi thao tác', err.message || 'Không thể thực hiện quẹt thẻ.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-200/80">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Khám phá Bạn Cùng Phòng
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Roommate Radar ✨
            </Text>
          </View>
          <View className="px-3 py-1 rounded-full bg-[#EDE9FE] border border-[#6C4DFF]/30">
            <Text className="text-xs font-black text-[#6C4DFF]">
              {Math.max(0, candidates.length - currentIndex)} gợi ý
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content: Card or Empty */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6C4DFF" />
          <Text className="text-xs font-semibold text-slate-400 mt-3">
            Đang quét thuật toán tương thích...
          </Text>
        </View>
      ) : currentCandidate ? (
        <View className="flex-1 px-5 py-4 justify-between">
          <ScrollView
            className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-md p-5"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Candidate Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-2xl bg-[#EDE9FE] items-center justify-center mr-3 border border-[#6C4DFF]/20">
                  <Text className="text-2xl">😎</Text>
                </View>
                <View>
                  <Text className="text-xl font-black text-slate-900">
                    {currentCandidate.display_name}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <MapPin size={12} color="#64748B" />
                    <Text className="text-xs font-semibold text-slate-500 ml-1">
                      {currentCandidate.lifestyle?.district || 'Quận 10'}, {currentCandidate.lifestyle?.city || 'TP.HCM'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Compatibility score pill */}
              <View className="items-end">
                <View className="bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-2xl">
                  <Text className="text-base font-black text-emerald-700">
                    {currentCandidate.compatibility_pct}%
                  </Text>
                </View>
                <Text className="text-[10px] font-bold text-slate-400 mt-0.5">Hợp cạ</Text>
              </View>
            </View>

            {/* Trust badge */}
            <View className="mb-4">
              <TrustBadge
                score={currentCandidate.lifestyle?.seed_trust_score || 85}
                level="gold"
                isSimulated={currentCandidate.is_seed_data}
                size="md"
              />
            </View>

            {/* Strengths (Điểm hợp cạ) */}
            <View className="bg-slate-50 rounded-2xl p-3.5 mb-3 border border-slate-100">
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                ✨ Điểm Hợp Nhau Nhất
              </Text>
              {currentCandidate.strengths.map((str, idx) => (
                <View key={idx} className="flex-row items-center mb-1.5 last:mb-0">
                  <Text className="text-xs mr-2">✅</Text>
                  <Text className="text-xs font-bold text-slate-800 flex-1">{str}</Text>
                </View>
              ))}
            </View>

            {/* Conflicts / Lưu ý nếu có */}
            {currentCandidate.conflicts && currentCandidate.conflicts.length > 0 && (
              <View className="bg-amber-50 rounded-2xl p-3.5 mb-3 border border-amber-200">
                <Text className="text-xs font-black text-amber-800 uppercase tracking-wider mb-2">
                  ⚠️ Điểm Cần Lưu Ý
                </Text>
                {currentCandidate.conflicts.map((conf, idx) => (
                  <View key={idx} className="flex-row items-center mb-1 last:mb-0">
                    <Text className="text-xs mr-2">💡</Text>
                    <Text className="text-xs font-semibold text-amber-900 flex-1">{conf}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lifestyle quick facts */}
            <View className="bg-white rounded-2xl border border-slate-100 p-3.5 mb-3 space-y-2">
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Nhịp sống & Thói quen
              </Text>

              <View className="flex-row items-center justify-between py-1 border-b border-slate-100">
                <View className="flex-row items-center">
                  <Sun size={13} color="#F59E0B" />
                  <Text className="text-xs text-slate-600 ml-1.5 font-medium">Giờ thức / ngủ</Text>
                </View>
                <Text className="text-xs font-bold text-slate-800">
                  {currentCandidate.lifestyle?.wake_up_time?.slice(0, 5) || '07:00'} - {currentCandidate.lifestyle?.sleep_time?.slice(0, 5) || '23:30'}
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-1 border-b border-slate-100">
                <View className="flex-row items-center">
                  <DollarSign size={13} color="#10B981" />
                  <Text className="text-xs text-slate-600 ml-1.5 font-medium">Ngân sách</Text>
                </View>
                <Text className="text-xs font-bold text-slate-800">
                  {((currentCandidate.lifestyle?.budget_min || 1500000) / 1000000).toFixed(1)} - {((currentCandidate.lifestyle?.budget_max || 3500000) / 1000000).toFixed(1)} tr/tháng
                </Text>
              </View>

              <View className="flex-row items-center justify-between py-1">
                <Text className="text-xs text-slate-600 font-medium">Gọn gàng / Hút thuốc</Text>
                <Text className="text-xs font-bold text-slate-800">
                  {currentCandidate.lifestyle?.tidiness_level || 4}/5 • {currentCandidate.lifestyle?.smokes ? '🚬 Có hút' : '🚭 Không'}
                </Text>
              </View>
            </View>

            {/* Bio */}
            {currentCandidate.lifestyle?.bio && (
              <View className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Giới thiệu
                </Text>
                <Text className="text-xs text-slate-700 italic leading-relaxed">
                  "{currentCandidate.lifestyle.bio}"
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Swipe Buttons */}
          <View className="flex-row items-center justify-center space-x-6 py-4">
            {/* Pass Button */}
            <TactileButton
              title="Bỏ qua"
              variant="outline"
              size="lg"
              leftIcon={<X size={20} color="#64748B" strokeWidth={3} />}
              onPress={() => handleSwipe('passed')}
              disabled={swipeMutation.isPending}
              style={{ minWidth: 140 }}
            />

            {/* Like Button */}
            <TactileButton
              title="Thích 💖"
              variant="primary"
              size="lg"
              leftIcon={<Heart size={20} color="#FFFFFF" fill="#FFFFFF" />}
              onPress={() => handleSwipe('liked')}
              disabled={swipeMutation.isPending}
              style={{ minWidth: 140 }}
            />
          </View>
        </View>
      ) : (
        <EmptyState
          mood="happy"
          title="Đã xem hết gợi ý hiện tại!"
          description="Bro đã lướt hết các ứng viên phù hợp với tiêu chí lối sống. Hãy quay lại sau khi có thêm thành viên mới nhé."
          actionTitle="Quét lại từ đầu 🔄"
          onAction={() => {
            setCurrentIndex(0);
            refetch();
          }}
        />
      )}

      {/* Match Celebration Modal */}
      <Modal visible={!!matchModalData?.matched} transparent animationType="slide" onRequestClose={() => setMatchModalData(null)}>
        <View className="flex-1 bg-black/80 items-center justify-center p-6">
          <View className="bg-white rounded-3xl p-6 items-center w-full max-w-sm shadow-2xl">
            <View className="w-24 h-24 rounded-3xl bg-[#EDE9FE] items-center justify-center mb-4 border-2 border-[#6C4DFF]/20">
              <Image
                source={mascotHappy}
                style={{ width: 72, height: 72 }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-2xl font-black text-slate-900 text-center mb-1">
              Match Rồi Bro Ơi!
            </Text>
            <Text className="text-sm text-slate-600 text-center mb-6">
              Bạn và <Text className="font-extrabold text-[#6C4DFF]">{matchModalData?.candidateName}</Text> đều đã thích nhau. Hãy trò chuyện và lên kế hoạch cùng thuê phòng nhé!
            </Text>

            <View className="w-full space-y-3">
              <TactileButton
                title="Nhắn tin ngay 💬"
                variant="primary"
                size="lg"
                onPress={() => {
                  const connId = matchModalData?.connectionId;
                  setMatchModalData(null);
                  if (connId) {
                    router.push(`/chat/${connId}` as any);
                  } else {
                    router.push('/(tabs)/messages');
                  }
                }}
              />
              <TactileButton
                title="Để sau"
                variant="ghost"
                size="sm"
                onPress={() => setMatchModalData(null)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
