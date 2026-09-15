import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  Pressable, TextInput, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { TactileButton } from '@/components/ui/TactileButton';

const CATEGORIES = [
  { id: 'cleaning', label: 'Vệ sinh', emoji: '🧹', defaultPts: 20 },
  { id: 'kitchen',  label: 'Bếp núc', emoji: '🍳', defaultPts: 15 },
  { id: 'trash',    label: 'Đổ rác',  emoji: '🗑️', defaultPts: 5  },
  { id: 'shopping', label: 'Mua sắm', emoji: '🛒', defaultPts: 10 },
  { id: 'toilet',   label: 'Vệ sinh WC', emoji: '🚽', defaultPts: 35 },
  { id: 'cooking',  label: 'Nấu ăn',  emoji: '👨‍🍳', defaultPts: 30 },
  { id: 'laundry',  label: 'Giặt đồ', emoji: '👕', defaultPts: 15 },
  { id: 'other',    label: 'Khác',    emoji: '📋', defaultPts: 10 },
];

const RECURRENCES = [
  { id: 'once',    label: '1 lần' },
  { id: 'daily',   label: 'Hàng ngày' },
  { id: 'weekly',  label: 'Hàng tuần' },
  { id: 'biweekly',label: '2 tuần/lần' },
];

export default function AddChoreScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cleaning');
  const [points, setPoints] = useState(20);
  const [recurrence, setRecurrence] = useState('once');
  const [requiresPhoto, setRequiresPhoto] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.id === category) ?? CATEGORIES[0];

  const handleCategorySelect = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (cat) {
      setCategory(catId);
      setPoints(cat.defaultPts);
      setRequiresPhoto(cat.defaultPts >= 30);
    }
  };

  const handlePointsChange = (delta: number) => {
    const next = Math.max(5, Math.min(100, points + delta));
    setPoints(next);
    setRequiresPhoto(next >= 30);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Chưa nhập tên task!');
      return;
    }
    Alert.alert(
      '✅ Task đã thêm!',
      `"${title}" (+${points} pts) đã được thêm vào Bounty Board. Bro sẽ nhắc cả phòng!`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const aiSuggest = () => {
    const suggestion = selectedCat.defaultPts;
    Alert.alert(
      `⚡ AI gợi ý: ${suggestion} điểm`,
      `Dựa trên mức độ khó và thời gian ước tính của "${selectedCat.label}", Bro gợi ý ${suggestion} điểm là hợp lý nhất.`,
      [{ text: 'Áp dụng', onPress: () => { setPoints(suggestion); setRequiresPhoto(suggestion >= 30); } }, { text: 'Thôi' }],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={Colors.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm Task Mới</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiText}>⚡ AI</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Task name */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tên công việc *</Text>
          <TextInput
            style={styles.input}
            placeholder='VD: "Đổ rác hành lang", "Rửa nồi cơm"...'
            placeholderTextColor={Colors.muted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Loại việc</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[styles.catBtn, category === cat.id && styles.catBtnActive]}
                onPress={() => handleCategorySelect(cat.id)}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Effort points */}
        <View style={styles.field}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldLabel}>Điểm công sức</Text>
            <Pressable onPress={aiSuggest} style={styles.aiBtn}>
              <Text style={styles.aiBtnText}>⚡ AI gợi ý</Text>
            </Pressable>
          </View>
          <View style={styles.pointsControl}>
            <Pressable style={styles.stepBtn} onPress={() => handlePointsChange(-5)}>
              <Ionicons name="remove" size={20} color={Colors.charcoal} />
            </Pressable>
            <View style={styles.pointsDisplay}>
              <Text style={styles.pointsNum}>{points}</Text>
              <Text style={styles.pointsLabel}>điểm</Text>
            </View>
            <Pressable style={styles.stepBtn} onPress={() => handlePointsChange(5)}>
              <Ionicons name="add" size={20} color={Colors.charcoal} />
            </Pressable>
          </View>
          <View style={styles.pointsRef}>
            {[5, 10, 15, 20, 30, 35, 50].map((p) => (
              <Pressable key={p} style={[styles.pointsRefBtn, points === p && styles.pointsRefActive]} onPress={() => { setPoints(p); setRequiresPhoto(p >= 30); }}>
                <Text style={[styles.pointsRefText, points === p && styles.pointsRefTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recurrence */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tần suất</Text>
          <View style={styles.recurrenceRow}>
            {RECURRENCES.map((r) => (
              <Pressable
                key={r.id}
                style={[styles.recBtn, recurrence === r.id && styles.recBtnActive]}
                onPress={() => setRecurrence(r.id)}
              >
                <Text style={[styles.recText, recurrence === r.id && styles.recTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Photo required */}
        <View style={styles.field}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>📸 Yêu cầu ảnh xác minh</Text>
              <Text style={styles.switchSub}>
                {requiresPhoto
                  ? 'Bắt buộc (task ≥30 điểm)  — Người làm phải upload ảnh'
                  : 'Không bắt buộc (có thể bật thủ công)'}
              </Text>
            </View>
            <Switch
              value={requiresPhoto}
              onValueChange={setRequiresPhoto}
              trackColor={{ false: Colors.border, true: Colors.brand.purple }}
              thumbColor={Colors.card}
            />
          </View>
        </View>

        {/* Preview card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>👀 Preview</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewEmoji}>{selectedCat.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewTitle}>{title || 'Tên task...'}</Text>
              <Text style={styles.previewMeta}>
                {selectedCat.label} • {recurrence === 'once' ? '1 lần' : RECURRENCES.find(r => r.id === recurrence)?.label}
                {requiresPhoto ? ' • 📸' : ''}
              </Text>
            </View>
            <View style={styles.previewPts}>
              <Text style={styles.previewPtsNum}>+{points}</Text>
              <Text style={styles.previewPtsLabel}>PTS</Text>
            </View>
          </View>
        </View>

        <TactileButton
          label="➕ Thêm vào Bounty Board"
          variant="purple"
          size="lg"
          fullWidth
          onPress={handleSubmit}
        />

        <Text style={styles.hint}>
          Task sẽ xuất hiện trên Bounty Board. Ai nhận trước được thưởng +10% điểm!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 100, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.charcoal },
  aiBadge: { backgroundColor: Colors.brand.purpleLight, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.brand.purpleBorder },
  aiText: { fontSize: 11, fontWeight: '700', color: Colors.brand.purple },

  content: { padding: 14, paddingBottom: 40, gap: 16 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.charcoal, letterSpacing: 0.2 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.charcoal,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexBasis: '22%', flexGrow: 1,
    alignItems: 'center', padding: 10, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  catBtnActive: { borderColor: Colors.brand.purple, backgroundColor: Colors.brand.purpleLight },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catLabel: { fontSize: 11, fontWeight: '600', color: Colors.muted, textAlign: 'center' },
  catLabelActive: { color: Colors.brand.purple },

  aiBtn: { backgroundColor: Colors.brand.purpleLight, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.brand.purpleBorder },
  aiBtnText: { fontSize: 11, fontWeight: '700', color: Colors.brand.purple },

  pointsControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepBtn: {
    width: 44, height: 44, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pointsDisplay: { alignItems: 'center' },
  pointsNum: { fontSize: 48, fontWeight: '800', color: Colors.charcoal, lineHeight: 56 },
  pointsLabel: { fontSize: 12, color: Colors.muted, fontWeight: '600' },

  pointsRef: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  pointsRefBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  pointsRefActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  pointsRefText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  pointsRefTextActive: { color: '#fff' },

  recurrenceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  recBtn: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  recBtnActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  recText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  recTextActive: { color: '#fff' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  switchSub: { fontSize: 12, color: Colors.muted, marginTop: 2, lineHeight: 16 },

  previewCard: {
    backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1.5,
    borderColor: Colors.brand.purpleBorder, padding: 14, gap: 10,
  },
  previewLabel: { fontSize: 10, fontWeight: '700', color: Colors.brand.purple, textTransform: 'uppercase', letterSpacing: 0.6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewEmoji: { fontSize: 28 },
  previewTitle: { fontSize: 15, fontWeight: '700', color: Colors.charcoal },
  previewMeta: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  previewPts: { alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 10, padding: 8 },
  previewPtsNum: { fontSize: 20, fontWeight: '800', color: '#065F46' },
  previewPtsLabel: { fontSize: 10, fontWeight: '600', color: '#065F46' },

  hint: { textAlign: 'center', fontSize: 12, color: Colors.muted, lineHeight: 18 },
});
