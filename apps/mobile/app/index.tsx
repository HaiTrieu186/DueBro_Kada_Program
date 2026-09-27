import React from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const mascotHead = require('../assets/brand/mascot-head.png');

export default function IndexScreen() {
  const rootNavigationState = useRootNavigationState();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  // Chỉ redirect khi NavigationContainer đã sẵn sàng và auth state đã load xong
  if (rootNavigationState?.key && !isLoading) {
    if (!session) {
      return <Redirect href="/(auth)/welcome" />;
    }
    if (!hasCompletedOnboarding) {
      return <Redirect href="/(onboarding)/profile" />;
    }
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF9', justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 28,
          backgroundColor: '#EDE9FE',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'rgba(108, 77, 255, 0.2)',
          marginBottom: 16,
          elevation: 4,
        }}
      >
        <Image
          source={mascotHead}
          style={{ width: 60, height: 60 }}
          resizeMode="contain"
        />
      </View>
      <ActivityIndicator size="large" color="#6C4DFF" />
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6C4DFF', marginTop: 12 }}>
        "Bro, it's due."
      </Text>
    </View>
  );
}
