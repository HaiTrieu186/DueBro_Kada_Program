import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface BroHeroCardProps {
  streakDays: number;
  achieved: number;
  target: number;
  tasksDueTonight: number;
  mascotName?: string;
}

const BRO_EMOJI_BY_STREAK = (days: number) =>
  days >= 14 ? '🔥🔥' : days >= 7 ? '🔥' : days >= 3 ? '⚡' : '✨';

export const BroHeroCard: React.FC<BroHeroCardProps> = ({
  streakDays, achieved, target, tasksDueTonight, mascotName = 'Bro',
}) => {
  const router = useRouter();
  const streakEmoji = BRO_EMOJI_BY_STREAK(streakDays);

  return (
    <View style={styles.card}>
      {/* Header row: badge + mascot */}
      <View style={styles.headerRow}>
        <View style={styles.flex1}>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              ROOM STREAK: {streakDays} DAYS {streakEmoji}
            </Text>
          </View>
          <Text style={styles.headline}>
            {mascotName},{' '}
            {tasksDueTonight === 0
              ? 'phòng đang ngon! 🎉'
              : `${tasksDueTonight} task${tasksDueTonight > 1 ? 's' : ''} due tonight.`}
          </Text>
          <Text style={styles.sub}>
            {tasksDueTonight === 0
              ? 'Streak đang ngon, giữ vững nhé!'
              : 'Keep the streak alive. Làm xong rồi nghỉ!'}
          </Text>
        </View>

        {/* Mascot emoji avatar */}
        <View style={styles.mascotContainer}>
          <Text style={styles.mascotEmoji}>🧢</Text>
        </View>
      </View>

      {/* Weekly quota progress */}
      <View style={styles.progressSection}>
        <ProgressBar achieved={achieved} target={target} />
      </View>

      {/* CTA row */}
      <View style={styles.ctaRow}>
        <Pressable
          style={styles.ctaAI}
          onPress={() => router.push('/chore/add')}
        >
          <Text style={styles.ctaAIText}>⚡ Hú Bro AI →</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex1: { flex: 1 },
  streakBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.charcoal,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  sub: {
    fontSize: 13,
    color: Colors.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  mascotContainer: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: Colors.brand.purpleLight,
    borderWidth: 1,
    borderColor: Colors.brand.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mascotEmoji: { fontSize: 36 },
  progressSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaAI: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand.purpleLight,
    borderWidth: 1,
    borderColor: Colors.brand.purpleBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaAIText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.purple,
    letterSpacing: 0.2,
  },
});
