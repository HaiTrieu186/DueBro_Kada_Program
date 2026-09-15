import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/colors';
import { useRoomStore } from '@/store/roomStore';
import { MOCK_PROFILES, getKarmaTitle } from '@/lib/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';

const RANK_EMOJI = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [Colors.amber, Colors.muted, '#CD7F32'];

export default function ScoreboardScreen() {
  const { weeklyProgress, members, room } = useRoomStore();

  const sorted = [...weeklyProgress].sort((a, b) => b.achieved_points - a.achieved_points);

  // Days until Monday reset
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const daysUntilMonday = dayOfWeek === 1 ? 7 : ((8 - dayOfWeek) % 7) || 7;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Scoreboard</Text>
        <View style={styles.resetBadge}>
          <Text style={styles.resetText}>Reset sau {daysUntilMonday} ngày</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Podium top 3 */}
        <View style={styles.podiumCard}>
          <Text style={styles.podiumTitle}>Tuần này — {room.name}</Text>
          <View style={styles.podiumRow}>
            {sorted.slice(0, 3).map((prog, i) => {
              const profile = MOCK_PROFILES[prog.member_id];
              const member = members.find(m => m.member_id === prog.member_id);
              const karmaTitle = getKarmaTitle(member?.karma_score ?? 0);
              const heightMultiplier = i === 0 ? 1 : i === 1 ? 0.85 : 0.7;
              return (
                <View key={prog.member_id} style={[styles.podiumItem, { marginTop: i === 0 ? 0 : i === 1 ? 20 : 35 }]}>
                  <Text style={styles.rankEmoji}>{RANK_EMOJI[i]}</Text>
                  <Avatar
                    initial={profile.avatar_initial}
                    color={profile.avatar_color}
                    size={50}
                  />
                  <Text style={styles.podiumName}>{profile.display_name}</Text>
                  <View style={[styles.podiumScore, { backgroundColor: i === 0 ? Colors.brand.purpleLight : Colors.surface }]}>
                    <Text style={[styles.podiumPts, { color: i === 0 ? Colors.brand.purple : Colors.charcoal }]}>
                      {prog.achieved_points} pts
                    </Text>
                  </View>
                  <Text style={styles.titleBadge}>{karmaTitle.badge}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* All members leaderboard */}
        <View style={styles.leaderboard}>
          {sorted.map((prog, i) => {
            const profile = MOCK_PROFILES[prog.member_id];
            const member = members.find(m => m.member_id === prog.member_id);
            const karmaTitle = getKarmaTitle(member?.karma_score ?? 0);
            const pct = Math.round((prog.achieved_points / prog.target_points) * 100);
            const isAway = member?.away_status === 'away';

            return (
              <View key={prog.member_id} style={[styles.memberRow, i === 0 && styles.memberRowTop]}>
                {/* Rank */}
                <Text style={[styles.rankNum, { color: i < 3 ? RANK_COLORS[i] : Colors.muted }]}>
                  {i < 3 ? RANK_EMOJI[i] : `#${i + 1}`}
                </Text>

                {/* Avatar */}
                <Avatar initial={profile.avatar_initial} color={profile.avatar_color} size={40} />

                {/* Name + title */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.memberName}>{profile.display_name}</Text>
                    {isAway && (
                      <View style={styles.awayBadge}>
                        <Text style={styles.awayText}>🏖️ Away</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.karmaTitle}>{karmaTitle.badge} {karmaTitle.title}</Text>
                  <View style={styles.miniProgress}>
                    <View style={[styles.miniBar, { width: `${pct}%` as any }]} />
                  </View>
                </View>

                {/* Points */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.effortPts}>{prog.achieved_points}</Text>
                  <Text style={styles.effortLabel}>/ {prog.target_points} pts</Text>
                  <Text style={styles.karmaPts}>♾️ {member?.karma_score ?? 0}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Karma legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>💡 Karma Titles</Text>
          <Text style={styles.legendSub}>Điểm Karma tích lũy không giới hạn qua mọi tuần</Text>
          <View style={{ gap: 6, marginTop: 10 }}>
            {[
              { badge: '🐣', label: 'Tân Binh (0–49 karma)' },
              { badge: '🧹', label: 'Thánh Lau Nhà (200–299)' },
              { badge: '🗑️', label: 'Chúa Tể Đổ Vỏ (300–499)' },
              { badge: '✨', label: 'Bro Huyền Thoại (500+)' },
            ].map((item) => (
              <View key={item.badge} style={styles.legendRow}>
                <Text style={{ fontSize: 16 }}>{item.badge}</Text>
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.charcoal },
  resetBadge: {
    backgroundColor: Colors.brand.purpleLight,
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.brand.purpleBorder,
  },
  resetText: { fontSize: 11, fontWeight: '600', color: Colors.brand.purple },
  content: { padding: 14, paddingBottom: 40, gap: 14 },

  podiumCard: {
    backgroundColor: Colors.card,
    borderRadius: 24, borderWidth: 1, borderColor: Colors.border,
    padding: 16,
  },
  podiumTitle: { fontSize: 12, fontWeight: '700', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16, textAlign: 'center' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumItem: { alignItems: 'center', gap: 6 },
  rankEmoji: { fontSize: 24 },
  podiumName: { fontSize: 13, fontWeight: '700', color: Colors.charcoal },
  podiumScore: {
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3,
  },
  podiumPts: { fontSize: 13, fontWeight: '800' },
  titleBadge: { fontSize: 18 },

  leaderboard: {
    backgroundColor: Colors.card,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  memberRowTop: { backgroundColor: Colors.brand.purpleLight + '55' },
  rankNum: { fontSize: 16, fontWeight: '700', width: 28, textAlign: 'center' },
  memberName: { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  karmaTitle: { fontSize: 11, color: Colors.muted, fontWeight: '500', marginTop: 2 },
  awayBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2,
  },
  awayText: { fontSize: 10, fontWeight: '600', color: Colors.amber },
  miniProgress: {
    height: 4, backgroundColor: Colors.surface,
    borderRadius: 100, marginTop: 4, overflow: 'hidden',
  },
  miniBar: {
    height: '100%', backgroundColor: Colors.brand.purple,
    borderRadius: 100, maxWidth: '100%',
  },
  effortPts: { fontSize: 18, fontWeight: '800', color: Colors.charcoal, textAlign: 'right' },
  effortLabel: { fontSize: 11, color: Colors.muted, textAlign: 'right' },
  karmaPts: { fontSize: 11, color: Colors.brand.purple, fontWeight: '600', textAlign: 'right', marginTop: 2 },

  legendCard: {
    backgroundColor: Colors.card,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  legendTitle: { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  legendSub: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendText: { fontSize: 13, color: Colors.charcoal, fontWeight: '500' },
});
