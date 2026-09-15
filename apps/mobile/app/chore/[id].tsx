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
  const { tasks, claimTask, submitTask, disputeTask, nudgeTask } = useRoomStore();
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
    Alert.alert('🆘 SOS Swap', 'Đăng task lên bảng Bounty để ai đó làm hộ?\nBạn không bị tính trễ hạn.', [
      { text: 'Thôi', style: 'cancel' },
      { text: 'Cứu bồ!', onPress: () => Alert.alert('📢 Đã broadcast!', 'Task được đẩy lên Bounty Board. Ai nhận làm hộ sẽ nhận 100% + bonus karma.') },
    ]);
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

          {/* Assigned to me: Done */}
          {isAssignedToMe && (task.status === 'claimed' || task.status === 'assigned') && (
            <TactileButton
              label="✅ Bấm Done"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleDone}
            />
          )}

          {/* Others: nudge + dispute */}
          {!isAssignedToMe && assignee && task.status !== 'pending_approval' && task.status !== 'completed' && (
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

          {/* Assigned to me: SOS swap */}
          {isAssignedToMe && (
            <TactileButton
              label="🆘 Bro ơi, cứu bồ!"
              variant="ghost"
              size="md"
              fullWidth
              onPress={handleSOS}
            />
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
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14, padding: 12,
  },
  noteText: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
});
