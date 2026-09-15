import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { TactileButton } from '@/components/ui/TactileButton';
import { useAuthStore } from '@/store/authStore';
import { MOCK_PROFILES } from '@/lib/mockData';
import { Ionicons } from '@expo/vector-icons';

const QUICK_USERS = [
  { id: 'user-hoang', label: 'Hoàng', role: 'Host 🏠', color: Colors.charcoal },
  { id: 'user-nam',   label: 'Nam',   role: 'Member',  color: Colors.brand.purple },
  { id: 'user-linh',  label: 'Linh',  role: 'Member',  color: Colors.mint },
  { id: 'user-duc',   label: 'Đức',   role: 'Away 🏖️', color: Colors.coral },
];

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [tab, setTab] = useState<'login' | 'join'>('login');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleQuickLogin = (userId: string) => {
    signIn(userId);
    router.replace('/(app)');
  };

  const handleEmailLogin = () => {
    if (!email.trim()) { Alert.alert('Nhập email vào Bro!'); return; }
    // In Sprint 4: Supabase OTP
    signIn('user-hoang');
    router.replace('/(app)');
  };

  const handleJoinRoom = () => {
    if (inviteCode.trim().toUpperCase() !== 'BRO402') {
      Alert.alert('Mã phòng sai rồi Bro!', 'Thử lại với mã: BRO402 (demo)');
      return;
    }
    signIn('user-nam');
    router.replace('/(app)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Branding */}
        <View style={styles.heroCard}>
          <View style={styles.mascotWrap}>
            <Text style={styles.mascotBig}>🧢</Text>
            <View style={styles.roomBadge}>
              <Text style={styles.roomBadgeText}>402</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Bro, vào điểm danh nào!</Text>
          <Text style={styles.heroSub}>
            Quản lý việc nhà, hạn chót & quỹ phòng không xích mích.
          </Text>
        </View>

        {/* Quick login */}
        <View style={styles.quickCard}>
          <View style={styles.quickHeader}>
            <Text style={styles.quickLabel}>⚡ CHỌN NHANH ĐỂ TEST</Text>
            <Text style={styles.quickRoom}>Phòng 402</Text>
          </View>
          <View style={styles.quickGrid}>
            {QUICK_USERS.map((u) => (
              <Pressable
                key={u.id}
                style={({ pressed }) => [styles.quickUser, pressed && styles.pressed]}
                onPress={() => handleQuickLogin(u.id)}
              >
                <View style={[styles.quickAvatar, { backgroundColor: u.color }]}>
                  <Text style={styles.quickAvatarText}>{u.label[0]}</Text>
                </View>
                <Text style={styles.quickName}>{u.label}</Text>
                <Text style={[styles.quickRole, { color: u.color }]}>{u.role}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tab: login / join */}
        <View style={styles.tabRow}>
          {(['login', 'join'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'login' ? '🔐 Đăng Nhập' : '🏠 Gia Nhập Phòng'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'login' ? (
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.muted} />
              <TextInput
                style={styles.input}
                placeholder="bro@duebro.app"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TactileButton
              label="Gửi Magic Link →"
              variant="purple"
              size="lg"
              fullWidth
              onPress={handleEmailLogin}
              style={{ marginTop: 12 }}
            />
            <Text style={styles.disclaimer}>
              Dùng cho đăng nhập thật qua Supabase OTP. Demo: dùng Quick Login bên trên.
            </Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Mã Mời Phòng</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={Colors.muted} />
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="VD: BRO402"
                placeholderTextColor={Colors.muted}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
            <TactileButton
              label="Gia Nhập Phòng →"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleJoinRoom}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Tagline */}
        <View style={styles.taglineRow}>
          <Text style={styles.tagline}>
            <Text style={{ color: Colors.brand.purple, fontWeight: '700' }}>Due Bro</Text>
            {' '}— Bro, it's due. 🤙
          </Text>
          <Text style={styles.version}>v1.0.0 MVP</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 14 },

  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  mascotWrap: { position: 'relative', marginBottom: 12 },
  mascotBig: { fontSize: 60 },
  roomBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: Colors.brand.purple,
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 2, borderColor: Colors.card,
  },
  roomBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.charcoal, textAlign: 'center', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: Colors.muted, textAlign: 'center', marginTop: 6, fontWeight: '500' },

  quickCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.brand.purpleBorder,
    padding: 14,
  },
  quickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 10, fontWeight: '700', color: Colors.brand.purple, letterSpacing: 0.6 },
  quickRoom: { fontSize: 10, color: Colors.muted, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  quickUser: {
    alignItems: 'center', padding: 8, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    flex: 1, marginHorizontal: 3,
    backgroundColor: Colors.bg,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  quickAvatar: {
    width: 36, height: 36, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  quickAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  quickName: { fontSize: 12, fontWeight: '700', color: Colors.charcoal },
  quickRole: { fontSize: 9, fontWeight: '600', marginTop: 1, letterSpacing: 0.2 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.card, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  tabTextActive: { color: Colors.charcoal },

  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.charcoal, marginBottom: 8, letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: Colors.charcoal },
  codeInput: { letterSpacing: 2, fontWeight: '700', fontSize: 18 },
  disclaimer: { fontSize: 11, color: Colors.muted, marginTop: 10, textAlign: 'center', lineHeight: 16 },

  taglineRow: { alignItems: 'center', gap: 4 },
  tagline: { fontSize: 13, color: Colors.muted, textAlign: 'center' },
  version: { fontSize: 10, color: Colors.border, fontWeight: '600', letterSpacing: 0.5 },
});
