import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Sparkles, MessageSquare, User, Plus } from 'lucide-react-native';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6C4DFF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
          overflow: 'visible',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Nhà',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Khám Phá',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size ?? 22} />,
        }}
      />

      {/* Virtual screen for center "+" button in ui-example Image 3 & 5 */}
      <Tabs.Screen
        name="create-tab-button"
        options={{
          title: '',
          tabBarButton: (props) => {
            const { ref, ...restProps } = props as any;
            return (
              <Pressable
                {...restProps}
                onPress={() => router.push('/task/create')}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -24,
              }}
              accessibilityLabel="Tạo việc mới"
              accessibilityRole="button"
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: '#6C4DFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: '#FFFFFF',
                  elevation: 8,
                  shadowColor: '#6C4DFF',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                }}
              >
                <Plus size={28} color="#FFFFFF" strokeWidth={3} />
              </View>
              </Pressable>
            );
          },
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/task/create');
          },
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin Nhắn',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Hồ Sơ',
          tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}
