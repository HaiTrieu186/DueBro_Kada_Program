import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRoomStore } from '@/store/roomStore';
import { useAuthStore } from '@/store/authStore';
import { MOCK_PROFILES, getTaskUrgency, BRO_MESSAGES, EscalationLevel } from '@/lib/mockData';
import { TactileButton } from '@/components/ui/TactileButton';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { tasks, claimTask, submitTask, disputeTask, nudgeTask, approveTask, requestSwap } = useRoomStore();
  const [photoUploaded, setPhotoUploaded] = useState(false);

  const task = tasks.find(t => t.id === id);

  if (!task) return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.notFound}>Task không tồn tại 🤔</Text>
    </SafeAreaView>
  );

  const assignee = task.claimed_by ? MOCK_PROFILES[task.claimed_by] : null;
  const urgency = getTaskUrgency(task);
  const isAssignedToMe = task.claimed_by === user?.id;
  const dueStr = formatDistanceToNow(new Date(task.due_at), { addSuffix: true, locale: vi });
  const dueFormatted = format(new Date(task.due_at), 'HH:mm dd/MM/yyyy');

  const urgencyColor = urgency === 'urgent' || urgency === 'sos' ? Colors.coral : Colors.brand.purple;
  const urgencyBg = urgency === 'urgent' || urgency === 'sos' ? Colors.coralLight : Colors.brand.purpleLight;

  const handleDone = () => {
    if (task.requires_photo && !photoUploaded) {
      Alert.alert('📸 Cần ảnh xác minh!', 'Task này yêu cầu upload ảnh trước khi bấm Done.', [
        { text: 'OK', onPress: () => setPhotoUploaded(true) },
      ]);
      return;
    }
    submitTask(task.id);
    Alert.alert('⏳ Submitted!', 'Task đang chờ phê duyệt 6 giờ. Nếu không ai dispute thì Bro tự duyệt!');
    router.back();
  };

  const handleNudge = () => {
    nudgeTask(task.id);
    Alert.alert('🔔 Đã nhắc ẩn danh!', 'Bro đã nhắc nhẹ người phụ trách. Danh tính bạn được bảo mật 100% 🤫');
  };

  const handleDispute = () => {
    Alert.alert(
      '👀 Khiếu nại ẩn danh',
      'Bro sẽ gửi thông điệp trung gian cho người làm task. Danh tính bạn tuyệt đối bảo mật.',
      [
        { text: 'Thôi', style: 'cancel' },
        {
          text: 'Chưa sạch!',
          style: 'destructive',
          onPress: () => {
            disputeTask(task.id);
            Alert.alert('✅ Đã gửi!', 'Bro đã thông báo cho người phụ trách kiểm tra lại.');
            router.back();
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    Alert.alert('🆘 SOS Swap', 'Đăng task lên bảng Bounty để ai đó làm hộ?\nNgười nhận hộ sẽ được x1.5 điểm.', [
      { text: 'Thôi', style: 'cancel' },
      {
        text: 'Cứu bồ!',
        onPress: () => {
          requestSwap(task.id);
          Alert.alert('📢 Đã broadcast!', 'Task đã được đẩy lên Bounty Board với phần thưởng x1.5 điểm!');
          router.back();
        },
      },
    ]);
  };

  const handleApprove = () => {
    approveTask(task.id);
    Alert.alert('🎉 Đã duyệt hoàn thành!', 'Cộng điểm và Karma thành công cho người thực hiện!');
    router.back();
  };

  const handleClaim = () => {
    if (!user) return;
    claimTask(task.id, user.id);
    Alert.alert('✅ Đã nhận!', `+10% bonus điểm cho ${user.display_name} vì tự nguyện nhận! 🎉`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi Tiết Task</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Urgency banner */}
        <View style={[styles.urgencyBanner, { backgroundColor: urgencyBg, borderColor: urgency === 'urgent' || urgency === 'sos' ? Colors.coralBorder : Colors.brand.purpleBorder }]}>
          <Text style={[styles.urgencyText, { color: urgencyColor }]}>
            {urgency === 'urgent' ? '🔴 URGENT — Sắp đến hạn!' :
             urgency === 'sos'    ? '🆘 SOS — Đã quá hạn! Ai giải cứu +1.5x điểm' :
             urgency === 'bill'   ? '💡 Hóa đơn sinh hoạt' :
             '📋 Routine Task'}
          </Text>
        </View>

        {/* Task info card */}
        <View style={styles.infoCard}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsValue}>+{task.effort_points}</Text>
            <Text style={styles.pointsUnit}>PTS</Text>
            {task.bonus_multiplier > 1 && (
              <Text style={styles.bonusBadge}>x{task.bonus_multiplier}</Text>
            )}
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="folder-outline" size={14} color={Colors.muted} />
              <Text style={styles.metaText}>{task.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={urgency === 'urgent' || urgency === 'sos' ? Colors.coral : Colors.muted} />
              <Text style={[styles.metaText, (urgency === 'urgent' || urgency === 'sos') && { color: Colors.coral, fontWeight: '700' }]}>
                {dueFormatted} ({dueStr})
              </Text>
            </View>
            {task.requires_photo && (
              <View style={styles.metaItem}>
                <Ionicons name="camera-outline" size={14} color={Colors.muted} />
                <Text style={styles.metaText}>Cần ảnh xác minh</Text>
              </View>
            )}
            {task.nudge_count > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="notifications-outline" size={14} color={Colors.brand.purple} />
                <Text style={[styles.metaText, { color: Colors.brand.purple }]}>{task.nudge_count} người đã nhắc ẩn danh</Text>
              </View>
            )}
          </View>
        </View>

        {/* Assignee */}
        {assignee && (
          <View style={styles.assigneeCard}>
            <Text style={styles.assigneeLabel}>Người phụ trách</Text>
            <View style={styles.assigneeRow}>
              <Avatar initial={assignee.avatar_initial} color={assignee.avatar_color} size={40} />
              <View>
                <Text style={styles.assigneeName}>{assignee.display_name}</Text>
                <Text style={styles.assigneeStatus}>
                  {task.status === 'pending_approval' ? '⏳ Chờ phê duyệt 6h' :
                   task.status === 'disputed'          ? '⚠️ Đang tranh chấp' :
                   isAssignedToMe                      ? '✋ Đang là của bạn' :
                   '🔨 Đang thực hiện'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Photo proof */}
        {task.requires_photo && isAssignedToMe && (
          <Pressable
            style={[styles.photoArea, photoUploaded && styles.photoUploaded]}
            onPress={() => setPhotoUploaded(!photoUploaded)}
          >
            <Ionicons
              name={photoUploaded ? 'checkmark-circle' : 'camera-outline'}
              size={32}
              color={photoUploaded ? Colors.mint : Colors.muted}
            />
            <Text style={[styles.photoText, photoUploaded && { color: Colors.mint }]}>
              {photoUploaded ? '✅ Ảnh đã upload!' : '📸 Chụp ảnh xác minh'}
            </Text>
            <Text style={styles.photoSub}>
              {photoUploaded ? 'Nhấn để chụp lại' : 'Task này ≥30 điểm, cần ảnh minh chứng'}
            </Text>
          </Pressable>
        )}

        {/* Bro message */}
        {task.last_escalation_level && (
          <View style={styles.broMessage}>
            <Text style={styles.broMsgLabel}>🧢 Bro nhắn:</Text>
            <Text style={styles.broMsgText}>
              {BRO_MESSAGES[task.last_escalation_level as EscalationLevel]?.[0]
                ?.replace('{task}', task.title)
                ?.replace('{name}', assignee?.display_name ?? 'Bro')
                ?.replace('{pts}', `${task.effort_points}`)}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Not claimed yet */}
          {task.status === 'open' && (
            <TactileButton
              label="⚡ Nhận Task Này (+10% bonus)"
              variant="purple"
              size="lg"
              fullWidth
              onPress={handleClaim}
            />
          )}

          {/* Assigned to me: In progress */}
          {isAssignedToMe && (task.status === 'claimed' || task.status === 'assigned') && (
            <>
              <TactileButton
                label="✅ Bấm Done"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleDone}
              />
              <TactileButton
                label="🆘 Bro ơi, cứu bồ!"
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleSOS}
              />
            </>
          )}

          {/* Others: In progress -> nudge or dispute */}
          {!isAssignedToMe && assignee && (task.status === 'claimed' || task.status === 'assigned') && (
            <>
              <TactileButton
                label="🔔 Bro ơi, nhắc nhẹ cái (ẩn danh)"
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleNudge}
              />
              <TactileButton
                label="👀 Chưa sạch!"
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleDispute}
              />
            </>
          )}

          {/* Pending approval: Roommate can approve or dispute */}
          {task.status === 'pending_approval' && !isAssignedToMe && (
            <>
              <TactileButton
                label="🎉 Duyệt Hoàn Thành (+Điểm & Karma)"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleApprove}
              />
              <TactileButton
                label="👀 Chưa sạch! (Khiếu nại ẩn danh)"
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleDispute}
              />
            </>
          )}

          {/* Pending approval: I am assignee */}
          {task.status === 'pending_approval' && isAssignedToMe && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerTitle}>⏳ Đang chờ duyệt</Text>
              <Text style={styles.statusBannerSub}>
                Bạn cùng phòng có 6h để duyệt hoặc khiếu nại. Sau 6h hệ thống sẽ tự động duyệt cộng điểm!
              </Text>
            </View>
          )}

          {/* Disputed state */}
          {task.status === 'disputed' && isAssignedToMe && (
            <>
              <TactileButton
                label="🔄 Đã dọn lại — Bấm Done"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleDone}
              />
              <TactileButton
                label="🆘 Bro ơi, cứu bồ!"
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleSOS}
              />
            </>
          )}

          {task.status === 'disputed' && !isAssignedToMe && (
            <View style={[styles.statusBanner, { backgroundColor: Colors.coralLight, borderColor: Colors.coralBorder }]}>
              <Text style={[styles.statusBannerTitle, { color: Colors.coral }]}>⚠️ Đang khiếu nại</Text>
              <Text style={[styles.statusBannerSub, { color: Colors.coral }]}>
                Đã gửi yêu cầu người phụ trách kiểm tra và dọn dẹp lại.
              </Text>
            </View>
          )}

          {/* Completed state */}
          {task.status === 'completed' && (
            <View style={[styles.statusBanner, { backgroundColor: Colors.mintLight, borderColor: Colors.mint }]}>
              <Text style={[styles.statusBannerTitle, { color: Colors.mint }]}>🎉 Task đã hoàn thành!</Text>
              <Text style={[styles.statusBannerSub, { color: Colors.charcoal }]}>
                Điểm công sức và Karma đã được ghi nhận vào bảng xếp hạng.
              </Text>
            </View>
          )}
        </View>

        {/* Info note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            💡 Khi bấm Done, task sẽ chờ phê duyệt 6h. Nếu không ai dispute → Bro tự động cộng điểm.
            Mọi nudge và dispute đều ẩn danh 100%.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  notFound: { fontSize: 18, textAlign: 'center', marginTop: 100, color: Colors.muted },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 100,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.charcoal, flex: 1, textAlign: 'center' },
  content: { padding: 14, gap: 12, paddingBottom: 40 },

  urgencyBanner: {
    borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center',
  },
  urgencyText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 22, borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 10,
  },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
  },
  pointsValue: { fontSize: 40, fontWeight: '800', color: Colors.charcoal, lineHeight: 44 },
  pointsUnit: { fontSize: 16, fontWeight: '700', color: Colors.muted },
  bonusBadge: {
    fontSize: 13, fontWeight: '700', color: Colors.mint,
    backgroundColor: Colors.mintLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  taskTitle: { fontSize: 22, fontWeight: '800', color: Colors.charcoal, lineHeight: 28 },
  metaRow: { gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: Colors.muted, fontWeight: '500' },

  assigneeCard: {
    backgroundColor: Colors.card,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 10,
  },
  assigneeLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assigneeName: { fontSize: 16, fontWeight: '700', color: Colors.charcoal },
  assigneeStatus: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  photoArea: {
    backgroundColor: Colors.card,
    borderRadius: 18, borderWidth: 2, borderColor: Colors.border,
    borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 8,
  },
  photoUploaded: { borderColor: Colors.mint, backgroundColor: Colors.mintLight },
  photoText: { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  photoSub: { fontSize: 12, color: Colors.muted },

  broMessage: {
    backgroundColor: Colors.brand.purpleLight,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.brand.purpleBorder,
    padding: 14, gap: 4,
  },
  broMsgLabel: { fontSize: 11, fontWeight: '700', color: Colors.brand.purple, textTransform: 'uppercase', letterSpacing: 0.5 },
  broMsgText: { fontSize: 14, color: Colors.charcoal, lineHeight: 22 },

  actions: { gap: 10 },
  statusBanner: {
    backgroundColor: Colors.brand.purpleLight,
    borderWidth: 1,
    borderColor: Colors.brand.purpleBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statusBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.purple,
    textAlign: 'center',
  },
  statusBannerSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14, padding: 12,
  },
  noteText: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
});
