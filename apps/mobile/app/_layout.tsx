import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../src/lib/queryClient';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../store/authStore';
import { registerForPushNotifications } from '../src/lib/push';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const checkOnboardingStatus = useAuthStore((s) => s.checkOnboardingStatus);

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await Promise.all([
          fetchUserProfile(session.user.id),
          checkOnboardingStatus(session.user.id),
        ]);
        registerForPushNotifications(session.user.id).catch(() => {});
      }
      setSession(session);
    });

    // 2. Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await Promise.all([
            fetchUserProfile(session.user.id),
            checkOnboardingStatus(session.user.id),
          ]);
          registerForPushNotifications(session.user.id).catch(() => {});
        }
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, checkOnboardingStatus]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch {
      // Ignore initial silent fail
    }
  };

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="task/[id]" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="task/create" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="chat/[connectionId]" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="candidate/[id]" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="room/create" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="room/join" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="room/members" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="templates" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="scoreboard" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="karma" options={{ presentation: 'card', headerShown: false }} />
          <Stack.Screen name="notifications" options={{ presentation: 'card', headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
