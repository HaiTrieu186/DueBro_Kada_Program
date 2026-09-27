import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

function resolveSupabaseUrl(): string {
  let url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'http://127.0.0.1:54321';

  // Trên thiết bị thật hoặc máy ảo, 127.0.0.1 trỏ vào chính điện thoại
  if (Platform.OS !== 'web' && (url.includes('127.0.0.1') || url.includes('localhost'))) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      url = url.replace('127.0.0.1', hostIp).replace('localhost', hostIp);
    } else if (Platform.OS === 'android') {
      url = url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2');
    }
  }

  return url;
}

const supabaseUrl = resolveSupabaseUrl();
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'placeholder-anon-key';

export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
