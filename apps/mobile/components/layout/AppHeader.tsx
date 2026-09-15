import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface AppHeaderProps {
  roomName: string;
  title: string;
  unreadCount?: number;
  onBellPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  roomName, title, unreadCount = 0, onBellPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Room pill */}
      <View style={styles.roomPill}>
        <View style={styles.dot} />
        <Text style={styles.roomName}>{roomName}</Text>
      </View>

      {/* Center title */}
      <Text style={styles.title}>{title}</Text>

      {/* Notification bell */}
      <Pressable style={styles.bellBtn} onPress={onBellPress}>
        <Ionicons name="notifications-outline" size={20} color={Colors.charcoal} />
        {unreadCount > 0 && <View style={styles.badge} />}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 7, height: 7,
    borderRadius: 100,
    backgroundColor: Colors.mint,
  },
  roomName: {
    fontSize: 11, fontWeight: '600',
    color: Colors.charcoal, letterSpacing: 0.1,
  },
  title: {
    fontSize: 15, fontWeight: '700', color: Colors.charcoal,
  },
  bellBtn: {
    width: 36, height: 36,
    borderRadius: 100,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8, right: 8,
    width: 7, height: 7,
    borderRadius: 100,
    backgroundColor: Colors.coral,
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
});
