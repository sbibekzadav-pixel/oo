import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useBooking } from '../../context/BookingContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { callProviderNow } from '../../utils/bookingNavigation';
import TopLogoBar from '../../components/TopLogoBar';

const TABS = ['Active', 'Completed', 'Cancelled'];

const getStatusConfig = (isDark) => ({
  pending: { label: 'Pending', color: '#f59e0b', bg: isDark ? '#422006' : '#fffbeb', icon: 'time-outline' },
  confirmed: { label: 'Confirmed', color: isDark ? '#60a5fa' : '#3b82f6', bg: isDark ? '#1e3a5f' : '#eff6ff', icon: 'checkmark-circle-outline' },
  in_progress: { label: 'In Progress', color: isDark ? '#a78bfa' : '#8b5cf6', bg: isDark ? '#2e1065' : '#f5f3ff', icon: 'play-circle-outline' },
  completed: { label: 'Completed', color: '#34d399', bg: isDark ? '#064e3b' : '#ecfdf5', icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelled', color: '#f87171', bg: isDark ? '#450a0a' : '#fef2f2', icon: 'close-circle-outline' },
});

export default function MyBookingsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Active');
  const { bookings, bookingsLoading, cancelBooking } = useBooking();
  const { getProvider, services } = useData();
  const { t } = useLanguage();
  const { colors, shadows, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const STATUS_CONFIG = useMemo(() => getStatusConfig(isDark), [isDark]);

  const filtered = bookings.filter((b) => {
    if (activeTab === 'Active') return ['pending', 'confirmed', 'in_progress'].includes(b.status);
    if (activeTab === 'Completed') return b.status === 'completed';
    return b.status === 'cancelled';
  });

  const renderBooking = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isActive = ['pending', 'confirmed', 'in_progress'].includes(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.categoryDot, { backgroundColor: (item.categoryColor || colors.primary) + '30' }]}>
            <Ionicons name="construct-outline" size={16} color={item.categoryColor || colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.serviceName}</Text>
            <Text style={styles.bookingRef}>{item.bookingRef}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.providerRow}>
          {item.providerAvatar ? (
            <Image source={{ uri: item.providerAvatar }} style={styles.providerAvatar} />
          ) : null}
          <View>
            <Text style={styles.providerName}>{item.providerName}</Text>
            <Text style={styles.packageText}>{item.package} Package</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailChip}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
          <View style={styles.detailChip}>
            <Ionicons name="time-outline" size={13} color={colors.primary} />
            <Text style={styles.detailText}>{item.time}</Text>
          </View>
          <View style={styles.detailChip}>
            <Ionicons name="cash-outline" size={13} color={colors.primary} />
            <Text style={styles.detailText}>Rs. {item.price?.toLocaleString()}</Text>
          </View>
        </View>

        {isActive && (
          <View style={styles.statusBar}>
            {['pending', 'confirmed', 'in_progress', 'completed'].map((s, i) => {
              const currentIdx = ['pending', 'confirmed', 'in_progress', 'completed'].indexOf(item.status);
              return (
                <View key={s} style={styles.statusStep}>
                  <View style={[styles.statusStepDot, i <= currentIdx && { backgroundColor: colors.primary }]}>
                    {i < currentIdx && <Ionicons name="checkmark" size={8} color="#fff" />}
                  </View>
                  {i < 3 && <View style={[styles.statusStepLine, i < currentIdx && { backgroundColor: colors.primary }]} />}
                </View>
              );
            })}
          </View>
        )}

        {item.status === 'completed' && item.review && (
          <View style={[styles.reviewBox, isDark && { backgroundColor: '#422006', borderColor: '#78350f' }]}>
            <View style={styles.reviewStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name={i < item.review.rating ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
              ))}
            </View>
            <Text style={styles.reviewComment} numberOfLines={2}>{item.review.comment}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {isActive && (
            <>
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate('Tracking', { booking: item })}
                activeOpacity={0.85}
              >
                <Ionicons name="location-outline" size={15} color={colors.primary} />
                <Text style={styles.trackBtnText}>Track</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelBooking(item.id)} activeOpacity={0.85}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'completed' && !item.review && (
            <TouchableOpacity style={styles.reviewBtn}>
              <Ionicons name="star-outline" size={15} color={colors.secondary} />
              <Text style={styles.reviewBtnText}>Write Review</Text>
            </TouchableOpacity>
          )}
          {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.rebookBtn}
              activeOpacity={0.85}
              onPress={() => {
                const svc = services.find((s) => s.id === item.serviceId);
                const prov = svc ? getProvider(svc.providerId) : null;
                if (prov) callProviderNow(prov);
              }}
            >
              <LinearGradient colors={colors.gradientBlue} style={styles.rebookGrad}>
                <Ionicons name="call" size={15} color="#fff" />
                <Text style={styles.rebookText}>{t('callAgain')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ThemedSafeArea edges={['left', 'right', 'bottom']}>
      <TopLogoBar />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={styles.tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {bookingsLoading && bookings.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your bookings…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={72} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptySubtitle}>Your {activeTab.toLowerCase()} bookings will appear here</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllServices')} activeOpacity={0.85}>
                <LinearGradient colors={colors.gradientBlue} style={styles.exploreBtn}>
                  <Text style={styles.exploreBtnText}>Explore Services</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  filterBtn: {
    width: 40, height: 40, backgroundColor: COLORS.card, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, marginBottom: 8,
    backgroundColor: COLORS.card, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 16, right: 16,
    height: 3, backgroundColor: COLORS.primary, borderRadius: 2,
  },
  loadingWrap: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  list: { padding: 20, gap: 14, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  categoryDot: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  bookingRef: { fontSize: 11, color: COLORS.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  providerAvatar: { width: 36, height: 36, borderRadius: 18 },
  providerName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  packageText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  detailsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  detailChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10,
  },
  detailText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  statusBar: { flexDirection: 'row', alignItems: 'center' },
  statusStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statusStepDot: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  statusStepLine: { flex: 1, height: 3, backgroundColor: COLORS.border },
  reviewBox: {
    backgroundColor: '#fffbeb', borderRadius: 12, padding: 10, gap: 6,
    borderWidth: 1, borderColor: '#fef3c7',
  },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 12, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  trackBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 10,
  },
  trackBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  reviewBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.secondary, borderRadius: 12, paddingVertical: 10,
  },
  reviewBtnText: { color: COLORS.secondary, fontWeight: '700', fontSize: 13 },
  rebookBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  rebookGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10 },
  rebookText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  exploreBtn: { borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  exploreBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
