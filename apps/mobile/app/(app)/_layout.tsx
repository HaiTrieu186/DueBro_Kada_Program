import React from 'react';
import { Tabs } from 'expo-router';
import { Sparkles, Users, CalendarCheck, Trophy } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Việc Nhà',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Tìm Bạn',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="my-tasks"
        options={{
          title: 'Việc Của Tôi',
          tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="scoreboard"
        options={{
          title: 'Bảng Điểm',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
