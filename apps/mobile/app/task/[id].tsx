import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Clock, AlertTriangle, CheckCircle, ShieldAlert, LifeBuoy } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useTaskDetail, useHouseholdMutations } from '../../src/modules/household/hooks';
import { CategoryBadge, EffortBadge, StatusBadge } from '../../src/ui/Badge';
import { PhotoAttachmentCard } from '../../src/ui/PhotoAttachmentCard';
import { TactileButton } from '../../src/ui/TactileButton';
import { getRemainingTime, formatVnDate } from '../../src/lib/time';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const activeRoom = useAuthStore((s) => s.activeRoom);

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [selectedReasonCode, setSelectedReasonCode] = useState<'not_clean' | 'missing_photo' | 'wrong_task' | 'other'>('not_clean');
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  const { data: detail, isLoading, refetch } = useTaskDetail(id);
  const task = detail?.task;
  const roomId = task?.room_id || activeRoom?.id;

  const {
    claimTask,
    submitTaskWithPhoto,
    requestNudge,
    disputeTask,
    requestSwap,
    resolveDispute,
  } = useHouseholdMutations(roomId);

  if (isLoading || !task) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF9] items-center justify-center">
        <ActivityIndicator size="large" color="#6C4DFF" />
        <Text className="text-xs text-slate-400 mt-2">Đang tải thông tin việc nhà...</Text>
      </SafeAreaView>
    );
  }

  const isMyTask = task.claimed_by === user?.id;
  const isRoommate = !isMyTask && !!task.claimed_by;
  const isHost = activeRoom?.role === 'host';
  const timeInfo = getRemainingTime(task.due_at);

  const handleClaim = async () => {
    try {
      await claimTask.mutateAsync(task.id);
      Alert.alert('Nhận việc thành công! ⚡', 'Bạn nhận việc tự nguyện (+10% điểm Effort).');
      refetch();
    } catch (err: any) {
      Alert.alert('Không thể nhận việc', err.message);
    }
  };

  const handlePickAndSubmitPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền máy ảnh để chụp ảnh minh chứng.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setIsSubmittingPhoto(true);
        await submitTaskWithPhoto.mutateAsync({
          taskId: task.id,
          roomId: task.room_id,
          imageUri: result.assets[0].uri,
        });
        Alert.alert('Nộp việc thành công! 📸', 'Ảnh minh chứng đã được gửi để các bạn cùng phòng kiểm tra.');
        refetch();
      }
    } catch (err: any) {
      Alert.alert('Lỗi nộp việc', err.message);
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleNudge = async () => {
    try {
      await requestNudge.mutateAsync(task.id);
      Alert.alert('Đã gửi lời nhắc! 🤖', 'Bro đã nhắc nhở bạn cùng phòng một cách hoàn toàn ẩn danh.');
      refetch();
    } catch (err: any) {
      Alert.alert('Chưa thể nhắc', err.message);
    }
  };

  const handleDispute = async () => {
    try {
      await disputeTask.mutateAsync({
        taskId: task.id,
        reasonCode: selectedReasonCode,
      });
      setDisputeModalVisible(false);
      Alert.alert('Đã báo chưa đạt ⚠️', 'Ý kiến khiếu nại ẩn danh đã được ghi nhận. Bạn làm việc sẽ cần hoàn thiện lại.');
      refetch();
    } catch (err: any) {
      Alert.alert('Lỗi khiếu nại', err.message);
    }
  };

  const handleRequestSwap = async () => {
    Alert.alert(
      'Phát tín hiệu SOS cứu hộ 🚨',
      'Yêu cầu đổi việc sẽ được gửi cho cả phòng. Thành viên nhận giúp sẽ được thưởng thêm Effort & Karma khi hoàn thành.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi SOS ngay',
          onPress: async () => {
            try {
              await requestSwap.mutateAsync(task.id);
              Alert.alert('Đã gửi SOS! 🚨', 'Hy vọng có bro trong nhà ra tay cứu hộ sớm.');
              refetch();
            } catch (err: any) {
              Alert.alert('Lỗi gửi SOS', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Curved Header inspired by ui-example Image 5 Screen 3 */}
      <View className="bg-[#6C4DFF] px-5 pt-3 pb-6 rounded-b-3xl shadow-md">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 active:bg-white/30 items-center justify-center"
          >
            <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text className="text-white font-extrabold text-base">Chi Tiết Việc Nhà</Text>
          <StatusBadge status={task.status} size="sm" />
        </View>

        {/* Task Title Banner */}
        <Text className="text-2xl font-black text-white leading-tight mb-2">
          {task.title}
        </Text>

        <View className="flex-row items-center flex-wrap gap-2">
          <CategoryBadge category={task.category} size="sm" />
          <EffortBadge points={task.effort_points} bonus={task.status === 'open'} size="sm" />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Timing info */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Clock size={16} color="#64748B" />
              <Text className="text-xs font-bold text-slate-700 ml-2">Hạn chót hoàn thành</Text>
            </View>
            <Text className="text-xs font-black text-slate-900">
              {formatVnDate(task.due_at)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-slate-500 font-medium">Tình trạng hạn</Text>
            <Text
              className={`text-xs font-extrabold ${
                timeInfo.isOverdue ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {timeInfo.isOverdue ? `⚠️ ${timeInfo.label}` : `⏱️ ${timeInfo.label}`}
            </Text>
          </View>
        </View>

        {/* Photo Proof Attachment */}
        <PhotoAttachmentCard
          photoUrl={detail?.photoSignedUrl}
          status={
            task.status === 'completed'
              ? 'approved'
              : task.status === 'disputed'
              ? 'disputed'
              : 'pending'
          }
          canUpload={isMyTask && (task.status === 'claimed' || task.status === 'assigned' || task.status === 'disputed')}
          onPressUpload={handlePickAndSubmitPhoto}
        />

        {/* Dispute Notice Banner if disputed */}
        {task.status === 'disputed' && (
          <View className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-1">
              <AlertTriangle size={18} color="#E11D48" />
              <Text className="text-sm font-black text-rose-900 ml-2">
                Việc đang bị báo chưa đạt ⚠️
              </Text>
            </View>
            <Text className="text-xs text-rose-800 leading-relaxed">
              Bạn cùng phòng đã gửi phản hồi ẩn danh: Việc cần được dọn sạch/làm kỹ hơn và chụp ảnh nộp lại.
            </Text>
          </View>
        )}

        {/* Action Button Section */}
        <View className="space-y-3 mt-2">
          {/* 1. Open task: Claim Button */}
          {task.status === 'open' && (
            <TactileButton
              title="Nhận Việc Tự Nguyện (+10% Effort) ⚡"
              variant="primary"
              size="lg"
              isLoading={claimTask.isPending}
              onPress={handleClaim}
            />
          )}

          {/* 2. Worker Actions: Submit Photo & SOS Swap */}
          {isMyTask && ['claimed', 'assigned', 'disputed'].includes(task.status) && (
            <View className="space-y-2.5">
              <TactileButton
                title={isSubmittingPhoto ? 'Đang tải ảnh...' : 'Chụp Ảnh & Nộp Việc 📸'}
                variant="primary"
                size="lg"
                isLoading={isSubmittingPhoto}
                onPress={handlePickAndSubmitPhoto}
              />
              <TactileButton
                title="Nhờ Cứu Hộ (SOS Swap) 🚨"
                variant="outline"
                size="md"
                onPress={handleRequestSwap}
              />
            </View>
          )}

          {/* 3. Roommate Actions: Nudge & Dispute */}
          {isRoommate && task.status === 'pending_approval' && (
            <View className="space-y-2.5">
              <TactileButton
                title="Báo Chưa Đạt (Ẩn Danh) ⚠️"
                variant="danger"
                size="lg"
                onPress={() => setDisputeModalVisible(true)}
              />
              <TactileButton
                title="Bro Nhắc Giúp 🤖"
                variant="outline"
                size="md"
                onPress={handleNudge}
              />
            </View>
          )}

          {/* 4. Host Resolution for 2-dispute tasks */}
          {isHost && task.status === 'disputed' && (
            <View className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mt-2 space-y-2">
              <Text className="text-xs font-black text-amber-900 uppercase">
                Quyền Host Phân Xử Dispute
              </Text>
              <View className="flex-row space-x-2">
                <TactileButton
                  title="Chấp nhận khiếu nại"
                  variant="danger"
                  size="sm"
                  onPress={() => resolveDispute.mutate({ taskId: task.id, decision: 'uphold' })}
                />
                <TactileButton
                  title="Bác bỏ khiếu nại"
                  variant="success"
                  size="sm"
                  onPress={() => resolveDispute.mutate({ taskId: task.id, decision: 'dismiss' })}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dispute Reason Selection Modal */}
      <Modal visible={disputeModalVisible} transparent animationType="slide" onRequestClose={() => setDisputeModalVisible(false)}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-black text-slate-900 mb-1">
              Báo Việc Chưa Đạt ⚠️
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Bro sẽ nhắc giúp một cách hoàn toàn ẩn danh. Người làm sẽ không biết ai gửi ý kiến.
            </Text>

            <View className="space-y-2 mb-6">
              {[
                { code: 'not_clean', label: '🧹 Chưa sạch sẽ, chưa đạt yêu cầu' },
                { code: 'missing_photo', label: '📸 Thiếu ảnh minh chứng rõ ràng' },
                { code: 'wrong_task', label: '❌ Làm nhầm việc / nhầm vị trí' },
                { code: 'other', label: '✨ Lý do khác' },
              ].map((reason) => (
                <Pressable
                  key={reason.code}
                  onPress={() => setSelectedReasonCode(reason.code as any)}
                  className={`p-3.5 rounded-2xl border ${
                    selectedReasonCode === reason.code
                      ? 'bg-[#EDE9FE] border-[#6C4DFF]'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-extrabold ${
                      selectedReasonCode === reason.code ? 'text-[#6C4DFF]' : 'text-slate-700'
                    }`}
                  >
                    {reason.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row space-x-3">
              <TactileButton
                title="Hủy"
                variant="outline"
                size="md"
                onPress={() => setDisputeModalVisible(false)}
                style={{ flex: 1 }}
              />
              <TactileButton
                title="Gửi Khiếu Nại"
                variant="danger"
                size="md"
                isLoading={disputeTask.isPending}
                onPress={handleDispute}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
