import React, { useState } from 'react';
import { View, Text, Image, Pressable, Modal, Dimensions } from 'react-native';
import { FileCheck, Image as ImageIcon, X, ExternalLink } from 'lucide-react-native';

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

  if (!photoUrl) {
    if (!canUpload) return null;
    return (
      <Pressable
        onPress={onPressUpload}
        className="border-2 border-dashed border-slate-300 rounded-2xl p-5 items-center justify-center bg-slate-50 active:bg-slate-100 mb-3"
      >
        <ImageIcon size={32} color="#94A3B8" />
        <Text className="text-sm font-bold text-slate-700 mt-2">
          Chụp / Tải ảnh minh chứng
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Tối đa 1 MB, định dạng JPG/PNG
        </Text>
      </Pressable>
    );
  }

  const statusLabel =
    status === 'approved'
      ? { text: 'Đã nghiệm thu', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
      : status === 'disputed'
      ? { text: 'Cần làm lại', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
      : { text: 'Chờ phòng duyệt', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        Ảnh minh chứng đã nộp
      </Text>

      <Pressable
        onPress={() => setModalVisible(true)}
        className="flex-row items-center bg-white border border-slate-200 rounded-2xl p-3 shadow-sm active:bg-slate-50"
      >
        {/* Thumbnail Preview */}
        <View className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 mr-3.5 border border-slate-200">
          <Image
            source={{ uri: photoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center mb-1">
            <Text className="text-sm font-extrabold text-slate-900 mr-2 flex-1" numberOfLines={1}>
              Bằng chứng hoàn thành.jpg
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`rounded-full border px-2 py-0.5 ${statusLabel.bg} mr-2`}>
              <Text className={`text-[10px] font-bold ${statusLabel.color}`}>
                {statusLabel.text}
              </Text>
            </View>
            <Text className="text-xs text-slate-400">Chạm để phóng to</Text>
          </View>
        </View>

        <ExternalLink size={18} color="#94A3B8" />
      </Pressable>

      {/* Fullscreen Preview Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          <Pressable
            onPress={() => setModalVisible(false)}
            className="absolute top-12 right-6 p-2 rounded-full bg-white/20 z-10"
          >
            <X size={24} color="#FFFFFF" />
          </Pressable>
          <Image
            source={{ uri: photoUrl }}
            style={{ width: Dimensions.get('window').width - 32, height: Dimensions.get('window').height * 0.7 }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};
