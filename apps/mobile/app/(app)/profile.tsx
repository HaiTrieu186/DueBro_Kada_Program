import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, Alert, Pressable,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useRoomStore } from '@/store/roomStore';
import { MOCK_MEMBERS, getKarmaTitle } from '@/lib/mockData';
import { Avatar } from '@/components/ui/Avatar';
import { TactileButton } from '@/components/ui/TactileButton';
import { useRouter } from 'expo-router';

const KARMA_COST_SKIP = 50;

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const signOut = useAuthStore((s) => s.signOut);
  const { weeklyProgress, members } = useRoomStore();

  const myMember = members.find(m => m.member_id === user?.id);
  const myProgress = weeklyProgress.find(w => w.member_id === user?.id);
  const karmaTitle = getKarmaTitle(myMember?.karma_score ?? 0);
  const [awayMode, setAwayMode] = useState(myMember?.away_status === 'away');

  const tasksCompleted = 24; // mock
  const onTimeRate = 87;     // mock

  const handleAwayToggle = (value: boolean) => {
    setAwayMode(value);
    Alert.alert(
      value ? '🏖️ Away Mode Bật' : '✅ Back in town!',
      value
        ? 'Bro không bị gán việc trong thời gian vắng mặt. Nhớ set ngày về nhé!'
        : 'Bro đã active trở lại. Sẵn sàng nhận việc!',
    );
  };

  const handleRedeemKarma = () => {
    const karma = myMember?.karma_score ?? 0;
    if (karma < KARMA_COST_SKIP) {
      Alert.alert(
        'Karma chưa đủ!',
        `Cần ${KARMA_COST_SKIP} Karma để đổi Thẻ Miễn Làm. Bro đang có ${karma} Karma.`
      );
      return;
    }
    Alert.alert(
      '🎟️ Đổi Thẻ Miễn Làm Việc Nhà',
      `Trừ ${KARMA_COST_SKIP} Karma để bỏ qua task tiếp theo?`,
      [
        { text: 'Thôi', style: 'cancel' },
        { text: 'Đổi ngay!', onPress: () => Alert.alert('✅ Done!', 'Bro đã có 1 Thẻ Miễn. Dùng trong tuần này nhé!') },
      ]
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Hồ Sơ</Text>
        <Pressable onPress={() => { signOut(); router.replace('/(auth)/login'); }}>
          <Text style={styles.signOutText}>Đăng xuất</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar initial={user.avatar_initial} color={user.avatar_color} size={72} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{user.display_name}</Text>
              {role === 'host' && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostText}>🏠 Host</Text>
                </View>
              )}
            </View>
            <Text style={styles.karmaTitle}>{karmaTitle.badge} {karmaTitle.title}</Text>
            <Text style={styles.karmaScore}>♾️ {myMember?.karma_score ?? 0} Karma tổng</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Tasks Done', value: `${tasksCompleted}`, icon: '✅' },
            { label: 'Đúng Hạn', value: `${onTimeRate}%`, icon: '⏱️' },
            { label: 'Tuần Này', value: `${myProgress?.achieved_points ?? 0} pts`, icon: '🔥' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Away Mode */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Text style={styles.sectionTitle}>🏖️ Away Mode</Text>
              <Text style={styles.sectionSub}>
                {awayMode
                  ? 'Đang vắng mặt — Bro không gán việc cho bạn'
                  : 'Bật khi về quê, đi công tác, thực tập xa'}
              </Text>
            </View>
            <Switch
              value={awayMode}
              onValueChange={handleAwayToggle}
              trackColor={{ false: Colors.border, true: Colors.brand.purple }}
              thumbColor={Colors.card}
            />
          </View>
          {awayMode && (
            <View style={styles.awayInfo}>
              <Text style={styles.awayInfoText}>
                📅 Away: {myMember?.away_from ?? '14/09'} → {myMember?.away_to ?? '20/09/2026'}
              </Text>
              <Text style={styles.awayInfoSub}>Quota đóng băng, không bị auto-assign.</Text>
            </View>
          )}
        </View>

        {/* Karma Redemption */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎟️ Đổi Karma</Text>
          <Text style={styles.sectionSub}>Dùng Karma vĩnh viễn để đổi quyền lợi đặc biệt</Text>
          <View style={styles.redeemOption}>
            <View style={{ flex: 1 }}>
              <Text style={styles.redeemTitle}>Thẻ Miễn Làm Việc Nhà</Text>
              <Text style={styles.redeemSub}>Bỏ qua 1 task auto-assigned tiếp theo</Text>
            </View>
            <TactileButton
              label={`${KARMA_COST_SKIP} 🧿`}
              variant="purple"
              size="sm"
              onPress={handleRedeemKarma}
            />
          </View>
        </View>

        {/* Room Info (Host only) */}
        {role === 'host' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>⚙️ Room Settings (Host)</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tên phòng</Text>
              <Text style={styles.settingValue}>Brothers Room 402</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Mã mời</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>BRO402</Text>
              </View>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tên linh vật</Text>
              <Text style={styles.settingValue}>Bro 🧢</Text>
            </View>
          </View>
        )}

        {/* Version */}
        <Text style={styles.versionText}>Due Bro v1.0.0 MVP — Bro, it's due. 🤙</Text>
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
  signOutText: { fontSize: 14, color: Colors.coral, fontWeight: '600' },
  content: { padding: 14, paddingBottom: 40, gap: 12 },

  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: 22, borderWidth: 1, borderColor: Colors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontSize: 22, fontWeight: '800', color: Colors.charcoal },
  hostBadge: {
    backgroundColor: Colors.brand.purpleLight,
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.brand.purpleBorder,
  },
  hostText: { fontSize: 11, fontWeight: '700', color: Colors.brand.purple },
  karmaTitle: { fontSize: 13, color: Colors.muted, marginTop: 3, fontWeight: '500' },
  karmaScore: { fontSize: 12, color: Colors.brand.purple, fontWeight: '700', marginTop: 2 },

  statsRow: {
    flexDirection: 'row', gap: 8,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.charcoal },
  statLabel: { fontSize: 10, color: Colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },

  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 8,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionLeft: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  sectionSub: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 18 },
  awayInfo: {
    backgroundColor: Colors.amberLight, borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: Colors.amberLight,
  },
  awayInfoText: { fontSize: 13, fontWeight: '600', color: Colors.amber },
  awayInfoSub: { fontSize: 12, color: Colors.amber, marginTop: 2 },

  redeemOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.brand.purpleLight + '88',
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: Colors.brand.purpleBorder,
  },
  redeemTitle: { fontSize: 14, fontWeight: '700', color: Colors.charcoal },
  redeemSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  settingLabel: { fontSize: 13, color: Colors.muted, fontWeight: '500' },
  settingValue: { fontSize: 13, color: Colors.charcoal, fontWeight: '600' },
  codeBox: {
    backgroundColor: Colors.charcoal, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  codeText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 2 },

  versionText: { textAlign: 'center', fontSize: 11, color: Colors.border, fontWeight: '600' },
});
