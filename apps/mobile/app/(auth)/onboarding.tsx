import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TactileButton } from '../../components/ui/TactileButton';

const POPULAR_DISTRICTS = ['Quận 10', 'Quận 5', 'Bình Thạnh', 'Thủ Đức', 'Cầu Giấy', 'Bách Khoa'];

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setHasCompletedOnboarding = useAuthStore((s) => s.setHasCompletedOnboarding);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [sleepTime, setSleepTime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:30');
  const [cleanlinessLevel, setCleanlinessLevel] = useState(4);
  const [budgetMin, setBudgetMin] = useState('1500000');
  const [budgetMax, setBudgetMax] = useState('3500000');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Quận 10']);
  const [smoking, setSmoking] = useState(false);
  const [petFriendly, setPetFriendly] = useState(true);
  const [bio, setBio] = useState('');

  const toggleDistrict = (district: string) => {
    if (selectedDistricts.includes(district)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập lại.');
      router.replace('/(auth)/login');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Thiếu thông tin', 'Bro ơi, cho tụi mình biết tên hoặc biệt danh nhé!');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update profile display name
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      // 2. Upsert lifestyle profile
      const { error: lifestyleError } = await supabase
        .from('lifestyle_profiles')
        .upsert({
          user_id: user.id,
          sleep_time: sleepTime,
          wake_time: wakeTime,
          cleanliness_level: cleanlinessLevel,
          budget_min: parseInt(budgetMin, 10) || 1500000,
          budget_max: parseInt(budgetMax, 10) || 3500000,
          districts_interested: selectedDistricts,
          smoking,
          pet_friendly: petFriendly,
          bio: bio || 'Sinh viên năng động, thích môi trường sống sạch sẽ văn minh.',
        });

      if (lifestyleError) throw lifestyleError;

      setHasCompletedOnboarding(true);
      Alert.alert('Chào mừng bro!', 'Hồ sơ đã sẵn sàng. Khám phá roommate ngay thôi!');
      router.replace('/(app)');
    } catch (err: any) {
      Alert.alert('Lỗi lưu thông tin', err.message || 'Không thể lưu hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-black text-[#FF5722] tracking-widest uppercase">
            BƯỚC {step} / 4
          </Text>
          <View className="flex-row space-x-1.5">
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                className={`h-2 rounded-full ${
                  i <= step ? 'w-6 bg-[#FF5722]' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </View>
        </View>

        {/* Step 1: Thông tin cơ bản & Giờ giấc */}
        {step === 1 && (
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <Text className="text-2xl font-black text-slate-900 mb-1">
              Nhịp sinh hoạt của Bro ⏰
            </Text>
            <Text className="text-sm text-slate-500 mb-6">
              Thuật toán Matching sẽ ghép người có giờ ngủ - dậy tương đồng để không làm phiền nhau.
            </Text>

            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên hoặc Biệt danh
              </Text>
              <TextInput
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#FF5722]"
                placeholder="VD: Tuấn Kiệt (KietBro)"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Giờ đi ngủ
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#FF5722]"
                  placeholder="23:30"
                  value={sleepTime}
                  onChangeText={setSleepTime}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Giờ thức dậy
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:border-[#FF5722]"
                  placeholder="07:30"
                  value={wakeTime}
                  onChangeText={setWakeTime}
                />
              </View>
            </View>

            <TactileButton
              title="Tiếp tục ➔"
              variant="primary"
              size="lg"
              onPress={() => {
                if (!displayName.trim()) {
                  Alert.alert('Khoan đã bro!', 'Hãy nhập tên hoặc biệt danh trước nhé.');
                  return;
                }
                setStep(2);
              }}
            />
          </View>
        )}

        {/* Step 2: Mức độ gọn gàng */}
        {step === 2 && (
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <Text className="text-2xl font-black text-slate-900 mb-1">
              Độ Gọn Gàng & Sạch Sẽ 🧹
            </Text>
            <Text className="text-sm text-slate-500 mb-6">
              Chọn mức độ phù hợp với thói quen thực tế (1: Thoải mái, 5: Siêu sạch).
            </Text>

            <View className="space-y-3 mb-6">
              {[
                { level: 1, label: 'Mức 1 — Chill thoải mái, bừa chút cuối tuần dọn' },
                { level: 2, label: 'Mức 2 — Tương đối gọn, không quá khắt khe' },
                { level: 3, label: 'Mức 3 — Tiêu chuẩn sinh viên, dùng xong nhớ cất' },
                { level: 4, label: 'Mức 4 — Rất sạch, chén bát rửa ngay sau khi ăn' },
                { level: 5, label: 'Mức 5 — Không tì vết, mọi thứ luôn ngăn nắp chuẩn chỉ' },
              ].map((item) => (
                <Pressable
                  key={item.level}
                  onPress={() => setCleanlinessLevel(item.level)}
                  className={`p-4 rounded-2xl border-2 ${
                    cleanlinessLevel === item.level
                      ? 'border-[#FF5722] bg-orange-50/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      cleanlinessLevel === item.level ? 'text-[#FF5722]' : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <TactileButton
                  title="Quay lại"
                  variant="outline"
                  size="md"
                  onPress={() => setStep(1)}
                />
              </View>
              <View className="flex-1">
                <TactileButton
                  title="Tiếp tục ➔"
                  variant="primary"
                  size="md"
                  onPress={() => setStep(3)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Ngân sách & Khu vực */}
        {step === 3 && (
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <Text className="text-2xl font-black text-slate-900 mb-1">
              Ngân Sách & Khu Vực 📍
            </Text>
            <Text className="text-sm text-slate-500 mb-6">
              Khoảng tiền phòng hàng tháng bạn có thể chi trả (VNĐ / người).
            </Text>

            <View className="flex-row space-x-4 mb-4">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tối thiểu (VNĐ)
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  keyboardType="numeric"
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tối đa (VNĐ)
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                  keyboardType="numeric"
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                />
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Khu vực muốn ở (chọn nhiều)
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {POPULAR_DISTRICTS.map((dist) => {
                const active = selectedDistricts.includes(dist);
                return (
                  <Pressable
                    key={dist}
                    onPress={() => toggleDistrict(dist)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      active
                        ? 'border-[#FF5722] bg-orange-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        active ? 'text-[#FF5722]' : 'text-slate-700'
                      }`}
                    >
                      {active ? `✓ ${dist}` : dist}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <TactileButton
                  title="Quay lại"
                  variant="outline"
                  size="md"
                  onPress={() => setStep(2)}
                />
              </View>
              <View className="flex-1">
                <TactileButton
                  title="Tiếp tục ➔"
                  variant="primary"
                  size="md"
                  onPress={() => setStep(4)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Thói quen & Hoàn thành */}
        {step === 4 && (
          <View className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <Text className="text-2xl font-black text-slate-900 mb-1">
              Thói Quen & Giới Thiệu 🐾
            </Text>
            <Text className="text-sm text-slate-500 mb-6">
              Những tiêu chí quan trọng giúp AI phân tích tương thích và cảnh báo lưu ý.
            </Text>

            <View className="space-y-3 mb-4">
              <Pressable
                onPress={() => setSmoking(!smoking)}
                className={`p-4 rounded-2xl border-2 flex-row justify-between items-center ${
                  smoking ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
                }`}
              >
                <Text className="text-sm font-bold text-slate-800">
                  🚬 Có hút thuốc lá / pod
                </Text>
                <Text className="text-base font-extrabold">
                  {smoking ? '✅ Có' : '❌ Không'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setPetFriendly(!petFriendly)}
                className={`p-4 rounded-2xl border-2 flex-row justify-between items-center ${
                  petFriendly ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
              >
                <Text className="text-sm font-bold text-slate-800">
                  🐶 Nuôi hoặc thích thú cưng
                </Text>
                <Text className="text-base font-extrabold">
                  {petFriendly ? '✅ Thích' : '❌ Không thích'}
                </Text>
              </Pressable>
            </View>

            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vài dòng tự bạch (Bio)
              </Text>
              <TextInput
                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-top"
                multiline
                numberOfLines={3}
                placeholder="VD: Dân IT Bách Khoa, tối hay cày code nhưng không làm ồn, thích nấu nướng..."
                value={bio}
                onChangeText={setBio}
              />
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <TactileButton
                  title="Quay lại"
                  variant="outline"
                  size="md"
                  onPress={() => setStep(3)}
                />
              </View>
              <View className="flex-1">
                <TactileButton
                  title="Hoàn tất hồ sơ 🎉"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  onPress={handleFinish}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
