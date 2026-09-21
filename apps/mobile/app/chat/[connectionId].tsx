import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, Home, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import {
  useMessages,
  useSendMessage,
  useChatRealtime,
  useProposeRoom,
  useAcceptRoom,
  useConnections,
} from '../../src/modules/chat/hooks';
import { TactileButton } from '../../src/ui/TactileButton';

export default function ChatScreen() {
  const router = useRouter();
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();
  const user = useAuthStore((s) => s.user);

  const [inputContent, setInputContent] = useState('');
  const [proposeModalVisible, setProposeModalVisible] = useState(false);
  const [proposedRoomName, setProposedRoomName] = useState('Due Bro Hub 402');

  // Queries & Realtime
  useChatRealtime(connectionId);
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(connectionId);
  const { data: connections = [] } = useConnections(user?.id);
  const connection = connections.find((c) => c.id === connectionId);

  const sendMessageMutation = useSendMessage(connectionId);
  const proposeRoomMutation = useProposeRoom(connectionId);
  const acceptRoomMutation = useAcceptRoom(connectionId);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputContent.trim()) return;
    const text = inputContent.trim();
    setInputContent('');

    try {
      await sendMessageMutation.mutateAsync(text);
    } catch (err: any) {
      Alert.alert('Không thể gửi tin nhắn', err.message);
    }
  };

  const handleProposeRoom = async () => {
    if (!proposedRoomName.trim()) {
      Alert.alert('Nhập tên phòng', 'Vui lòng đặt tên cho ngôi nhà chung của 2 bạn.');
      return;
    }

    try {
      await proposeRoomMutation.mutateAsync(proposedRoomName.trim());
      setProposeModalVisible(false);
      Alert.alert('Đã gửi đề xuất! 🏠', 'Đối phương sẽ thấy lời rủ cùng thuê phòng trong khung chat.');
    } catch (err: any) {
      Alert.alert('Lỗi đề xuất', err.message);
    }
  };

  const handleAcceptRoom = async () => {
    try {
      const room = await acceptRoomMutation.mutateAsync();
      Alert.alert('Chúc mừng hai bạn! 🎉', 'Phòng chung đã được tạo tự động. Mau vào phòng bắt đầu vận hành việc nhà thôi!');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Lỗi tạo phòng', err.message);
    }
  };

  const isProposed = connection?.status === 'room_proposed';
  const isProposedByMe = connection?.proposed_by === user?.id;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Chat Header */}
      <View className="px-4 py-3 bg-white border-b border-slate-200/80 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-2 active:bg-slate-200"
          >
            <ChevronLeft size={20} color="#334155" />
          </Pressable>
          <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-2.5 border border-orange-200">
            <Text className="text-lg">😎</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
              {connection?.otherUser?.display_name || 'Roommate Bro'}
            </Text>
            <Text className="text-[10px] font-semibold text-emerald-600">Đang hoạt động</Text>
          </View>
        </View>

        {/* Action button in header */}
        {!isProposed && connection?.status === 'chatting' && (
          <TactileButton
            title="Rủ Cùng Thuê 🏠"
            variant="primary"
            size="sm"
            onPress={() => setProposeModalVisible(true)}
          />
        )}
      </View>

      {/* Room Proposal Card Banner inside chat */}
      {isProposed && (
        <View className="bg-amber-50 border-b border-amber-200 p-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Home size={18} color="#D97706" />
              <Text className="text-sm font-black text-amber-900 ml-1.5">
                Đề Xuất Cùng Thuê Phòng 🏠
              </Text>
            </View>
            <Text className="text-xs font-bold text-amber-700">
              "{connection?.proposed_room_name || 'Nhà Chung'}"
            </Text>
          </View>

          {isProposedByMe ? (
            <Text className="text-xs text-amber-800">
              Bạn đã rủ người bạn này cùng thuê phòng. Đang chờ phản hồi chấp nhận...
            </Text>
          ) : (
            <View className="space-y-2">
              <Text className="text-xs text-amber-800">
                Bạn này đã gửi lời mời cùng thuê phòng. Bro đồng ý tạo phòng để bắt đầu chia việc nhà nhé?
              </Text>
              <TactileButton
                title="Đồng Ý Cùng Thuê & Tạo Phòng 🎉"
                variant="primary"
                size="sm"
                isLoading={acceptRoomMutation.isPending}
                onPress={handleAcceptRoom}
              />
            </View>
          )}
        </View>
      )}

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View
                className={`mb-3 max-w-[80%] ${
                  isMe ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <View
                  className={`p-3.5 rounded-2xl ${
                    isMe
                      ? 'bg-[#FF5722] rounded-br-none shadow-sm'
                      : 'bg-white border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <Text className={`text-sm ${isMe ? 'text-white font-medium' : 'text-slate-800'}`}>
                    {item.content}
                  </Text>
                </View>
                <Text className="text-[10px] text-slate-400 mt-1 px-1">
                  {new Date(item.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center p-8 my-auto">
              <View className="w-16 h-16 rounded-full bg-violet-100 items-center justify-center mb-3">
                <Sparkles size={28} color="#6366F1" />
              </View>
              <Text className="text-base font-black text-slate-900 text-center">
                Bắt đầu trò chuyện thôi!
              </Text>
              <Text className="text-xs text-slate-400 text-center mt-1">
                Gửi lời chào hoặc rủ bạn cùng phòng đi xem phòng trọ nhé bro.
              </Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View className="bg-white p-3 border-t border-slate-200 flex-row items-center space-x-2">
          <TextInput
            className="flex-1 h-11 px-4 rounded-full bg-slate-100 font-medium text-slate-900"
            placeholder="Nhắn tin cho bạn cùng phòng..."
            placeholderTextColor="#94A3B8"
            value={inputContent}
            onChangeText={setInputContent}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputContent.trim() || sendMessageMutation.isPending}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              inputContent.trim() ? 'bg-[#FF5722] active:bg-[#F4511E]' : 'bg-slate-200'
            }`}
          >
            <Send size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Propose Room Modal */}
      <Modal visible={proposeModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-black text-slate-900 mb-1">
              Rủ Bạn Cùng Thuê Phòng 🏠
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Đặt tên cho phòng để khi bạn kia đồng ý, phòng sẽ được tạo tự động với 2 thành viên.
            </Text>

            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-700 uppercase mb-1.5">Tên phòng</Text>
              <TextInput
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900"
                placeholder="VD: Phòng 402 Hub"
                value={proposedRoomName}
                onChangeText={setProposedRoomName}
              />
            </View>

            <View className="flex-row space-x-3">
              <TactileButton
                title="Hủy"
                variant="outline"
                size="md"
                onPress={() => setProposeModalVisible(false)}
                style={{ flex: 1 }}
              />
              <TactileButton
                title="Gửi Lời Rủ"
                variant="primary"
                size="md"
                isLoading={proposeRoomMutation.isPending}
                onPress={handleProposeRoom}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
