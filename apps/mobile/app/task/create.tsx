import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Camera, Clock, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useHouseholdMutations, useMyRooms } from '../../src/modules/household/hooks';
import { TactileButton } from '../../src/ui/TactileButton';
import type { TaskCategory } from '@duebro/shared-types';

const CATEGORIES: { id: TaskCategory; label: string; icon: string }[] = [
  { id: 'cleaning', label: 'Vệ sinh', icon: '🧹' },
  { id: 'trash', label: 'Đổ rác', icon: '🗑️' },
  { id: 'kitchen', label: 'Bếp núc', icon: '🍳' },
  { id: 'shopping', label: 'Mua sắm', icon: '🛒' },
  { id: 'maintenance', label: 'Sửa chữa', icon: '🔧' },
  { id: 'other', label: 'Việc chung', icon: '✨' },
];

const PRESET_POINTS = [10, 15, 20, 30, 40, 50];

export default function CreateTaskScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);

  const { data: myRooms = [] } = useMyRooms(user?.id);
  const roomId = activeRoom?.id || myRooms[0]?.room?.id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('cleaning');
  const [effortPoints, setEffortPoints] = useState<number>(20);
  const [dueHoursOffset, setDueHoursOffset] = useState<number>(8); // hours from now

  const { createAdhocTask } = useHouseholdMutations(roomId);

  const handleCreate = async () => {
    if (!roomId) {
      Alert.alert('Chưa có phòng', 'Bro cần tham gia hoặc tạo phòng trước khi tạo việc.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Thiếu tiêu đề', 'Bro nhập tên việc nhà cần làm nhé!');
      return;
    }

    try {
      const dueAt = new Date(Date.now() + dueHoursOffset * 3600 * 1000).toISOString();

      await createAdhocTask.mutateAsync({
        roomId,
        title: title.trim(),
        category,
        effortPoints,
        dueAt,
        requiresPhoto: effortPoints >= 30,
      });

      Alert.alert('Tạo việc thành công! ⚡', 'Việc nhà đã xuất hiện trên Bounty Board của cả phòng.');
      router.back();
    } catch (err: any) {
      Alert.alert('Lỗi tạo việc', err.message || 'Không thể tạo việc.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-100 flex-row items-center justify-between">
        <Text className="text-xl font-black text-slate-900">Tạo Việc Nhà Mới 📝</Text>
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
        >
          <X size={18} color="#475569" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Task Title Input */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tên công việc
          </Text>
          <TextInput
            className="w-full h-13 px-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:border-[#FF5722] focus:bg-white text-base"
            placeholder="VD: Cọ nhà vệ sinh tầng 2"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Pills */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Phân loại việc
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                className={`flex-row items-center px-3.5 py-2.5 rounded-2xl border ${
                  category === c.id
                    ? 'bg-orange-50 border-[#FF5722]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text className="text-sm mr-1.5">{c.icon}</Text>
                <Text
                  className={`text-xs font-bold ${
                    category === c.id ? 'text-[#FF5722]' : 'text-slate-700'
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Effort Points Preset */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Điểm Effort (Độ vất vả)
            </Text>
            <Text className="text-sm font-black text-[#FF5722]">{effortPoints} điểm</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            {PRESET_POINTS.map((pts) => (
              <Pressable
                key={pts}
                onPress={() => setEffortPoints(pts)}
                className={`w-12 h-12 rounded-2xl items-center justify-center border ${
                  effortPoints === pts
                    ? 'bg-[#FF5722] border-[#FF5722]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  className={`font-black ${
                    effortPoints === pts ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {pts}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Photo requirement indicator */}
          {effortPoints >= 30 ? (
            <View className="flex-row items-center bg-violet-50 border border-violet-200 p-2.5 rounded-xl">
              <Camera size={14} color="#6366F1" />
              <Text className="text-xs font-bold text-indigo-700 ml-1.5">
                Việc ≥ 30 điểm tự động bắt buộc nộp ảnh minh chứng
              </Text>
            </View>
          ) : null}
        </View>

        {/* Due Date & Time offsets */}
        <View className="mb-8">
          <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Hạn chót hoàn thành
          </Text>
          <View className="space-y-2">
            {[
              { hours: 4, label: 'Gấp: Trong 4 giờ tới' },
              { hours: 8, label: 'Hôm nay: Trong 8 giờ tới' },
              { hours: 24, label: 'Ngày mai: Trong 24 giờ tới' },
              { hours: 48, label: 'Cuối tuần: Trong 2 ngày tới' },
            ].map((opt) => (
              <Pressable
                key={opt.hours}
                onPress={() => setDueHoursOffset(opt.hours)}
                className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                  dueHoursOffset === opt.hours
                    ? 'bg-orange-50 border-[#FF5722]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Clock size={16} color={dueHoursOffset === opt.hours ? '#FF5722' : '#64748B'} />
                  <Text
                    className={`text-xs font-bold ml-2 ${
                      dueHoursOffset === opt.hours ? 'text-[#FF5722]' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TactileButton
          title="Đăng Lên Bounty Board ⚡"
          variant="primary"
          size="lg"
          isLoading={createAdhocTask.isPending}
          onPress={handleCreate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
