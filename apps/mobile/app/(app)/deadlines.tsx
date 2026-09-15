import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useRoomStore } from '@/store/roomStore';
import { useAuthStore } from '@/store/authStore';
import { MOCK_PROFILES } from '@/lib/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { formatDistanceToNow, format, isToday, addDays, isWithinInterval } from 'date-fns';
import { vi } from 'date-fns/locale';

const BILL_AMOUNTS: Record<string, string> = {
  'task-003': '480.000đ',
};
const BILL_SPLITS: Record<string, string> = {
  'task-003': '120.000đ/người',
};

export default function DeadlinesScreen() {
  const { tasks, room, billStatus, toggleBillPayment } = useRoomStore();
  const user = useAuthStore((s) => s.user);
  const allMembers = ['user-hoang', 'user-nam', 'user-linh', 'user-duc'];

  const bills = tasks.filter(t => t.source === 'life_deadline');
  const upcomingBills = bills.filter(t => t.status !== 'completed' && t.status !== 'expired');

  const today = new Date();
  const in7Days = addDays(today, 7);

  const urgentBills = upcomingBills.filter(t => isWithinInterval(new Date(t.due_at), { start: today, end: in7Days }));
  const laterBills = upcomingBills.filter(t => new Date(t.due_at) > in7Days);

  const renderBillCard = (task: typeof upcomingBills[0]) => {
    const paid = billStatus[task.id] ?? [];
    const hasMyPaid = user ? paid.includes(user.id) : false;
    const dueDate = new Date(task.due_at);
    const dueStr = formatDistanceToNow(dueDate, { addSuffix: true, locale: vi });
    const dueFormatted = format(dueDate, 'dd/MM/yyyy');
    const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
    const isUrgent = daysLeft <= 3;

    return (
      <View key={task.id} style={[styles.billCard, isUrgent && styles.billCardUrgent]}>
        {/* Top */}
        <View style={styles.billTop}>
          <View style={[styles.billIconWrap, { backgroundColor: isUrgent ? Colors.coralLight : Colors.brand.purpleLight }]}>
            <Text style={{ fontSize: 22 }}>
              {task.title.includes('điện') ? '⚡' :
               task.title.includes('nước') ? '💧' :
               task.title.includes('tiền phòng') ? '🏠' : '📋'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.billName} numberOfLines={2}>{task.title}</Text>
            {BILL_AMOUNTS[task.id] && (
              <Text style={styles.billAmount}>{BILL_AMOUNTS[task.id]}</Text>
            )}
          </View>
          <View style={[styles.countdownBadge, { backgroundColor: isUrgent ? Colors.coralLight : Colors.brand.purpleLight }]}>
            <Text style={[styles.countdownNum, { color: isUrgent ? Colors.coral : Colors.brand.purple }]}>
              {daysLeft}
            </Text>
            <Text style={[styles.countdownLabel, { color: isUrgent ? Colors.coral : Colors.brand.purple }]}>ngày</Text>
          </View>
        </View>

        {/* Due date */}
        <View style={styles.dueDateRow}>
          <Text style={styles.dueLabel}>🗓️ Hạn chót</Text>
          <Text style={[styles.dueValue, isUrgent && { color: Colors.coral, fontWeight: '700' }]}>
            {dueFormatted} ({dueStr})
          </Text>
        </View>

        {/* Payment status */}
        <View style={[styles.paymentRow, { borderTopColor: isUrgent ? Colors.coralBorder : Colors.brand.purpleBorder }]}>
          <Text style={[styles.paymentLabel, { color: isUrgent ? Colors.coral : Colors.brand.purple }]}>
            {paid.length}/{allMembers.length} đã đóng
            {BILL_SPLITS[task.id] && ` • Chia ${BILL_SPLITS[task.id]}`}
          </Text>
          <View style={styles.avatarStack}>
            {allMembers.map(uid => {
              const p = MOCK_PROFILES[uid];
              const hasPaid = paid.includes(uid);
              return (
                <Avatar key={uid} initial={p.avatar_initial} color={hasPaid ? Colors.mint : '#D1D5DB'} size={24} showCheck={hasPaid} showRing />
              );
            })}
          </View>
        </View>

        {/* Interactive payment toggle */}
        {user && (
          <Pressable
            style={[
              styles.payBtn,
              hasMyPaid ? styles.payBtnDone : styles.payBtnAction,
            ]}
            onPress={() => toggleBillPayment(task.id, user.id)}
          >
            <Ionicons
              name={hasMyPaid ? 'checkmark-circle' : 'card-outline'}
              size={17}
              color={hasMyPaid ? Colors.mint : Colors.brand.purple}
            />
            <Text
              style={[
                styles.payBtnText,
                hasMyPaid ? { color: Colors.mint } : { color: Colors.brand.purple },
              ]}
            >
              {hasMyPaid ? 'Bạn đã xác nhận đóng (Nhấn để hủy)' : 'Tôi đã đóng tiền phần này 💸'}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Deadlines</Text>
        <Text style={styles.headerSub}>{room.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {urgentBills.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>🚨 Sắp đến hạn (7 ngày tới)</Text>
            <View style={{ gap: 10 }}>{urgentBills.map(renderBillCard)}</View>
          </View>
        )}

        {laterBills.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>📋 Sắp tới</Text>
            <View style={{ gap: 10 }}>{laterBills.map(renderBillCard)}</View>
          </View>
        )}

        {upcomingBills.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={styles.emptyTitle}>Phòng không có deadline nào!</Text>
            <Text style={styles.emptySub}>Bro tự hào. Thêm hóa đơn định kỳ từ FAB bên Home.</Text>
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Cách hoạt động</Text>
          <Text style={styles.infoText}>
            Bro sẽ nhắc cả phòng trước 2h, đúng hạn, trễ 2h, và trễ 12h với giọng leo thang — Thân thiện → Nghiêm túc → Cà khịa → SOS.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  headerSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  content: { padding: 14, paddingBottom: 40, gap: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },

  billCard: {
    backgroundColor: Colors.brand.purpleLight + 'AA',
    borderRadius: 20, borderWidth: 1, borderColor: Colors.brand.purpleBorder,
    overflow: 'hidden', padding: 14, gap: 10,
  },
  billCardUrgent: {
    backgroundColor: Colors.coralLight,
    borderColor: Colors.coralBorder,
  },
  billTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  billIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  billName: { fontSize: 14, fontWeight: '700', color: Colors.charcoal, lineHeight: 20 },
  billAmount: { fontSize: 16, fontWeight: '800', color: Colors.brand.purple, marginTop: 2 },
  countdownBadge: {
    alignItems: 'center', padding: 8, borderRadius: 12,
    minWidth: 48,
  },
  countdownNum: { fontSize: 22, fontWeight: '800', lineHeight: 24 },
  countdownLabel: { fontSize: 10, fontWeight: '600' },
  dueDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueLabel: { fontSize: 12, color: Colors.muted, fontWeight: '500' },
  dueValue: { fontSize: 12, color: Colors.charcoal, fontWeight: '600' },
  paymentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1,
  },
  paymentLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  avatarStack: { flexDirection: 'row', gap: -4 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  payBtnAction: {
    backgroundColor: Colors.brand.purpleLight,
    borderColor: Colors.brand.purpleBorder,
  },
  payBtnDone: {
    backgroundColor: Colors.mintLight,
    borderColor: Colors.mint,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.charcoal },
  emptySub: { fontSize: 13, color: Colors.muted, textAlign: 'center' },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.charcoal, marginBottom: 6 },
  infoText: { fontSize: 13, color: Colors.muted, lineHeight: 20 },
});
