import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

type TabName = 'index' | 'deadlines' | 'scoreboard' | 'profile';

const TAB_CONFIG: Array<{ name: TabName; label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }> = [
  { name: 'index',      label: 'Chore Hub',  icon: 'list-outline',        iconActive: 'list' },
  { name: 'deadlines',  label: 'Deadlines',  icon: 'time-outline',        iconActive: 'time' },
  { name: 'scoreboard', label: 'Scoreboard', icon: 'trophy-outline',      iconActive: 'trophy' },
  { name: 'profile',    label: 'Profile',    icon: 'person-circle-outline', iconActive: 'person-circle' },
];

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/(auth)/login');
  }, [user]);

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TAB_CONFIG.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {TAB_CONFIG.map((tab, i) => {
        const focused = state.index === i;
        return (
          <Pressable
            key={tab.name}
            style={[styles.tabItem, focused && styles.tabItemActive]}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Ionicons
              name={focused ? tab.iconActive : tab.icon}
              size={focused ? 20 : 22}
              color={focused ? '#fff' : Colors.muted}
            />
            {focused && (
              <Text style={styles.tabLabel}>{tab.label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: 16,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
});
