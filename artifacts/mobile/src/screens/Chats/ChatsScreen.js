import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { listenToUserChats } from '../../services/chatService';

// ── helpers ─────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Chat row ─────────────────────────────────────────────────────────────────
const ChatRow = React.memo(function ChatRow({ chat, onPress, colors, isDark }) {
  const hasAvatar = !!chat.providerAvatar;
  const initials = (chat.providerName || 'P').slice(0, 2).toUpperCase();
  const unread = chat.unreadCount || 0;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        {hasAvatar ? (
          <Image source={{ uri: chat.providerAvatar }} style={styles.avatar} />
        ) : (
          <LinearGradient colors={colors.gradientBlue} style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={[
          styles.onlineDot,
          { borderColor: isDark ? colors.background : '#fff' },
        ]} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.name,
              { color: colors.text },
              unread > 0 && { fontWeight: '800' },
            ]}
            numberOfLines={1}
          >
            {chat.providerName || 'Provider'}
          </Text>
          <Text style={[
            styles.time,
            { color: unread > 0 ? colors.primary : colors.textLight },
          ]}>
            {timeAgo(chat.lastMessageAt)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.lastMsg,
              { color: unread > 0 ? colors.text : colors.textSecondary },
              unread > 0 && { fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage || 'Tap to start chatting'}
          </Text>
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </View>

        {!!chat.providerCategory && (
          <Text style={[styles.category, { color: colors.textLight }]} numberOfLines={1}>
            {chat.providerCategory}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ChatsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setChats([]); setLoading(false); return; }
    setLoading(true);
    const unsub = listenToUserChats(user.id, (list) => {
      setChats(list);
      setLoading(false);
    });
    return unsub;
  }, [user?.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) =>
      (c.providerName || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q),
    );
  }, [chats, search]);

  const openChat = useCallback((chat) => {
    navigation.navigate('Chat', {
      provider: {
        id: chat.providerId,
        name: chat.providerName,
        avatar: chat.providerAvatar,
        category: chat.providerCategory,
      },
    });
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        <TouchableOpacity
          style={[styles.composeBtn, { backgroundColor: colors.primaryLight }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Services' })}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[
        styles.searchWrap,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}>
        <View style={[
          styles.searchBar,
          {
            backgroundColor: isDark ? colors.surfaceAlt : colors.inputBg,
            borderColor: isDark ? colors.border : colors.inputBg,
          },
        ]}>
          <Ionicons name="search-outline" size={18} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.chatId || item.id || item.providerId}
          renderItem={({ item }) => (
            <ChatRow
              chat={item}
              onPress={() => openChat(item)}
              colors={colors}
              isDark={isDark}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.divider }]} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textLight} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Message any service provider to start chatting in real time.
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Services' })}
              >
                <Text style={styles.emptyBtnText}>Browse Services</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  composeBtn: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  searchWrap: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 18, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#10b981', borderWidth: 2,
  },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  name: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  time: { fontSize: 12 },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: { fontSize: 13, flex: 1, marginRight: 8 },
  category: { fontSize: 11, marginTop: 2 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  separator: { height: 1, marginLeft: 86 },
  emptyContainer: { flex: 1 },
  emptyWrap: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
