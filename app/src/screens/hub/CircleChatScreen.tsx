import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import UserAvatar from '../../components/UserAvatar';
import api from '../../services/api';

interface CircleMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl: string | null;
  message: string;
  sentAt: string;
}

export default function CircleChatScreen({ route }: { route: any }) {
  const { circleId } = route.params;
  const [messages, setMessages] = useState<CircleMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/circles/${circleId}/messages`);
      setMessages(data.messages);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadMessages();
    // Poll every 10 seconds (lightweight — circles are small)
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [circleId]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');

    // Optimistic: add message immediately
    const optimisticMsg: CircleMessage = {
      id: `opt-${Date.now()}`,
      senderId: user?.id ?? '',
      senderName: user?.firstName ?? '',
      senderPhotoUrl: user?.photoUrl ?? null,
      message: trimmed,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const { data } = await api.post(`/circles/${circleId}/messages`, { message: trimmed });
      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => m.id === optimisticMsg.id ? data.message : m));
    } catch {
      // Remove optimistic, restore text
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: CircleMessage }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={{ marginRight: 8 }}>
            <UserAvatar firstName={item.senderName} photoUrl={item.senderPhotoUrl} size={28} />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.message}</Text>
          <Text style={styles.time}>
            {new Date(item.sentAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {messages.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>Start chatting with your circle!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message your circle..."
          placeholderTextColor="#555"
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  messages: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  messageRowMe: { justifyContent: 'flex-end' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#555' },
  emptyText: { fontSize: 14, color: '#444', marginTop: 4 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: '#4ade80', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 12, fontWeight: '700', color: '#4ade80', marginBottom: 2 },
  messageText: { fontSize: 15, color: '#fff' },
  messageTextMe: { color: '#0a0a0a' },
  time: { fontSize: 10, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#262626', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#fff',
  },
  sendButton: { backgroundColor: '#4ade80', borderRadius: 24, paddingHorizontal: 20, justifyContent: 'center' },
  sendText: { fontSize: 14, fontWeight: '700', color: '#0a0a0a' },
});
