import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { callProviderNow, openInAppChat } from '../../utils/bookingNavigation';
import { useBookmarks } from '../../context/BookmarksContext';

export default function ProviderProfileScreen({ navigation, route }) {
  const { provider } = route.params;
  const { getServicesByProvider } = useData();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const bookmarked = isBookmarked('provider', provider?.id);
  const providerServices = getServicesByProvider(provider.id);

  const handleCall = () => callProviderNow(provider);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero — scrolls with profile content */}
        <View style={styles.hero}>
          <LinearGradient colors={colors.gradientHeader} style={StyleSheet.absoluteFill} />
          <Image source={{ uri: provider.avatar }} style={styles.avatar} />
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{provider.name}</Text>
              {provider.verified && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
            </View>
            <View style={[styles.badge, { backgroundColor: provider.badgeColor }]}>
              <Text style={styles.badgeText}>{provider.badge}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.ratingText}>{provider.rating} ({provider.reviewCount})</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{provider.location}</Text>
            </View>
          </View>
        </View>
        {/* Price */}
        <View style={styles.priceCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>
              Rs. {provider.price > 0 ? provider.price.toLocaleString() : 'Free'}
              <Text style={styles.priceUnit}> {provider.priceUnit}</Text>
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{provider.jobs}+</Text>
              <Text style={styles.statLbl}>Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{provider.experience}</Text>
              <Text style={styles.statLbl}>Experience</Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.aboutText}>{provider.about}</Text>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.skillsRow}>
            {provider.skills?.map((s, i) => (
              <View key={i} style={styles.skillPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Gallery */}
        {provider.gallery?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <Text style={styles.viewAll}>View all</Text>
            </View>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {provider.gallery.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.galleryImg} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Services */}
        {providerServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            {providerServices.map(svc => (
              <TouchableOpacity
                key={svc.id}
                style={styles.serviceItem}
                onPress={() => navigation.navigate('ServiceDetail', { service: svc })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: svc.image }} style={styles.svcImg} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.svcTitle} numberOfLines={1}>{svc.title}</Text>
                  <Text style={styles.svcPrice}>Rs. {svc.price.toLocaleString()}</Text>
                  <View style={styles.svcRating}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.svcRatingText}>{svc.rating}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.heroNav} pointerEvents="box-none">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleBookmark('provider', provider)} style={styles.navBtn}>
          <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? colors.secondary : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={styles.messageBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => openInAppChat(navigation, { provider })}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleCall} activeOpacity={0.9}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.bookBtn}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.bookBtnText}>Call Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { height: 280, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 24, position: 'relative' },
  heroNav: {
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#fff',
    marginBottom: 12, ...SHADOWS.lg,
  },
  heroInfo: { alignItems: 'center', gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  content: { flex: 1 },
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginTop: 16, backgroundColor: COLORS.primaryLight,
    borderRadius: 16, padding: 16,
  },
  priceLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  priceValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  priceUnit: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '400' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textSecondary },
  statDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  aboutText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12,
  },
  skillText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  galleryImg: { width: 110, height: 80, borderRadius: 12 },
  serviceItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 14, padding: 12, marginBottom: 10,
  },
  svcImg: { width: 60, height: 60, borderRadius: 10 },
  svcTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  svcPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  svcRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  svcRatingText: { fontSize: 12, color: COLORS.textSecondary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, gap: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16,
  },
  messageBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  bookBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15,
  },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
