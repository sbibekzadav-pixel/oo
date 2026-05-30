import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, StatusBar, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { openInAppChat } from '../../utils/bookingNavigation';

// ── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'service', label: 'Services' },
  { key: 'provider', label: 'Providers' },
];

// ── Bookmark card ────────────────────────────────────────────────────────────
const BookmarkCard = React.memo(function BookmarkCard({ item, onPress, onMessage, onRemove, colors, isDark }) {
  const isService = item.type === 'service';

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image / Avatar */}
      <View style={cardStyles.imageWrap}>
        {(item.image || item.avatar) ? (
          <Image
            source={{ uri: item.image || item.avatar }}
            style={cardStyles.image}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={isService ? colors.gradientBlue : colors.gradientOrange || ['#f59e0b', '#d97706']}
            style={cardStyles.imagePlaceholder}
          >
            <Ionicons
              name={isService ? 'construct-outline' : 'person-outline'}
              size={28}
              color="#fff"
            />
          </LinearGradient>
        )}
        {/* Type badge */}
        <View style={[
          cardStyles.badge,
          { backgroundColor: isService ? colors.primary : colors.secondary || '#f59e0b' },
        ]}>
          <Text style={cardStyles.badgeText}>
            {isService ? 'Service' : 'Provider'}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={cardStyles.body}>
        <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title || item.name || 'Unnamed'}
        </Text>
        {!!item.category && (
          <View style={cardStyles.row}>
            <Ionicons name="grid-outline" size={13} color={colors.textLight} />
            <Text style={[cardStyles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
        )}
        {!!(item.location) && (
          <View style={cardStyles.row}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={[cardStyles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={cardStyles.actions}>
          {item.type === 'provider' && (
            <TouchableOpacity
              style={[cardStyles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={onMessage}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#fff" />
              <Text style={cardStyles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              cardStyles.actionBtn,
              {
                backgroundColor: isDark ? colors.surfaceAlt : '#fee2e2',
                borderWidth: 1,
                borderColor: '#fca5a5',
              },
            ]}
            onPress={onRemove}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={[cardStyles.actionBtnText, { color: '#ef4444' }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────
export default function BookmarksScreen({ navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const { bookmarkList, toggleBookmark } = useBookmarks();
  const [activeTab, setActiveTab] = useState('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return bookmarkList;
    return bookmarkList.filter((b) => b.type === activeTab);
  }, [bookmarkList, activeTab]);

  const handlePress = useCallback((item) => {
    if (item.type === 'service') {
      navigation.navigate('ServiceDetail', { service: { id: item.id, title: item.title, category: item.category } });
    } else {
      navigation.navigate('ProviderProfile', { provider: { id: item.id, name: item.name, avatar: item.avatar, location: item.location } });
    }
  }, [navigation]);

  const handleMessage = useCallback((item) => {
    openInAppChat(navigation, {
      provider: {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        category: item.category,
      },
    });
  }, [navigation]);

  const handleRemove = useCallback((item) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove "${item.title || item.name}" from bookmarks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleBookmark(item.type, item),
        },
      ],
    );
  }, [toggleBookmark]);

  const counts = useMemo(() => ({
    all: bookmarkList.length,
    service: bookmarkList.filter((b) => b.type === 'service').length,
    provider: bookmarkList.filter((b) => b.type === 'provider').length,
  }), [bookmarkList]);

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
        <Text style={styles.headerTitle}>My Bookmarks</Text>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{bookmarkList.length}</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary },
              activeTab === tab.key && { fontWeight: '700' },
            ]}>
              {tab.label}
            </Text>
            <View style={[
              styles.tabBadge,
              {
                backgroundColor: activeTab === tab.key
                  ? colors.primary
                  : (isDark ? colors.surfaceAlt : '#e2e8f0'),
              },
            ]}>
              <Text style={[
                styles.tabBadgeText,
                { color: activeTab === tab.key ? '#fff' : colors.textSecondary },
              ]}>
                {counts[tab.key]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.type}_${item.id}`}
        renderItem={({ item }) => (
          <BookmarkCard
            item={item}
            onPress={() => handlePress(item)}
            onMessage={() => handleMessage(item)}
            onRemove={() => handleRemove(item)}
            colors={colors}
            isDark={isDark}
          />
        )}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="bookmark-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {activeTab === 'all' ? 'No bookmarks yet' : `No ${activeTab}s bookmarked`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Tap the bookmark icon on any service or provider to save it here.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Services')}
            >
              <Text style={styles.emptyBtnText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'web' ? 20 : 14,
    gap: 8,
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  headerCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
    marginRight: 8,
  },
  headerCountText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 24,
    gap: 6,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 14, fontWeight: '500' },
  tabBadge: {
    borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 20, alignItems: 'center',
  },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  emptyWrap: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', paddingVertical: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 24 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: { position: 'relative', width: 110 },
  image: { width: 110, minHeight: 140, backgroundColor: '#e2e8f0' },
  imagePlaceholder: {
    width: 110, minHeight: 140,
    justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: {
    flex: 1, padding: 14, gap: 6,
  },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 13, flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, borderRadius: 9,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
