import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { AppHeader } from '@/components/layout/AppHeader';
import { BroHeroCard } from '@/components/bro/BroHeroCard';
import { ChoreCard } from '@/components/chore/ChoreCard';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { getTaskUrgency } from '@/lib/mockData';

type FilterKey = 'all' | 'mine' | 'bills';
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',   label: 'Tất cả' },
  { key: 'mine',  label: 'Của tôi' },
  { key: 'bills', label: 'Hóa đơn 💡' },
];

export default function ChoreHubScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { room, tasks, weeklyProgress } = useRoomStore();
  const [filter, setFilter] = useState<FilterKey>('all');

  const myProgress = weeklyProgress.find((w) => w.member_id === user?.id);
  const urgentCount = tasks.filter((t) => {
    const u = getTaskUrgency(t);
    return (u === 'urgent' || u === 'sos') && t.status !== 'completed';
  }).length;

  const filteredTasks = tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'expired') return false;
    if (filter === 'mine') return t.claimed_by === user?.id;
    if (filter === 'bills') return t.source === 'life_deadline';
    return true;
  }).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  const BRO_TIP = [
    '🧢 Tip from Bro: Ai xong bếp đêm nay host Spotify cho cả phòng nhé!',
    '💡 Bro gợi ý: Dọn sớm = streak +1 = karma ngon.',
    '🔥 Phòng đang streak ngon. Đừng break chain nhé Bro!',
  ][Math.floor(Date.now() / 86400000) % 3];

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader
        roomName={room.name}
        title="Chore Hub"
        unreadCount={urgentCount}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Bro Hero Card */}
        <BroHeroCard
          streakDays={room.streak_days}
          achieved={myProgress?.achieved_points ?? 0}
          target={myProgress?.target_points ?? 60}
          tasksDueTonight={urgentCount}
          mascotName={room.mascot_name}
        />

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
                {f.key === 'all' && ` (${tasks.filter(t => t.status !== 'completed').length})`}
                {f.key === 'mine' && ` (${tasks.filter(t => t.claimed_by === user?.id).length})`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Task feed */}
        <View style={styles.taskList}>
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Phòng sạch bóng!</Text>
              <Text style={styles.emptySub}>Không có task nào. Bro tự hào về phòng này! 🤙</Text>
            </View>
          ) : (
            filteredTasks.map((task) => (
              <ChoreCard key={task.id} task={task} />
            ))
          )}
        </View>

        {/* Bro Tip capsule */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>{BRO_TIP}</Text>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/chore/add')}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <View style={styles.fabBadge}>
          <Text style={styles.fabBadgeText}>AI</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 14, paddingBottom: 100, gap: 12 },
  filterRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1,
    backgroundColor: Colors.card, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.charcoal },
  chipTextActive: { color: '#fff' },
  taskList: { gap: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  emptySub: { fontSize: 14, color: Colors.muted, marginTop: 6, textAlign: 'center' },
  tipCard: {
    backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 14,
  },
  tipText: { fontSize: 13, color: Colors.muted, lineHeight: 20 },
  fab: {
    position: 'absolute',
    bottom: 90, right: 16,
    width: 56, height: 56,
    borderRadius: 100,
    backgroundColor: Colors.brand.purple,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.purpleShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  fabPressed: { transform: [{ scale: 0.93 }] },
  fabBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.mint,
    borderRadius: 100, paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1.5, borderColor: Colors.card,
  },
  fabBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff' },
});
