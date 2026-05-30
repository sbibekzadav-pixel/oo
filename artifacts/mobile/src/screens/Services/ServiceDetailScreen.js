import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Dimensions, StatusBar, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SHADOWS } from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import {
  callServiceNow, openInAppChat, callPhone, formatServicePhones, navigateToBooking, callProviderNow,
} from '../../utils/bookingNavigation';
import { useBookmarks } from '../../context/BookmarksContext';
import { formatDisplayPhone } from '../../data/websiteLiveData';
import { useSearchFilter } from '../../context/SearchFilterContext';
import LiveProviderCard from '../../components/LiveProviderCard';
import { serviceSupportsBooking } from '../../data/websiteCatalog';
import { getLocalizedServiceLabel } from '../../utils/serviceLabels';
import {
  applyDestinationFilterToService,
  getDestinationPointsForService,
  providerStableKey,
  serviceNeedsDestinationPicker,
} from '../../utils/serviceFilters';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen({ navigation, route }) {
  const routeService = route.params?.service;
  const { destinationPoint: searchDestination, setDestination } = useSearchFilter();
  const [localDestination, setLocalDestination] = useState(null);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const activeDestination = localDestination ?? searchDestination ?? null;

  const destinationOptions = useMemo(
    () => (routeService ? getDestinationPointsForService(routeService) : []),
    [routeService],
  );

  const service = useMemo(() => {
    if (!routeService) return null;
    if (activeDestination && serviceNeedsDestinationPicker(routeService)) {
      return applyDestinationFilterToService(routeService, activeDestination);
    }
    return routeService;
  }, [routeService, activeDestination]);
  const { getProvider } = useData();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors: COLORS } = useTheme();
  const { t, language } = useLanguage();
  const styles = useMemo(() => createStyles(COLORS, SHADOWS), [COLORS]);
  const valid = Boolean(service?.id && service?.packages?.length);

  const [selectedPackage, setSelectedPackage] = useState(service?.packages?.[0] ?? null);
  const [expanded, setExpanded] = useState(false);
  const bookmarked = isBookmarked('service', service?.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const provider = valid ? getProvider(service.providerId) : null;
  const contactPhones = formatServicePhones(service);
  const liveProviders = service.providers?.length ? service.providers : null;
  const supportsBooking = serviceSupportsBooking(service);
  const providerPlaceholderIcon = useMemo(() => {
    const slug = service.slug || '';
    if (slug.includes('bus') || slug === 'hiace' || slug === 'scorpio' || slug === 'taxi' || slug === 'bike-ride') {
      return 'bus-outline';
    }
    if (slug === 'hotel' || slug === 'room-rent') return 'bed-outline';
    if (slug === 'resturant' || slug === 'biryani' || slug === 'sekuwa' || slug === 'coffee-shop') {
      return 'restaurant-outline';
    }
    return 'storefront-outline';
  }, [service.slug]);
  const showListPrice = supportsBooking && (selectedPackage?.price ?? 0) > 0;
  const showDestinationPicker = serviceNeedsDestinationPicker(routeService) && destinationOptions.length > 0;
  const activeDestinationLabel = destinationOptions.find((d) => d.value === activeDestination)?.value
    || activeDestination;

  const onSelectDestination = (point) => {
    setLocalDestination(point.value);
    setDestination(point.value, point.label);
    setDestinationModalVisible(false);
  };

  if (!valid || !selectedPackage) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 16, marginBottom: 16, textAlign: 'center' }}>{t('serviceNotAvailable')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#1a56db', fontWeight: '700' }}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBookmark = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    toggleBookmark('service', service);
  };

  const handleBookNow = () => {
    navigateToBooking(navigation, { service, selectedPackage, provider });
  };

  const handleCallNow = () => {
    callServiceNow(service, provider);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Image — inside scroll so it moves with page content */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: service.image }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
          {service.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{t('upTo')}</Text>
              <Text style={styles.discountPercent}>{service.discount}%</Text>
              <Text style={styles.discountText}>{t('off')}</Text>
            </View>
          )}
        </View>
        {/* Title & Price */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTitle}>
              {getLocalizedServiceLabel(service.slug, service.title, language)}
            </Text>
            <Text style={styles.serviceSubtitle}>Thorough care, spotless home.</Text>
          </View>
        </View>

        {showListPrice ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>Rs. {selectedPackage.price.toLocaleString()}</Text>
            <Text style={styles.originalPrice}>Rs. {selectedPackage.originalPrice.toLocaleString()}</Text>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{service.rating} ({service.reviewCount})</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.priceRow, { marginBottom: 16 }]}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{service.rating} ({service.reviewCount})</Text>
            </View>
          </View>
        )}

        {service.providerCount > 0 && (
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="people-outline" size={14} color={COLORS.primary} />
              <Text style={styles.metaPillText}>{service.providerCount} providers on OrderMe</Text>
            </View>
          </View>
        )}

        {contactPhones.length > 0 && (
          <View style={styles.contactRow}>
            {contactPhones.map((num, i) => (
              <TouchableOpacity
                key={`${num}-${i}`}
                style={styles.contactChip}
                onPress={() => callPhone(num)}
              >
                <Ionicons name={i === 0 ? 'call-outline' : 'phone-portrait-outline'} size={14} color={COLORS.primary} />
                <Text style={styles.contactChipText}>{formatDisplayPhone(num)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Package Selection */}
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.packagesScroll}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
        >
          {service.packages.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.pkgCard, selectedPackage.id === pkg.id && styles.pkgCardActive]}
              onPress={() => setSelectedPackage(pkg)}
              activeOpacity={0.85}
            >
              {selectedPackage.id === pkg.id ? (
                <LinearGradient colors={[COLORS.text, '#374151']} style={styles.pkgGrad}>
                  <Text style={[styles.pkgName, { color: '#fff' }]}>{pkg.name}</Text>
                  <Text style={[styles.pkgPrice, { color: '#fff' }]}>Rs. {pkg.price.toLocaleString()}</Text>
                  <Text style={styles.pkgOriginal}>Rs. {pkg.originalPrice.toLocaleString()}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.pkgInner}>
                  <Text style={styles.pkgName}>{pkg.name}</Text>
                  <Text style={[styles.pkgPrice, { color: COLORS.primary }]}>Rs. {pkg.price.toLocaleString()}</Text>
                  <Text style={[styles.pkgOriginal, { color: COLORS.textSecondary }]}>Rs. {pkg.originalPrice.toLocaleString()}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {service.busNames?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bus operators</Text>
            <Text style={styles.descText}>{service.busNames.join(' · ')}</Text>
          </View>
        )}

        {service.hotelNames?.length > 0 && service.slug === 'hotel' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotels</Text>
            <Text style={styles.descText} numberOfLines={expanded ? undefined : 4}>
              {service.hotelNames.slice(0, 8).join(' · ')}
              {service.hotelNames.length > 8 ? ` · +${service.hotelNames.length - 8} more` : ''}
            </Text>
          </View>
        )}

        {service.routes?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Routes</Text>
            {service.routes.map((route, i) => (
              <View key={i} style={styles.routeRow}>
                <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.primary} />
                <Text style={styles.routeText}>{route.label || `${route.from} → ${route.to}`}</Text>
              </View>
            ))}
          </View>
        )}

        {showDestinationPicker ? (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.destPicker}
              onPress={() => setDestinationModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="bus-outline" size={18} color={COLORS.primary} />
              <Text style={activeDestination ? styles.destPickerValue : styles.destPickerPlaceholder}>
                {activeDestinationLabel
                  ? t('destinationToValue').replace('{value}', activeDestinationLabel)
                  : t('destinationTo')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        {activeDestination && showDestinationPicker && !liveProviders?.length ? (
          <View style={styles.section}>
            <Text style={styles.descText}>
              No buses listed for this destination on OrderMe. Try another destination point.
            </Text>
          </View>
        ) : null}

        {liveProviders && liveProviders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {activeDestination
                ? `${liveProviders.length} ${liveProviders.length === 1 ? t('result') : t('results')}`
                : t('providers')}
            </Text>
            {(expanded ? liveProviders : liveProviders.slice(0, 8)).map((p, i) => (
              <LiveProviderCard
                key={providerStableKey(p, i)}
                provider={p}
                placeholderIcon={providerPlaceholderIcon}
                onMessage={() =>
                  openInAppChat(navigation, {
                    provider: {
                      id: p.id,
                      name: p.name || p.business || 'Provider',
                      avatar: p.imageUrl || p.avatar || null,
                      category: p.category || service?.category || '',
                    },
                    prefillMessage: `Hi, I'm interested in ${service?.title || 'your service'}.`,
                  })
                }
              />
            ))}
            {liveProviders.length > 8 && !expanded ? (
              <Text style={styles.providerMore}>+{liveProviders.length - 8} more — tap Show More</Text>
            ) : null}
          </View>
        )}

        <Modal
          visible={destinationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDestinationModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setDestinationModalVisible(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{t('destinationPoint')}</Text>
              <Text style={styles.modalSub}>Filter buses by destination</Text>
              <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
                {destinationOptions.map((point) => {
                  const selected = activeDestination === point.value;
                  return (
                    <TouchableOpacity
                      key={`${point.value}-${point.area}`}
                      style={[styles.modalOption, selected && styles.modalOptionActive]}
                      onPress={() => onSelectDestination(point)}
                    >
                      <Text style={styles.modalOptionText}>{point.value}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {service.locations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available in</Text>
            <Text style={styles.descText} numberOfLines={expanded ? undefined : 3}>
              {service.locations.slice(0, 6).join(' · ')}
              {service.locations.length > 6 ? ` · +${service.locations.length - 6} more` : ''}
            </Text>
          </View>
        )}

        {/* Package Features */}
        <View style={styles.featuresBox}>
          {selectedPackage.features?.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Ionicons name="checkmark" size={12} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Provider Card */}
        {provider && (
          <TouchableOpacity
            style={styles.providerCard}
            onPress={() => navigation.navigate('ProviderProfile', { provider })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: provider.avatar }} style={styles.providerAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Text style={styles.providerTitle}>{provider.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                callProviderNow(provider);
              }}
            >
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e?.stopPropagation?.();
                openInAppChat(navigation, { provider: provider || { id: service.providerId, name: service.title, category: service.category } });
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Description</Text>
          <Text style={styles.descText} numberOfLines={expanded ? undefined : 4}>
            {service.longDescription || service.description}
          </Text>
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.showMore}>{expanded ? 'Show Less' : 'Show More'}</Text>
          </TouchableOpacity>
        </View>

        {/* Gallery */}
        {service.gallery?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <Text style={styles.viewAll}>View all</Text>
            </View>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {service.gallery.map((img, i) => (
                <Image key={i} source={{ uri: img }} style={styles.galleryImg} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{service.duration}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{service.booked?.toLocaleString()}+</Text>
            <Text style={styles.statLabel}>{t('booked')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="star-outline" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{service.rating}/5</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.heroNav} pointerEvents="box-none">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBookmark} style={styles.navBtn}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={bookmarked ? COLORS.secondary : '#fff'} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        {showListPrice ? (
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomPriceLabel}>{t('totalPrice')}</Text>
            <Text style={styles.bottomPriceValue}>Rs. {selectedPackage.price.toLocaleString()}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={handleCallNow}
          activeOpacity={0.9}
          style={[styles.secondaryAction, !supportsBooking && { flex: 1 }]}
        >
          <Ionicons name="call-outline" size={18} color={COLORS.primary} />
          <Text style={styles.secondaryActionText}>{t('call')}</Text>
        </TouchableOpacity>
        {supportsBooking ? (
          <TouchableOpacity onPress={handleBookNow} activeOpacity={0.9} style={{ flex: 1 }}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.bookNowBtn}>
              <Ionicons name="calendar" size={18} color="#fff" />
              <Text style={styles.bookNowText}>{t('bookNowBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heroContainer: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroNav: {
    position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.accent,
  },
  discountText: { fontSize: 11, color: COLORS.textSecondary },
  discountPercent: { fontSize: 22, fontWeight: '900', color: COLORS.accent },
  content: { flex: 1 },
  titleRow: { paddingHorizontal: 20, paddingTop: 20, flexDirection: 'row', alignItems: 'flex-start' },
  serviceTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  serviceSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginTop: 12, marginBottom: 16 },
  price: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  originalPrice: { fontSize: 16, color: COLORS.textLight, textDecorationLine: 'line-through' },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fffbeb', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginLeft: 'auto',
  },
  ratingText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  metaRow: { paddingHorizontal: 20, marginBottom: 8 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  metaPillText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  contactRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12,
  },
  contactChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  contactChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  packagesScroll: { marginBottom: 8 },
  pkgCard: {
    width: 140, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  pkgCardActive: { borderColor: COLORS.text },
  pkgGrad: { padding: 14 },
  pkgInner: { padding: 14 },
  pkgName: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  pkgPrice: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  pkgOriginal: { fontSize: 11, textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.6)' },
  featuresBox: {
    marginHorizontal: 20, marginTop: 12, marginBottom: 8,
    backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 13, color: COLORS.text },
  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginVertical: 16, backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16, padding: 14, ...SHADOWS.sm,
  },
  providerAvatar: { width: 50, height: 50, borderRadius: 25 },
  providerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  providerTitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actionBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  routeText: { fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 },
  destPicker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  destPickerPlaceholder: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  destPickerValue: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  providerMore: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  modalSub: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8,
  },
  modalOptionActive: { backgroundColor: COLORS.primaryLight },
  modalOptionText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  descText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  showMore: { color: COLORS.primary, fontWeight: '600', fontSize: 13, marginTop: 6 },
  galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  galleryImg: { width: 110, height: 80, borderRadius: 12 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 20, backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: 16,
    marginBottom: 8,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  bottomPrice: { alignItems: 'flex-start' },
  bottomPriceLabel: { fontSize: 11, color: COLORS.textSecondary },
  bottomPriceValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  bottomPhone: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2, maxWidth: 140 },
  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 14,
  },
  secondaryActionText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  bookNowBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 50, paddingVertical: 16,
  },
  bookNowText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
