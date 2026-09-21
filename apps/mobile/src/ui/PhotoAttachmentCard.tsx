import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Image as ImageIcon, X, ExternalLink, RefreshCw, ZoomIn } from 'lucide-react-native';

interface PhotoAttachmentCardProps {
  photoUrl?: string | null;
  uploadedAt?: string | null;
  status?: 'pending' | 'approved' | 'disputed';
  onPressUpload?: () => void;
  canUpload?: boolean;
}

export const PhotoAttachmentCard: React.FC<PhotoAttachmentCardProps> = ({
  photoUrl,
  uploadedAt,
  status = 'pending',
  onPressUpload,
  canUpload = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!photoUrl) {
    if (!canUpload) return null;
    return (
      <Pressable
        onPress={onPressUpload}
        className="border-2 border-dashed border-[#6C4DFF]/40 rounded-3xl p-6 items-center justify-center bg-[#EDE9FE]/30 active:bg-[#EDE9FE]/60 mb-4"
      >
        <View className="w-14 h-14 rounded-2xl bg-[#EDE9FE] items-center justify-center mb-2.5">
          <ImageIcon size={28} color="#6C4DFF" />
        </View>
        <Text className="text-sm font-extrabold text-slate-800">
          Chụp / Tải ảnh minh chứng 📸
        </Text>
        <Text className="text-xs text-slate-400 mt-1 text-center">
          Tối đa 1 MB, hỗ trợ chụp trọn vẹn không bắt buộc cắt xén
        </Text>
      </Pressable>
    );
  }

  const statusLabel =
    status === 'approved'
      ? { text: 'Đã nghiệm thu ✨', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
      : status === 'disputed'
      ? { text: 'Cần làm lại ⚠️', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
      : { text: 'Chờ phòng duyệt ⏳', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };

  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Ảnh minh chứng đã nộp
        </Text>
        {canUpload && onPressUpload && (
          <Pressable onPress={onPressUpload} className="flex-row items-center active:opacity-70">
            <RefreshCw size={12} color="#6C4DFF" />
            <Text className="text-xs font-bold text-[#6C4DFF] ml-1">Chụp lại</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => setModalVisible(true)}
        className="flex-row items-center bg-white border border-slate-200 rounded-3xl p-3.5 shadow-sm active:bg-slate-50"
      >
        {/* Thumbnail Preview with expo-image */}
        <View className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 mr-3.5 border border-slate-200 items-center justify-center">
          {hasError ? (
            <ImageIcon size={24} color="#94A3B8" />
          ) : (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
          {isLoading && !hasError && (
            <View className="absolute inset-0 bg-slate-100/80 items-center justify-center">
              <ActivityIndicator size="small" color="#6C4DFF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-black text-slate-900 mr-2 flex-1" numberOfLines={1}>
              Bằng chứng hoàn thành.jpg
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`rounded-full border px-2 py-0.5 ${statusLabel.bg} mr-2`}>
              <Text className={`text-[10px] font-black ${statusLabel.color}`}>
                {statusLabel.text}
              </Text>
            </View>
            <View className="flex-row items-center">
              <ZoomIn size={12} color="#94A3B8" />
              <Text className="text-[11px] text-slate-400 font-bold ml-1">Chạm để phóng to</Text>
            </View>
          </View>
        </View>

        <ExternalLink size={18} color="#94A3B8" />
      </Pressable>

      {/* Fullscreen Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          <Pressable
            onPress={() => setModalVisible(false)}
            className="absolute top-12 right-6 p-2.5 rounded-full bg-white/20 active:bg-white/30 z-20"
          >
            <X size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>

          <View className="w-full items-center justify-center">
            <Image
              source={{ uri: photoUrl }}
              style={{
                width: Dimensions.get('window').width - 32,
                height: Dimensions.get('window').height * 0.75,
                borderRadius: 16,
              }}
              contentFit="contain"
              transition={300}
            />
          </View>

          <Text className="text-xs text-white/60 font-bold mt-4">
            Chạm vào góc trên để đóng
          </Text>
        </View>
      </Modal>
    </View>
  );
};
