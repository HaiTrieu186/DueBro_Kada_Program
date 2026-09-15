import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { TaskInstance, getTaskUrgency, MOCK_PROFILES } from '@/lib/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { TactileButton } from '@/components/ui/TactileButton';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChoreCardProps {
  task: TaskInstance;
}

const LEFT_BORDER: Record<string, string> = {
  urgent:  Colors.coral,
  sos:     Colors.red,
  routine: Colors.border,
  bill:    Colors.brand.purpleBorder,
};

export const ChoreCard: React.FC<ChoreCardProps> = ({ task }) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const claimTask = useRoomStore((s) => s.claimTask);
  const submitTask = useRoomStore((s) => s.submitTask);
  const billStatus = useRoomStore((s) => s.billStatus);
  const urgency = getTaskUrgency(task);
  const assignee = task.claimed_by ? MOCK_PROFILES[task.claimed_by] : null;
  const isAssignedToMe = task.claimed_by === user?.id;
  const dueStr = formatDistanceToNow(new Date(task.due_at), { addSuffix: true, locale: vi });
  const dueFormatted = format(new Date(task.due_at), 'HH:mm');

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => router.push(`/chore/${task.id}`);

  // ── BILL variant ──────────────────────────────────────────────
  if (urgency === 'bill') {
    const paid = billStatus[task.id] ?? [];
    const allMembers = ['user-hoang', 'user-nam', 'user-linh', 'user-duc'];
    return (
      <Pressable style={[styles.card, styles.billCard]} onPress={handlePress}>
        <View style={styles.billHeader}>
          <View style={styles.billIcon}>
            <Text style={{ fontSize: 18 }}>⚡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.billTitle} numberOfLines={1}>{task.title}</Text>
            <Text style={styles.billSub}>
              Hạn: {dueStr} • Hóa đơn phòng
            </Text>
          </View>
        </View>
        <View style={styles.billFooter}>
          <Text style={styles.billPaidLabel}>{paid.length}/{allMembers.length} đã đóng</Text>
          <View style={styles.avatarRow}>
            {allMembers.map((uid) => {
              const p = MOCK_PROFILES[uid];
              const hasPaid = paid.includes(uid);
              return (
                <Avatar
                  key={uid}
                  initial={p.avatar_initial}
                  color={hasPaid ? Colors.mint : Colors.surface}
                  size={20}
                  showCheck={hasPaid}
                  showRing
                />
              );
            })}
          </View>
        </View>
      </Pressable>
    );
  }

  // ── URGENT / ROUTINE variant ──────────────────────────────────
  const borderColor = LEFT_BORDER[urgency];
  const isClaimed = task.status === 'claimed' || task.status === 'assigned';
  const isPending = task.status === 'pending_approval';

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={[styles.card, { borderLeftWidth: 4, borderLeftColor: borderColor }]}
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        {/* Top row: badge + points */}
        <View style={styles.topRow}>
          <View style={[
            styles.urgencyBadge,
            { backgroundColor: urgency === 'urgent' || urgency === 'sos'
                ? Colors.coralLight : Colors.surface,
              borderColor: urgency === 'urgent' || urgency === 'sos'
                ? Colors.coralBorder : Colors.border },
          ]}>
            <Text style={[
              styles.urgencyText,
              { color: urgency === 'urgent' || urgency === 'sos' ? Colors.coral : Colors.muted },
            ]}>
              {urgency === 'urgent' ? `URGENT • Due ${dueFormatted}` :
               urgency === 'sos'    ? `🆘 SOS • ${dueStr}` :
               `ROUTINE • Due ${dueFormatted}`}
            </Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+{task.effort_points} PTS</Text>
          </View>
        </View>

        {/* Task name + assignee + action */}
        <View style={styles.bodyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.requires_photo && (
              <Text style={styles.photoTag}>📸 Cần ảnh xác minh</Text>
            )}
            <View style={styles.assigneeRow}>
              {assignee ? (
                <>
                  <Avatar initial={assignee.avatar_initial} color={assignee.avatar_color} size={20} />
                  <Text style={styles.assigneeText}>
                    {assignee.display_name}
                    {isAssignedToMe ? ' • ' : ' • '}
                    <Text style={{ color: Colors.muted, fontStyle: 'italic' }}>
                      {isPending ? 'Chờ duyệt 6h ⏳' :
                       isAssignedToMe ? 'Assigned to You' :
                       urgency === 'urgent' ? 'Bro is watching 💀' : ''}
                    </Text>
                  </Text>
                </>
              ) : (
                <Text style={[styles.assigneeText, { color: Colors.brand.purple }]}>
                  ⚡ Chưa ai nhận — Nhận ngay!
                </Text>
              )}
            </View>
          </View>

          {/* Action button */}
          {!isClaimed && !isPending && task.status === 'open' && (
            <TactileButton
              label="Nhận"
              variant="purple"
              size="sm"
              onPress={() => user && claimTask(task.id, user.id)}
            />
          )}
          {isAssignedToMe && !isPending && (
            <TactileButton
              label="Bấm Done"
              variant="primary"
              size="sm"
              onPress={() => submitTask(task.id)}
            />
          )}
          {isPending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>⏳ Pending</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billCard: {
    backgroundColor: Colors.brand.purpleLight + 'CC',
    borderColor: Colors.brand.purpleBorder,
    borderLeftWidth: 0,
  },
  billHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  billIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.brand.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  billTitle: { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  billSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  billFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.brand.purpleBorder,
  },
  billPaidLabel: { fontSize: 10, fontWeight: '700', color: Colors.brand.purple, textTransform: 'uppercase', letterSpacing: 0.5 },
  avatarRow: { flexDirection: 'row', gap: -4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  urgencyBadge: {
    borderRadius: 100, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  urgencyText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  pointsBadge: {
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  pointsText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  bodyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: Colors.charcoal, lineHeight: 22 },
  photoTag: { fontSize: 11, color: Colors.muted, marginTop: 3 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  assigneeText: { fontSize: 12, color: Colors.charcoal, fontWeight: '500' },
  pendingBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'center',
  },
  pendingText: { fontSize: 11, fontWeight: '700', color: Colors.amber },
});
