import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, Animated, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  ensureChat,
  sendMessage,
  listenToMessages,
  markChatRead,
  makeChatId,
} from '../../services/chatService';

// ── Message bubble ──────────────────────────────────────────────────────────
const MessageBubble = React.memo(function MessageBubble({ msg, isMe, colors, isDark }) {
  const time = useMemo(() => {
    if (!msg.createdAt) return '';
    return new Date(msg.createdAt).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit',
    });
  }, [msg.createdAt]);

  return (
    <View style={[bubbleStyles.row, isMe && bubbleStyles.rowMe]}>
      {!isMe && (
        <View style={[bubbleStyles.senderDot, { backgroundColor: colors.primary }]} />
      )}
      <View style={[
        bubbleStyles.bubble,
        isMe
          ? [bubbleStyles.bubbleMe, { backgroundColor: colors.primary }]
          : [bubbleStyles.bubbleThem, {
              backgroundColor: isDark ? colors.surfaceAlt : '#f1f5f9',
              borderColor: isDark ? colors.border : 'transparent',
              borderWidth: isDark ? 1 : 0,
            }],
      ]}>
        <Text style={[
          bubbleStyles.text,
          { color: isMe ? '#ffffff' : colors.text },
        ]}>
          {msg.text}
        </Text>
        <View style={bubbleStyles.meta}>
          <Text style={[
            bubbleStyles.time,
            { color: isMe ? 'rgba(255,255,255,0.65)' : colors.textLight },
          ]}>
            {time}
          </Text>
          {isMe && (
            <Ionicons
              name={msg.read ? 'checkmark-done' : 'checkmark'}
              size={12}
              color="rgba(255,255,255,0.65)"
              style={{ marginLeft: 4 }}
            />
          )}
          {msg.pending && (
            <Ionicons
              name="time-outline"
              size={12}
              color="rgba(255,255,255,0.5)"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
});

// ── Typing indicator ────────────────────────────────────────────────────────
function TypingDots({ color }) {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 120),
        Animated.timing(d, { toValue: -6, duration: 220, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.delay(500),
      ])).start();
    });
  }, []);
  return (
    <View style={dotStyles.wrap}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, { backgroundColor: color, transform: [{ translateY: d }] }]}
        />
      ))}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function ChatScreen({ navigation, route }) {
  const { provider, prefillMessage = '' } = route?.params || {};
  const { colors, isDark, shadows } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(prefillMessage);
  const [chatId, setChatId] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // ── Init chat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !provider?.id) return;
    const id = makeChatId(user.id, provider.id);
    setChatId(id);
    ensureChat(user.id, provider.id, provider).catch((e) =>
      console.warn('ensureChat:', e?.message),
    );
  }, [user?.id, provider?.id]);

  // ── Messages listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    const unsub = listenToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      markChatRead(chatId).catch(() => {});
    });
    return unsub;
  }, [chatId]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !chatId || !user?.id || !provider?.id || sending) return;
    setInput('');
    setSending(true);
    try {
      await sendMessage(chatId, user.id, provider.id, text);
    } catch (e) {
      console.warn('handleSend:', e?.message);
    } finally {
      setSending(false);
    }
  }, [input, chatId, user?.id, provider?.id, sending]);

  const renderItem = useCallback(({ item }) => (
    <MessageBubble
      msg={item}
      isMe={item.senderId === user?.id}
      colors={colors}
      isDark={isDark}
    />
  ), [user?.id, colors, isDark]);

  const hasAvatar = !!provider?.avatar;
  const initials = (provider?.name || 'P').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {hasAvatar ? (
            <Image source={{ uri: provider.avatar }} style={styles.headerAvatar} />
          ) : (
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
              style={styles.headerAvatarPlaceholder}
            >
              <Text style={styles.headerInitials}>{initials}</Text>
            </LinearGradient>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {provider?.name || 'Provider'}
            </Text>
            {!!provider?.category && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {provider.category}
              </Text>
            )}
          </View>
        </View>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id || String(item.createdAt)}
            contentContainerStyle={[
              styles.list,
              messages.length === 0 && styles.listEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={52} color={colors.textLight} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Say Hello!
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Start a conversation with {provider?.name || 'this provider'}.
                </Text>
              </View>
            }
          />
        )}

        {/* Composer */}
        <View style={[
          styles.composer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}>
          <View style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? colors.surfaceAlt : colors.inputBg,
              borderColor: isDark ? colors.border : 'transparent',
              borderWidth: isDark ? 1 : 0,
            },
          ]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textLight}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: (input.trim() && !sending)
                  ? colors.primary
                  : (isDark ? colors.surfaceAlt : '#e2e8f0'),
              },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={input.trim() ? '#fff' : colors.textLight}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'web' ? 20 : 12,
    gap: 4,
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  headerAvatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerInitials: {
    color: '#fff', fontWeight: '800', fontSize: 15,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 8 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  composer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: { fontSize: 15, lineHeight: 22 },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
});

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-end' },
  senderDot: {
    width: 7, height: 7, borderRadius: 4,
    marginRight: 8, marginBottom: 8,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7,
    borderRadius: 18,
  },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  meta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', marginTop: 4,
  },
  time: { fontSize: 11 },
});

const dotStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
