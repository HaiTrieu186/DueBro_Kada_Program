import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function IndexScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (isLoading) return;

    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (!hasCompletedOnboarding) {
      router.replace('/(onboarding)/profile');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [session, isLoading, hasCompletedOnboarding, router, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF5722" />
    </View>
  );
}
