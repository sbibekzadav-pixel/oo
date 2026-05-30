import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';

export default function NotificationsScreen({ navigation }) {
  const {
    notifications,
    loading,
    markAsRead,
    markAllRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();

  const { colors, shadows, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fixed: wrapped in useCallback and correctly calls removeNotification
  const confirmDelete = useCallback(
    (item) => {
      Alert.alert(
        'Remove Notification',
        'Delete this notification?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeNotification(item.id);
            },
          },
        ],
        { cancelable: true },
      );
    },
    [removeNotification],
  );

  // Fixed: wrapped in useCallback, correctly calls clearAllNotifications
  const confirmClearAll = useCallback(() => {
    if (!notifications.length) return;
    Alert.alert(
      'Clear All Notifications',
      'Remove all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllNotifications();
          },
        },
      ],
      { cancelable: true },
    );
  }, [notifications.length, clearAllNotifications]);

  const renderItem = ({ item }) => (
    <View style={[styles.card, !item.read && styles.cardUnread]}>
      <TouchableOpacity
        style={styles.cardMain}
        activeOpacity={0.75}
        onPress={() => {
          if (!item.read) markAsRead(item.id);
        }}
      >
        <View style={[styles.iconBox, { backgroundColor: item.bg || colors.primaryLight }]}>
          <Ionicons
            name={item.icon || 'notifications'}
            size={22}
            color={item.color || colors.primary}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                !item.read && styles.titleUnread,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={3}>
            {item.message}
          </Text>
          <Text style={[styles.time, { color: colors.textLight }]}>{item.time}</Text>
        </View>
      </TouchableOpacity>

      {/* Delete button — always visible and functional */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <View style={styles.deleteBtnInner}>
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedSafeArea style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Clear All — always rendered, disabled only when empty */}
        <TouchableOpacity
          onPress={confirmClearAll}
          style={[styles.clearBtn, !notifications.length && styles.clearBtnDisabled]}
          disabled={!notifications.length}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Mark all read row */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          onPress={markAllRead}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={16} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>
            Mark all as read ({unreadCount})
          </Text>
        </TouchableOpacity>
      )}

      {/* Body */}
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications…
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          style={{ flex: 1, backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            unreadCount > 0 ? (
              <View style={[styles.unreadBanner, { backgroundColor: isDark ? 'rgba(56,189,248,0.1)' : colors.primaryLight }]}>
                <View style={styles.unreadDotBig} />
                <Text style={[styles.unreadBannerText, { color: colors.primary }]}>
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? colors.surfaceAlt : colors.primaryLight }]}>
                <Ionicons name="notifications-off-outline" size={42} color={colors.textLight} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No notifications yet. We'll let you know when something happens.
              </Text>
            </View>
          }
        />
      )}
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2,
  },
  unreadBadge: {
    backgroundColor: '#f87171',
    borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14,
  },
  clearBtnDisabled: { opacity: 0.4 },
  clearBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Mark all
  markAllRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, paddingVertical: 11,
    borderBottomWidth: 1,
  },
  markAllText: { fontSize: 13.5, fontWeight: '600' },

  // Loading
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },

  // List
  list: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 40 },

  // Unread banner
  unreadBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 11, marginBottom: 12,
  },
  unreadDotBig: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginRight: 9,
  },
  unreadBannerText: { fontSize: 13, fontWeight: '600' },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? COLORS.card : '#ffffff',
    borderRadius: 18,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  cardUnread: {
    borderLeftWidth: 3.5,
    borderLeftColor: COLORS.primary,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 13,
    flexShrink: 0,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20,
  },
  titleUnread: { fontWeight: '800' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginLeft: 7, flexShrink: 0,
  },
  message: {
    fontSize: 13, lineHeight: 19, marginBottom: 6,
  },
  time: { fontSize: 11.5, fontWeight: '500' },

  // Delete button — always accessible
  deleteBtn: {
    paddingRight: 14,
    paddingLeft: 4,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  deleteBtnInner: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : '#fff0f0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(248,113,113,0.2)' : '#fee2e2',
  },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 30 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  emptyText: {
    fontSize: 14, textAlign: 'center', lineHeight: 21,
  },
});
