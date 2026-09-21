import React from 'react';
import { View, Text } from 'react-native';
import { TactileButton } from './TactileButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Có lỗi xảy ra, Bro ơi!',
  message = 'Không thể tải được dữ liệu lúc này. Kiểm tra lại kết nối mạng nhé.',
  onRetry,
  isRetrying = false,
}) => {
  return (
    <View className="items-center justify-center p-6 my-auto">
      <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4 border-2 border-red-200">
        <Text className="text-3xl">⚠️</Text>
      </View>

      <Text className="text-lg font-bold text-slate-900 text-center mb-1">
        {title}
      </Text>
      <Text className="text-sm text-slate-500 text-center max-w-[280px] mb-6">
        {message}
      </Text>

      <TactileButton
        title="Thử lại ngay"
        variant="secondary"
        size="md"
        isLoading={isRetrying}
        onPress={onRetry}
      />
    </View>
  );
};
