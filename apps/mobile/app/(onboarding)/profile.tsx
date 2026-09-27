import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { profileApi } from '../../src/modules/profile/api';
import { TactileButton } from '../../src/ui/TactileButton';
import type { OccupationType, MatchIntent, Gender, GenderPref, GuestFrequency } from '@duebro/shared-types';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setHasCompletedOnboarding = useAuthStore((s) => s.setHasCompletedOnboarding);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form Step 1: Về bạn
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [gender, setGender] = useState<Gender>('male');
  const [occupation, setOccupation] = useState<OccupationType>('student');
  const [city, setCity] = useState('TP. Hồ Chí Minh');
  const [district, setDistrict] = useState('Quận 10');
  const [intent, setIntent] = useState<MatchIntent>('seeking_roommate');

  // Form Step 2: Nhịp sống
  const [wakeUpTime, setWakeUpTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:30');

  // Form Step 3: Sinh hoạt
  const [tidinessLevel, setTidinessLevel] = useState(4);
  const [noiseTolerance, setNoiseTolerance] = useState(3);
  const [smokes, setSmokes] = useState(false);
  const [hasPet, setHasPet] = useState(false);
  const [guestFrequency, setGuestFrequency] = useState<GuestFrequency>('sometimes');

  // Form Step 4: Ngân sách & Mong muốn
  const [budgetMin, setBudgetMin] = useState('1500000');
  const [budgetMax, setBudgetMax] = useState('3500000');
  const [genderPref, setGenderPref] = useState<GenderPref>('any');
  const [bio, setBio] = useState('Sinh viên năng động, sống gọn gàng và tôn trọng không gian chung.');

  const handleFinish = async () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập lại.');
      router.replace('/(auth)/welcome');
      return;
    }

    if (!displayName.trim()) {
      Alert.alert('Thiếu thông tin', 'Bro ơi, cho tụi mình biết tên hoặc biệt danh nhé!');
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      await profileApi.saveLifestyleProfile(user.id, {
        displayName: displayName.trim(),
        intent,
        city: city.trim(),
        district: district.trim(),
        gender,
        gender_pref: genderPref,
        occupation_type: occupation,
        wake_up_time: wakeUpTime,
        sleep_time: sleepTime,
        budget_min: parseInt(budgetMin, 10) || 1500000,
        budget_max: parseInt(budgetMax, 10) || 3500000,
        tidiness_level: tidinessLevel,
        noise_tolerance: noiseTolerance,
        smokes,
        has_pet: hasPet,
        guest_frequency: guestFrequency,
        bio: bio.trim(),
      });

      setProfile({
        id: user.id,
        display_name: displayName.trim(),
      });
      setHasCompletedOnboarding(true);

      Alert.alert(
        'Chào mừng bro! 🎉',
        'Hồ sơ đã sẵn sàng. Khám phá roommate và việc nhà ngay thôi!',
        [
          {
            text: 'Bắt đầu ngay 🚀',
            onPress: () => {
              router.replace('/(tabs)/home');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Lỗi lưu hồ sơ', err.message || 'Không thể lưu hồ sơ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress header */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-black text-[#6C4DFF] tracking-widest uppercase">
            BƯỚC {step} / 4
          </Text>
          <Text className="text-xs font-bold text-slate-400">
            {step === 1 ? 'Về bạn' : step === 2 ? 'Nhịp sống' : step === 3 ? 'Sinh hoạt' : 'Ngân sách'}
          </Text>
        </View>

        {/* Step progress bar */}
        <View className="h-1.5 w-full bg-slate-200 rounded-full mb-6 overflow-hidden">
          <View
            className="h-full bg-[#6C4DFF] rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </View>

        {/* Step 1: Về bạn */}
        {step === 1 && (
          <View className="space-y-4">
            <View>
              <Text className="text-2xl font-black text-slate-900">Bro là ai? 🙋</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Cho mọi người biết danh tính và vị trí của bạn.
              </Text>
            </View>

            <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">Tên hiển thị</Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                  placeholder="VD: Minh Đức"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">Nghề nghiệp</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { val: 'student', label: 'Sinh viên' },
                    { val: 'worker', label: 'Đi làm' },
                    { val: 'freelancer', label: 'Freelancer' },
                    { val: 'other', label: 'Khác' },
                  ].map((item) => (
                    <Pressable
                      key={item.val}
                      onPress={() => setOccupation(item.val as OccupationType)}
                      className={`px-3.5 py-2 rounded-xl border ${
                        occupation === item.val
                          ? 'bg-[#EDE9FE] border-[#6C4DFF]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          occupation === item.val ? 'text-[#6C4DFF]' : 'text-slate-600'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">Thành phố & Quận</Text>
                <View className="flex-row space-x-2">
                  <TextInput
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                    placeholder="Thành phố"
                    value={city}
                    onChangeText={setCity}
                  />
                  <TextInput
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                    placeholder="Quận / Huyện"
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">Mục đích</Text>
                <View className="flex-row space-x-2">
                  {[
                    { val: 'seeking_roommate', label: '🔍 Tìm bạn ở ghép' },
                    { val: 'has_room', label: '🏠 Đã có phòng' },
                  ].map((item) => (
                    <Pressable
                      key={item.val}
                      onPress={() => setIntent(item.val as MatchIntent)}
                      className={`flex-1 p-3 rounded-xl border ${
                        intent === item.val
                          ? 'bg-[#EDE9FE] border-[#6C4DFF]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          intent === item.val ? 'text-[#6C4DFF]' : 'text-slate-600'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Nhịp sống */}
        {step === 2 && (
          <View className="space-y-4">
            <View>
              <Text className="text-2xl font-black text-slate-900">Giờ giấc sinh hoạt ⏰</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Thuật toán so khớp vòng tròn 24h giúp tránh lệch múi giờ gây lục đục.
              </Text>
            </View>

            <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Giờ thức dậy (HH:MM)
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                  placeholder="07:00"
                  value={wakeUpTime}
                  onChangeText={setWakeUpTime}
                />
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Giờ đi ngủ (HH:MM)
                </Text>
                <TextInput
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                  placeholder="23:30"
                  value={sleepTime}
                  onChangeText={setSleepTime}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Sinh hoạt */}
        {step === 3 && (
          <View className="space-y-4">
            <View>
              <Text className="text-2xl font-black text-slate-900">Thói quen hàng ngày 🧹</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Độ gọn gàng và yên tĩnh bạn mong muốn ở bạn cùng phòng.
              </Text>
            </View>

            <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-xs font-bold text-slate-700 uppercase">
                    Độ gọn gàng (1: Thoải mái → 5: Rất sạch)
                  </Text>
                  <Text className="text-sm font-black text-[#6C4DFF]">{tidinessLevel}/5</Text>
                </View>
                <View className="flex-row justify-between">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <Pressable
                      key={lvl}
                      onPress={() => setTidinessLevel(lvl)}
                      className={`w-12 h-12 rounded-2xl items-center justify-center border ${
                        tidinessLevel === lvl
                          ? 'bg-[#6C4DFF] border-[#6C4DFF]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`font-black ${
                          tidinessLevel === lvl ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {lvl}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                <View>
                  <Text className="text-sm font-bold text-slate-800">Hút thuốc 🚬</Text>
                  <Text className="text-xs text-slate-400">Bạn có hút thuốc lá / pod không?</Text>
                </View>
                <Switch
                  value={smokes}
                  onValueChange={setSmokes}
                  trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
                  thumbColor={smokes ? '#6C4DFF' : '#F1F5F9'}
                />
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                <View>
                  <Text className="text-sm font-bold text-slate-800">Nuôi thú cưng 🐾</Text>
                  <Text className="text-xs text-slate-400">Có mang thú cưng theo không?</Text>
                </View>
                <Switch
                  value={hasPet}
                  onValueChange={setHasPet}
                  trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
                  thumbColor={hasPet ? '#6C4DFF' : '#F1F5F9'}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Ngân sách & Bio */}
        {step === 4 && (
          <View className="space-y-4">
            <View>
              <Text className="text-2xl font-black text-slate-900">Ngân sách & Giới thiệu 💰</Text>
              <Text className="text-xs text-slate-500 mt-1">
                Mức tiền thuê phòng mong muốn mỗi tháng (VND).
              </Text>
            </View>

            <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Khoảng ngân sách (VND / tháng)
                </Text>
                <View className="flex-row space-x-2">
                  <TextInput
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                    placeholder="Min (1500000)"
                    keyboardType="numeric"
                    value={budgetMin}
                    onChangeText={setBudgetMin}
                  />
                  <TextInput
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                    placeholder="Max (3500000)"
                    keyboardType="numeric"
                    value={budgetMax}
                    onChangeText={setBudgetMax}
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Lời giới thiệu bản thân (Bio ≤ 300 chữ)
                </Text>
                <TextInput
                  className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:border-[#6C4DFF] focus:bg-white"
                  multiline
                  textAlignVertical="top"
                  placeholder="Chia sẻ một chút về tính cách, thói quen của bro..."
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
            </View>
          </View>
        )}

        {/* Bottom Navigation Buttons */}
        <View className="flex-row justify-between items-center mt-6">
          {step > 1 ? (
            <TactileButton
              title="Quay lại"
              variant="outline"
              size="md"
              onPress={() => setStep(step - 1)}
            />
          ) : <View />}

          {step < 4 ? (
            <TactileButton
              title="Tiếp theo ➡️"
              variant="primary"
              size="md"
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <TactileButton
              title="Hoàn Tất & Vào App 🎉"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleFinish}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
