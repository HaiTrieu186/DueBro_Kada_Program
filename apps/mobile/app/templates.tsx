import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useHouseholdMutations, useMyRooms } from '../src/modules/household/hooks';
import { CategoryBadge, EffortBadge } from '../src/ui/Badge';
import { TactileButton } from '../src/ui/TactileButton';
import type { TaskCategory } from '@duebro/shared-types';

const PRESET_TEMPLATES: {
  title: string;
  category: TaskCategory;
  effortPoints: number;
  requiresPhoto: boolean;
}[] = [
  { title: 'Đổ rác & thay bao rác', category: 'trash', effortPoints: 10, requiresPhoto: false },
  { title: 'Rửa chén & dọn bồn rửa', category: 'kitchen', effortPoints: 10, requiresPhoto: false },
  { title: 'Giặt & phơi đồ chung', category: 'cleaning', effortPoints: 15, requiresPhoto: false },
  { title: 'Đi chợ / mua đồ chung cho nhà', category: 'shopping', effortPoints: 20, requiresPhoto: false },
  { title: 'Lau dọn bàn bếp & bếp gas', category: 'kitchen', effortPoints: 25, requiresPhoto: false },
  { title: 'Lau sàn nhà & quét nhà', category: 'cleaning', effortPoints: 30, requiresPhoto: true },
  { title: 'Dọn cọ nhà vệ sinh', category: 'cleaning', effortPoints: 40, requiresPhoto: true },
  { title: 'Tổng vệ sinh nhà cuối tuần', category: 'cleaning', effortPoints: 50, requiresPhoto: true },
];

export default function TemplatesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);
  const { data: myRooms = [] } = useMyRooms(user?.id);
  const roomId = activeRoom?.id || myRooms[0]?.room?.id;

  const [selectedTitles, setSelectedTitles] = useState<string[]>(
    PRESET_TEMPLATES.map((t) => t.title)
  );
  const [isApplying, setIsApplying] = useState(false);

  const { proposeChoreTemplate } = useHouseholdMutations(roomId);

  const toggleSelect = (title: string) => {
    if (selectedTitles.includes(title)) {
      setSelectedTitles(selectedTitles.filter((t) => t !== title));
    } else {
      setSelectedTitles([...selectedTitles, title]);
    }
  };

  const handleApplyTemplates = async () => {
    if (!roomId) {
      Alert.alert('Chưa có phòng', 'Vui lòng tham gia phòng trước.');
      return;
    }

    const templatesToApply = PRESET_TEMPLATES.filter((t) => selectedTitles.includes(t.title));
    if (templatesToApply.length === 0) {
      Alert.alert('Chọn ít nhất 1 việc', 'Hãy chọn các mẫu việc bạn muốn đưa vào phòng.');
      return;
    }

    setIsApplying(true);
    try {
      for (const t of templatesToApply) {
        await proposeChoreTemplate.mutateAsync({
          roomId,
          title: t.title,
          category: t.category,
          effortPoints: t.effortPoints,
          requiresPhoto: t.requiresPhoto,
        });
      }

      Alert.alert('Hoàn tất! ✨', 'Bộ việc mẫu đã được thêm vào phòng. Việc sẽ định kỳ xuất hiện trên Bounty Board.');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Lỗi áp dụng', err.message || 'Không thể áp dụng mẫu.');
    } finally {
      setIsApplying(false);
    }
  };

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
          <View>
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Bộ Việc Mẫu
            </Text>
            <Text className="text-xl font-black text-slate-900">
              Chọn Mẫu Việc Nhà ✨
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={PRESET_TEMPLATES}
        keyExtractor={(item) => item.title}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const isSelected = selectedTitles.includes(item.title);
          return (
            <Pressable
              onPress={() => toggleSelect(item.title)}
              className={`p-4 rounded-2xl mb-3 border ${
                isSelected
                  ? 'bg-orange-50/60 border-[#FF5722]'
                  : 'bg-white border-slate-200'
              } flex-row items-center justify-between shadow-sm`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-extrabold text-slate-900 mb-1.5">
                  {item.title}
                </Text>
                <View className="flex-row items-center flex-wrap gap-2">
                  <CategoryBadge category={item.category} size="sm" />
                  <EffortBadge points={item.effortPoints} size="sm" />
                  {item.requiresPhoto && (
                    <Text className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                      📸 Cần ảnh
                    </Text>
                  )}
                </View>
              </View>

              <View
                className={`w-7 h-7 rounded-full items-center justify-center border ${
                  isSelected
                    ? 'bg-[#FF5722] border-[#FF5722]'
                    : 'bg-transparent border-slate-300'
                }`}
              >
                {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </Pressable>
          );
        }}
      />

      {/* Bottom Button */}
      <View className="p-4 bg-white border-t border-slate-200">
        <TactileButton
          title={`Áp Dụng (${selectedTitles.length}) Mẫu Vào Nhà 🚀`}
          variant="primary"
          size="lg"
          isLoading={isApplying}
          onPress={handleApplyTemplates}
        />
      </View>
    </SafeAreaView>
  );
}
