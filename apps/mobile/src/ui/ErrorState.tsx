import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { TactileButton } from './TactileButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Không thể kết nối đến máy chủ. Bro kiểm tra lại mạng nhé!',
  onRetry,
}) => {
  return (
    <View className="items-center justify-center p-6 my-auto">
      <View className="w-16 h-16 rounded-full bg-rose-100 items-center justify-center mb-3">
        <AlertCircle size={32} color="#EF4444" />
      </View>
      <Text className="text-base font-black text-slate-900 text-center mb-1">
        Úi chà, có lỗi rồi bro!
      </Text>
      <Text className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed mb-5">
        {message}
      </Text>
      {onRetry && (
        <TactileButton
          title="Thử lại ngay"
          variant="outline"
          onPress={onRetry}
          size="sm"
        />
      )}
    </View>
  );
};
