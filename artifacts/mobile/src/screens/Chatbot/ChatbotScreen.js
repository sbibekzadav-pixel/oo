import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { loadChatHistory, saveChatHistory } from '../../services/chatHistory';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import TopLogoBar from '../../components/TopLogoBar';
import { getWelcomeMessage, getServiceIntro, getProviderIntro } from '../../services/chatbotEngine';
import { getAssistantReply } from '../../services/aiAssistant';
import { callServiceNow, callProviderNow, messageProvider } from '../../utils/bookingNavigation';
import VoiceSearchModal from '../../components/VoiceSearchModal';

const LOGO_IMG = require('../../logo.png');

let messageId = 0;
function nextId() {
  messageId += 1;
  return `m-${messageId}-${Date.now()}`;
}

function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

function TypingDots({ color }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]),
      ).start();
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, [dot1, dot2, dot3]);

  const dotStyle = { width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginHorizontal: 2 };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View key={i} style={[dotStyle, { transform: [{ translateY: d }] }]} />
      ))}
    </View>
  );
}

export default function ChatbotScreen({ navigation }) {
  const route = useRoute();
  const { colors, shadows, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const { services, providers, serviceCategories, getProvider } = useData();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const listRef = useRef(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [storedName, setStoredName] = useState(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const welcomeDoneRef = useRef(false);
  const contextKeyRef = useRef('');
  const inputRef = useRef(null);

  const effectiveName = user?.assistantName || user?.name || user?.displayName || storedName || 'User';

  useEffect(() => {
    if (user?.assistantName) setStoredName(user.assistantName);
    else if (user?.name) setStoredName(user.name);
  }, [user?.assistantName, user?.name]);

  useEffect(() => {
    if (!user?.id) return;
    loadChatHistory(user.id).then((saved) => {
      if (saved.length) {
        welcomeDoneRef.current = true;
        setMessages(saved);
        return;
      }
      if (!welcomeDoneRef.current) {
        welcomeDoneRef.current = true;
        const welcome = getWelcomeMessage(effectiveName);
        setMessages([{ id: nextId(), role: 'bot', ...welcome }]);
      }
    });
  }, [user?.id, effectiveName]);

  useEffect(() => {
    if (!user?.id || !messages.length) return;
    const timer = setTimeout(() => saveChatHistory(user.id, messages), 900);
    return () => clearTimeout(timer);
  }, [user?.id, messages]);

  const focusService = useMemo(() => {
    const id = route.params?.serviceId;
    return id ? services.find((s) => s.id === id) : null;
  }, [route.params?.serviceId, services]);

  const focusProvider = useMemo(() => {
    const id = route.params?.providerId;
    return id ? providers.find((p) => p.id === id) : route.params?.provider || null;
  }, [route.params?.providerId, route.params?.provider, providers]);

  const appendBot = useCallback((reply) => {
    setMessages((prev) => [
      ...prev,
      {
        id: nextId(),
        role: 'bot',
        text: reply.text,
        suggestions: reply.suggestions || [],
        serviceCards: reply.serviceCards || [],
        actions: reply.actions || [],
      },
    ]);
  }, []);

  const assistantCtx = useMemo(() => ({
    services,
    providers,
    serviceCategories,
    getProvider,
    focusService,
    focusProvider,
    userName: effectiveName,
  }), [services, providers, serviceCategories, getProvider, focusService, focusProvider, effectiveName]);

  const runReply = useCallback(async (userText, historySnapshot) => {
    const nameMatch = userText.match(/(?:my name is|i(?:'m| am)|call me)\s+([A-Za-z]+)/i);
    if (nameMatch) {
      const detectedName = nameMatch[1];
      setStoredName(detectedName);
      if (user?.id) updateProfile({ assistantName: detectedName }).catch(() => {});
    }

    try {
      const reply = await getAssistantReply(userText, { ...assistantCtx, userName: effectiveName }, historySnapshot);
      appendBot(reply);
    } catch (e) {
      appendBot({
        text: `माफ गर्नुहोस्! केही समस्या भयो। फेरि प्रयास गर्नुहोस्।`,
        suggestions: ['सबै सेवाहरू', 'प्लम्बर कल गर्नुहोस्'],
      });
    } finally {
      setTyping(false);
    }
  }, [assistantCtx, appendBot, effectiveName, user?.id, updateProfile]);

  const sendMessage = useCallback((text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || typing) return;
    setInput('');
    setTyping(true);
    setMessages((prev) => {
      const userMsg = { id: nextId(), role: 'user', text: trimmed };
      const next = [...prev, userMsg];
      runReply(trimmed, next);
      return next;
    });
  }, [input, runReply, typing]);

  useEffect(() => {
    if (user?.id || welcomeDoneRef.current) return;
    welcomeDoneRef.current = true;
    const welcome = getWelcomeMessage(effectiveName);
    setMessages([{ id: nextId(), role: 'bot', ...welcome }]);
  }, [effectiveName, user?.id]);

  useEffect(() => {
    const key = `${route.params?.serviceId || ''}:${route.params?.providerId || ''}`;
    if (key && key !== ':' && key !== contextKeyRef.current) {
      contextKeyRef.current = key;
      if (focusService) {
        const prov = getProvider(focusService.providerId);
        setTimeout(() => appendBot(getServiceIntro(focusService, prov)), 300);
      } else if (focusProvider) {
        setTimeout(() => appendBot(getProviderIntro(focusProvider, services)), 300);
      }
    }
  }, [route.params, focusService, focusProvider, services, getProvider, appendBot]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages, typing]);

  const onSuggestion = (s) => sendMessage(s);

  const onCallCard = (service, provider) => {
    if (provider) callProviderNow(provider);
    else if (service) callServiceNow(service, getProvider(service.providerId));
  };

  const onMessageCard = (service, provider) => {
    const phone = provider?.phone || service?.phone || service?.contactPhone;
    if (phone) {
      const msg = service 
        ? `नमस्ते, मलाई ${service.title} सेवा बारे जानकारी चाहिन्छ।` 
        : 'नमस्ते, कृपया सम्पर्क गर्नुहोस्।';
      messageProvider(phone, msg);
    } else {
      Alert.alert('No number', 'Contact number not available for messaging.');
    }
  };

  const renderServiceCard = (card) => {
    const { service, provider } = card;
    const price = service.packages?.[0]?.price ?? service.price ?? 0;
    return (
      <View key={service.id} style={styles.serviceCard}>
        <Image source={{ uri: service.image }} style={styles.serviceThumb} />
        <View style={styles.serviceCardBody}>
          <Text style={styles.serviceCardTitle}>{service.title}</Text>
          <Text style={styles.serviceCardMeta}>
            Rs. {price.toLocaleString()} · ⭐ {service.rating}
          </Text>
          <View style={styles.serviceCardActions}>
            <TouchableOpacity
              style={styles.cardBtnOutline}
              onPress={() => navigation.navigate('ServiceDetail', { service })}
            >
              <Text style={styles.cardBtnOutlineText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardBtnFill} onPress={() => onCallCard(service, provider)}>
              <Ionicons name="call" size={13} color="#fff" />
              <Text style={styles.cardBtnFillText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cardBtnOutline, { backgroundColor: '#10b981', borderColor: '#10b981' }]} 
              onPress={() => onMessageCard(service, provider)}
            >
              <Ionicons name="chatbubble-outline" size={13} color="#fff" />
              <Text style={[styles.cardBtnOutlineText, { color: '#fff' }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.botAvatarContainer}>
            <Image source={LOGO_IMG} style={styles.botAvatarImg} resizeMode="contain" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>
            {isUser ? item.text : parseBold(item.text)}
          </Text>
          {!isUser && item.serviceCards?.length > 0 && (
            <View style={styles.cardsWrap}>
              {item.serviceCards.map(renderServiceCard)}
            </View>
          )}
          {!isUser && item.actions?.length > 0 && (
            <View style={styles.actionRow}>
              {item.actions.map((act, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.actionBtn}
                  onPress={() => {
                    if (act.type === 'call') onCallCard(act.service, act.provider);
                    if (act.type === 'message') onMessageCard(act.service, act.provider);
                  }}
                >
                  <Ionicons name={act.type === 'call' ? 'call' : 'chatbubble-outline'} size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!isUser && item.suggestions?.length > 0 && (
            <View style={styles.chipsWrap}>
              {item.suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => onSuggestion(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedSafeArea edges={['left', 'right', 'bottom']}>
      <TopLogoBar />

      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Image source={LOGO_IMG} style={{ width: 42, height: 42 }} resizeMode="contain" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>OrderMe Assistant</Text>
          <Text style={styles.headerSub}>AI-powered help · 24/7</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListFooterComponent={typing ? (
            <View style={styles.typingRow}>
              <View style={styles.botAvatarContainer}>
                <Image source={LOGO_IMG} style={styles.botAvatarImg} resizeMode="contain" />
              </View>
              <View style={[styles.bubble, styles.bubbleBot]}>
                <TypingDots color={colors.primary} />
              </View>
            </View>
          ) : null}
        />

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={t('chatPlaceholder') || 'Ask about services, prices...'}
              placeholderTextColor={colors.textLight}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage()}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.voiceBtn} onPress={() => setVoiceModalVisible(true)}>
            <Ionicons name="mic" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => sendMessage()} disabled={!input.trim()}>
            <Ionicons name="send" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <VoiceSearchModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSpeechResult={(text) => sendMessage(text)}
      />
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 12 },
  headerIconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  headerTextWrap: { marginLeft: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  list: { padding: 16 },
  msgRow: { flexDirection: 'row', marginBottom: 18 },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatarContainer: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', marginRight: 10, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.border },
  botAvatarImg: { width: '100%', height: '100%' },
  userAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  bubble: { maxWidth: '78%', padding: 14, borderRadius: 18 },
  bubbleBot: { backgroundColor: isDark ? COLORS.surfaceAlt : '#f1f5f9', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextUser: { color: '#fff' },

  cardsWrap: { marginTop: 12, gap: 12 },
  serviceCard: { flexDirection: 'row', backgroundColor: isDark ? COLORS.card : '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  serviceThumb: { width: 80, height: 80 },
  serviceCardBody: { flex: 1, padding: 12 },
  serviceCardTitle: { fontWeight: '700', fontSize: 15 },
  serviceCardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  serviceCardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cardBtnOutline: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  cardBtnOutlineText: { color: COLORS.primary, fontWeight: '600', fontSize: 12 },
  cardBtnFill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, padding: 8, borderRadius: 8 },
  cardBtnFillText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  actionBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  chipText: { color: COLORS.primary, fontWeight: '600' },

  typingRow: { flexDirection: 'row', marginVertical: 10, alignItems: 'flex-end' },

  composer: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  inputWrap: { flex: 1, backgroundColor: isDark ? COLORS.surfaceAlt : COLORS.inputBg, borderRadius: 25, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, minHeight: 48, justifyContent: 'center' },
  input: { fontSize: 15, color: COLORS.text, maxHeight: 100 },
  voiceBtn: { padding: 10, marginLeft: 6 },
  sendBtn: { padding: 10, marginLeft: 4 },
  sendBtnDisabled: { opacity: 0.4 },
});
