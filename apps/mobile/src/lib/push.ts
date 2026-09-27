import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { supabase } from './supabase';

// Safely obtain expo-notifications without crashing Expo Go on Android (Expo SDK 53+)
let Notifications: typeof import('expo-notifications') | null = null;

const isExpoGoAndroid = Platform.OS === 'android' && isRunningInExpoGo();

if (!isExpoGoAndroid && Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('expo-notifications setup skipped:', err);
  }
}

let hasLoggedPushNotice = false;

/**
 * Register push notification token with Supabase profiles (ARCH Mục 15.5)
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGoAndroid || !Notifications) {
    if (isExpoGoAndroid && !hasLoggedPushNotice) {
      hasLoggedPushNotice = true;
      console.log('ℹ️ Push notifications: Đang chạy trên Expo Go Android (tính năng push cần Development Build để nhận thông báo nền, các chức năng khác hoạt động 100% bình thường).');
    }
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    const token = tokenData.data;
    if (token) {
      // Policy update-own cho phép user cập nhật push_token
      await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);
    }

    return token;
  } catch (error) {
    console.warn('Lỗi đăng ký push token:', error);
    return null;
  }
}
