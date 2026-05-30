import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, Animated, Dimensions, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import TopLogoBar from '../../components/TopLogoBar';
import ThemedScrollView from '../../components/ThemedScrollView';
import { useSearchFilter } from '../../context/SearchFilterContext';
import ServiceWhereWhatFlow from '../../components/ServiceWhereWhatFlow';
import {
  filterServicesByWhatAndWhere,
  filterProvidersByLocation,
  applyDestinationFilterToService,
  applyLocationFilterToService,
} from '../../utils/serviceFilters';
import { runWebsiteSearch } from '../../utils/websiteSearch';
import { callServiceNow, openChatbot } from '../../utils/bookingNavigation';
import { resolveServiceCategory } from '../../utils/categoryMap';
import { USE_NATIVE_DRIVER, fadeInInitial } from '../../utils/animation';
import { getLocalizedServiceLabel } from '../../utils/serviceLabels';
import VoiceSearchModal from '../../components/VoiceSearchModal';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 48;

const AnimatedCard = ({ children, delay = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(fadeInInitial)).current;
  const translateY = useRef(new Animated.Value(Platform.OS === 'web' ? 0 : 20)).current;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [delay, fadeAnim, translateY]);
  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const { services, providers, homeCategories, mostBooked, banners } = useData();
  const { whatSlug, where, wherePlace, destinationPoint, isReady } = useSearchFilter();
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef(null);
  const BANNERS = banners.length ? banners : [];

  useEffect(() => {
    if (!BANNERS.length) return undefined;
    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % BANNERS.length;
      bannerRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
      setBannerIndex(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [bannerIndex, BANNERS.length]);

  const filteredServices = useMemo(
    () => filterServicesByWhatAndWhere(services, { whatSlug, location: where }),
    [services, whatSlug, where],
  );

  const popularServicesList = useMemo(() => {
    const pool = isReady ? filteredServices : services;
    const matched = pool.filter(
      (s) => mostBooked.includes(s.id) || (s.slug && mostBooked.includes(`web-${s.slug}`)),
    );
    if (matched.length) return matched.slice(0, 6);
    return pool.filter((s) => s.featured).slice(0, 6);
  }, [services, mostBooked, filteredServices, isReady]);

  const popularNear = useMemo(() => {
    let list = providers.filter((p) => p.id !== 'orderme');
    if (where) list = filterProvidersByLocation(list, where);
    if (whatSlug) list = list.filter((p) => p.category === whatSlug);
    return list.slice(0, 5);
  }, [providers, where, whatSlug]);

  const runSearch = useCallback(() => {
    runWebsiteSearch(navigation, {
      services, whatSlug, where, wherePlace, destinationPoint,
    });
  }, [navigation, services, whatSlug, where, wherePlace, destinationPoint]);

  const openWebsiteService = useCallback(
    (service) => {
      if (!service?.id) return;
      let svc = where
        ? applyLocationFilterToService(service, where, wherePlace)
        : service;
      if (destinationPoint) svc = applyDestinationFilterToService(svc, destinationPoint);
      navigation.navigate('ServiceDetail', { service: svc });
    },
    [navigation, destinationPoint, where, wherePlace],
  );

  const openCategory = useCallback(
    (item) => {
      if (item.id === 'more') {
        navigation.navigate('AllServices');
        return;
      }
      const slug = resolveServiceCategory(item.id);
      const svc = services.find((s) => s.slug === slug);
      if (svc) {
        openWebsiteService(svc);
        return;
      }
      navigation.navigate('Services', { category: slug });
    },
    [navigation, services, openWebsiteService],
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => openCategory(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={2}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderMostBooked = ({ item, index }) => (
    <TouchableOpacity
      style={styles.mostBookedCard}
      onPress={() => openWebsiteService(item)}
      activeOpacity={0.9}
    >
        <Image source={{ uri: item.image }} style={styles.mostBookedImg} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.mostBookedGrad} />
        <View style={styles.mostBookedBadge}>
          <Text style={[styles.mostBookedBadgeText, { color: item.categoryColor }]}>
            {item.categoryLabel}
          </Text>
        </View>
        <View style={styles.mostBookedInfo}>
          <Text style={styles.mostBookedTitle} numberOfLines={1}>
            {getLocalizedServiceLabel(item.slug, item.title, language)}
          </Text>
          <View style={styles.mostBookedRating}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.mostBookedRatingText}>{item.rating}</Text>
          </View>
          <Text style={styles.mostBookedPrice}>
            {item.price > 0 ? `Rs. ${item.price.toLocaleString()}` : 'Get Quote'}
          </Text>
        </View>
    </TouchableOpacity>
  );

  const renderPopular = ({ item, index }) => (
    <AnimatedCard delay={index * 100}>
      <TouchableOpacity
        style={styles.popularCard}
        onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.avatar }} style={styles.popularAvatar} />
        <View style={styles.popularInfo}>
          <View style={styles.popularHeader}>
            <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.popularBadge, { backgroundColor: item.badgeColor + '20' }]}>
              <Text style={[styles.popularBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
            </View>
          </View>
          <View style={styles.popularRatingRow}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.popularRating} numberOfLines={1}>
              {item.rating} ({item.reviewCount} {t('reviews')})
            </Text>
          </View>
          <Text style={styles.popularPrice}>
            {item.price > 0 ? `Rs. ${item.price}` : 'Call for quote'}
            <Text style={styles.popularPriceUnit}> {item.priceUnit}</Text>
          </Text>
        </View>
        <View style={styles.popularActions}>
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => navigation.navigate('ProviderProfile', { provider: item })}
          >
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={styles.viewProfileText}>{t('viewShort')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookNowSmallBtn}
            onPress={() => {
              const svc = services.find((s) => s.providerId === item.id)
                || services.find((s) => s.slug === item.category);
              callServiceNow(svc || services[0], item);
            }}
          >
            <LinearGradient colors={colors.gradientBlue} style={styles.bookNowSmallGrad}>
              <Text style={styles.bookNowSmallText}>{t('bookNowShort')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </AnimatedCard>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <TopLogoBar />
      <ThemedScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <AnimatedCard>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={{ uri: user?.avatar }} style={styles.avatar} />
              <View style={styles.headerTextWrap}>
                <Text style={styles.greeting}>{t('hello')}</Text>
                <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedCard>

        {/* What / Where — like orderme.com.np */}
        <AnimatedCard delay={100}>
          <ServiceWhereWhatFlow onSearch={runSearch} />
        </AnimatedCard>

        <AnimatedCard delay={120}>
          <TouchableOpacity
            style={styles.voiceRow}
            onPress={() => setVoiceModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="mic-outline" size={20} color={colors.primary} />
            <Text style={[styles.voiceRowText, { color: colors.textSecondary }]} numberOfLines={1}>
              {t('searchAnyService')}
            </Text>
          </TouchableOpacity>
        </AnimatedCard>

        {/* Promo Banners */}
        <AnimatedCard delay={150}>
          <View style={styles.bannerSection}>
            <ScrollView
              ref={bannerRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={{ width: BANNER_WIDTH }}
              onMomentumScrollEnd={e => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH))}
            >
              {BANNERS.map((b) => (
                <LinearGradient key={b.id} colors={b.gradient} style={[styles.banner, { width: BANNER_WIDTH }]}>
                  <View style={styles.bannerContent}>
                    <Text style={styles.bannerTag} numberOfLines={1}>{t(b.titleKey)}</Text>
                    <Text style={styles.bannerTitle} numberOfLines={2}>{t(b.subtitleKey)}</Text>
                    <TouchableOpacity
                      style={styles.bannerBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (b.ctaKey === 'claimNow') {
                          navigation.navigate('AllServices');
                          return;
                        }
                        const svc = popularServicesList[0] || services[0];
                        if (svc) {
                          const prov = providers.find((p) => p.id === svc.providerId);
                          callServiceNow(svc, prov);
                        }
                      }}
                    >
                      <Ionicons name="call" size={14} color={colors.primary} />
                      <Text style={styles.bannerBtnText} numberOfLines={1}>{t(b.ctaKey)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bannerIconArea}>
                    {b.image ? (
                      <Image source={{ uri: b.image }} style={styles.bannerImage} resizeMode="cover" />
                    ) : (
                      <>
                        <View style={styles.bannerIconCircle}>
                          <Ionicons name={b.icon} size={50} color="rgba(255,255,255,0.4)" />
                        </View>
                        <Ionicons name={b.icon} size={64} color="rgba(255,255,255,0.9)" />
                      </>
                    )}
                  </View>
                </LinearGradient>
              ))}
            </ScrollView>
            <View style={styles.bannerDots}>
              {BANNERS.map((_, i) => (
                <View key={i} style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]} />
              ))}
            </View>
          </View>
        </AnimatedCard>

        {/* Popular Services */}
        <AnimatedCard delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('popularServices')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={styles.viewAll}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        <FlatList
          data={popularServicesList}
          renderItem={renderMostBooked}
          keyExtractor={(item) => item.id}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mostBookedList}
          snapToInterval={180}
          decelerationRate="fast"
        />

        <AnimatedCard delay={220}>
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>{t('categories')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
              <Text style={styles.viewAll}>{t('more')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        <FlatList
          data={homeCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={styles.categoriesGrid}
        />

        {/* Popular Near You */}
        <AnimatedCard delay={250}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('popularNearYou')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Services')}>
              <Text style={styles.viewAll}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>

        <FlatList
          data={popularNear}
          renderItem={renderPopular}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.popularList}
        />

        <View style={{ height: 32 }} />
      </ThemedScrollView>
      <VoiceSearchModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onSpeechResult={() => navigation.navigate('Services')}
      />

    </SafeAreaView>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  headerTextWrap: { flex: 1, minWidth: 0, marginLeft: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: COLORS.primary },
  greeting: { fontSize: 13, color: COLORS.textSecondary },
  userName: { fontSize: 17, fontWeight: '800', color: COLORS.text, flexShrink: 1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm, position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger,
    borderWidth: 1.5, borderColor: '#fff',
  },
  voiceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginVertical: 4, paddingVertical: 6,
  },
  voiceRowText: { fontSize: 13, fontWeight: '600', flex: 1 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14, marginHorizontal: 20,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  pickerLabel: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  pickerValue: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700', color: COLORS.text },
  findBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 10, paddingVertical: 14, borderRadius: 14,
  },
  findBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  quickNavRow: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 4, gap: 8,
  },
  quickNavItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  quickNavText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  searchPlaceholder: { flex: 1, color: COLORS.textLight, fontSize: 14 },
  filterBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  bannerSection: { marginHorizontal: 24, marginBottom: 8 },
  banner: {
    borderRadius: 20, padding: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
    minHeight: 130,
  },
  bannerContent: { flex: 1, marginRight: 8, minWidth: 0 },
  bannerTag: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 22, marginBottom: 4 },
  bannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 50, paddingVertical: 8, paddingHorizontal: 16,
    alignSelf: 'flex-start', marginTop: 8,
  },
  bannerBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  bannerIconArea: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerImage: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  bannerIconCircle: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
  },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textMuted },
  bannerDotActive: { width: 20, backgroundColor: COLORS.primary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  viewAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  categoriesGrid: { paddingHorizontal: 12, paddingBottom: 4 },
  categoryItem: { flex: 1, alignItems: 'center', margin: 6, gap: 6 },
  categoryIcon: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  categoryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  popularList: { paddingHorizontal: 20, gap: 12 },
  popularCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  popularAvatar: { width: 52, height: 52, borderRadius: 26 },
  popularInfo: { flex: 1 },
  popularHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  popularName: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  popularBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  popularBadgeText: { fontSize: 10, fontWeight: '700' },
  popularRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  popularRating: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },
  popularPrice: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  popularPriceUnit: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '400' },
  popularActions: { gap: 8, alignItems: 'center' },
  viewProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  viewProfileText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  bookNowSmallBtn: { borderRadius: 10, overflow: 'hidden' },
  bookNowSmallGrad: { paddingVertical: 6, paddingHorizontal: 12 },
  bookNowSmallText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  mostBookedList: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  mostBookedCard: {
    width: 170, height: 210, borderRadius: 20, overflow: 'hidden', ...SHADOWS.card,
  },
  mostBookedImg: { width: '100%', height: '100%', position: 'absolute' },
  mostBookedGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  mostBookedBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  mostBookedBadgeText: { fontSize: 10, fontWeight: '700' },
  mostBookedInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  mostBookedTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 },
  mostBookedRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  mostBookedRatingText: { fontSize: 11, color: '#fff' },
  mostBookedPrice: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
