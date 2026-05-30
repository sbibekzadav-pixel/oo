import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, StatusBar, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useBooking } from '../../context/BookingContext';
import { callProviderNow, openInAppChat } from '../../utils/bookingNavigation';

const { width, height } = Dimensions.get('window');

const STATUS_STEPS = ['Pending', 'Confirmed', 'On the Way', 'Arrived', 'In Progress', 'Completed'];

const STATUS_STEP_INDEX = {
  pending: 0,
  confirmed: 1,
  in_progress: 3,
  completed: 5,
  cancelled: 0,
};

export default function TrackingScreen({ navigation, route }) {
  const initialBooking = route.params?.booking;
  const { bookings, cancelBooking } = useBooking();
  const liveBooking = bookings.find((b) => b.id === initialBooking?.id) || initialBooking;
  const booking = liveBooking;
  const { services, getProvider } = useData();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

  const provider = (() => {
    const svc = services.find((s) => s.id === booking?.serviceId);
    return svc ? getProvider(svc.providerId) : null;
  })();
  const [currentStep, setCurrentStep] = useState(STATUS_STEP_INDEX[booking?.status] ?? 1);
  const [eta, setEta] = useState(18);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.5)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (booking?.status) {
      setCurrentStep(STATUS_STEP_INDEX[booking.status] ?? 1);
    }
  }, [booking?.status]);

  useEffect(() => {
    // Pulse animation for location pin
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Slide up card
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();

    // Simulate provider moving
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(moveAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Simulate ETA countdown
    const interval = setInterval(() => {
      setEta(prev => {
        if (prev <= 1) { clearInterval(interval); setCurrentStep(3); return 0; }
        return prev - 1;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const providerX = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [width * 0.3, width * 0.6] });
  const providerY = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [height * 0.25, height * 0.35] });

  const mapboxStyle = isDark ? 'dark-v10' : 'light-v10';

  if (!booking?.id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background }}>
        <Text style={{ marginBottom: 12, color: colors.text }}>Booking not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={statusBar} />

      {/* Map Background */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyle}/static/85.3240,27.7172,13,0/600x900?access_token=pk.demo` }}
          style={styles.mapBg}
          resizeMode="cover"
        />
        {/* Fallback map visual */}
        <LinearGradient
          colors={isDark ? ['#0b0f19', '#111827', '#1f2937'] : ['#e8f0fe', '#c7d8fd', '#a5c0fc']}
          style={styles.mapFallback}
        >
          <View style={styles.mapGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={styles.mapGridRow}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <View key={j} style={styles.mapBlock} />
                ))}
              </View>
            ))}
          </View>
          {/* Roads */}
          <View style={[styles.road, styles.roadH, { top: '35%' }]} />
          <View style={[styles.road, styles.roadH, { top: '60%' }]} />
          <View style={[styles.road, styles.roadV, { left: '30%' }]} />
          <View style={[styles.road, styles.roadV, { left: '65%' }]} />

          {/* Destination Pin */}
          <View style={styles.destPin}>
            <View style={styles.destPinCircle}>
              <Ionicons name="home" size={18} color="#fff" />
            </View>
            <View style={styles.destPinTip} />
          </View>

          {/* Provider Pin - animated */}
          <Animated.View style={[styles.providerPin, { left: providerX, top: providerY }]}>
            <Animated.View style={[styles.providerPulse, { transform: [{ scale: pulseAnim }] }]} />
            <Image
              source={{ uri: provider?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.providerPinAvatar}
            />
          </Animated.View>

          {/* Route Line */}
          <View style={styles.routeLine} />
        </LinearGradient>
      </View>

      {/* Header */}
      <View style={styles.mapHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.mapBackBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.etaChip}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.etaText}>
            {eta > 0 ? `ETA: ${eta} min` : 'Provider Arrived!'}
          </Text>
        </View>
        <TouchableOpacity style={styles.mapShareBtn}>
          <Ionicons name="share-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Status Steps */}
        <View style={styles.stepsRow}>
          {STATUS_STEPS.slice(0, 4).map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                i <= currentStep && { backgroundColor: colors.primary },
                i === currentStep && styles.stepDotActive,
              ]}>
                {i < currentStep && <Ionicons name="checkmark" size={10} color="#fff" />}
                {i === currentStep && <Ionicons name="ellipse" size={8} color="#fff" />}
              </View>
              {i < STATUS_STEPS.slice(0, 4).length - 1 && (
                <View style={[styles.stepLine, i < currentStep && { backgroundColor: colors.primary }]} />
              )}
              <Text style={[styles.stepLabel, i <= currentStep && { color: colors.primary }]} numberOfLines={1}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <Image
            source={{ uri: provider?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.providerAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{booking.providerName}</Text>
            <Text style={styles.providerService}>{booking.serviceName}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#f59e0b" />
              <Text style={styles.ratingText}>{provider?.rating || '4.9'} ({provider?.reviewCount || '130'} reviews)</Text>
            </View>
          </View>
          <View style={styles.providerActions}>
            <TouchableOpacity style={styles.callBtn} onPress={() => provider && callProviderNow(provider)}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => openInAppChat(navigation, { provider: provider })}
            >
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.bookingInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{booking.date} • {booking.time}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>{booking.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{booking.package} • Rs. {booking.price?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={async () => {
            if (booking?.id) await cancelBooking(booking.id);
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapContainer: { flex: 1, position: 'relative' },
  mapBg: { ...StyleSheet.absoluteFillObject },
  mapFallback: { flex: 1, position: 'relative', overflow: 'hidden' },
  mapGrid: { position: 'absolute', inset: 0, padding: 20, gap: 30 },
  mapGridRow: { flexDirection: 'row', gap: 30 },
  mapBlock: { flex: 1, height: 40, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)', borderRadius: 6 },
  road: { position: 'absolute', backgroundColor: isDark ? '#1e293b' : '#fff' },
  roadH: { left: 0, right: 0, height: 12 },
  roadV: { top: 0, bottom: 0, width: 12 },
  destPin: { position: 'absolute', bottom: '30%', right: '35%', alignItems: 'center' },
  destPinCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  destPinTip: {
    width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 12,
    borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
  providerPin: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  providerPulse: {
    position: 'absolute', width: 56, height: 56, borderRadius: 28,
    backgroundColor: isDark ? 'rgba(56,189,248,0.25)' : 'rgba(26,86,219,0.25)',
  },
  providerPinAvatar: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: isDark ? COLORS.background : '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  routeLine: {
    position: 'absolute', top: '35%', left: '30%', width: '35%', height: 3,
    backgroundColor: COLORS.primary, borderStyle: 'dashed',
    transform: [{ rotate: '25deg' }],
  },
  mapHeader: {
    position: 'absolute', top: Platform.OS === 'ios' ? 55 : 40, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
  },
  mapBackBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
  },
  etaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.card,
    borderRadius: 50, paddingVertical: 10, paddingHorizontal: 16, ...SHADOWS.md,
  },
  etaText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  mapShareBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6, zIndex: 1,
  },
  stepDotActive: { backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14 },
  stepLine: {
    position: 'absolute', top: 12, left: '55%', right: '-55%', height: 3,
    backgroundColor: COLORS.border, zIndex: 0,
  },
  stepLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', textAlign: 'center' },
  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: 14, marginBottom: 14,
  },
  providerAvatar: { width: 54, height: 54, borderRadius: 27 },
  providerName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  providerService: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: COLORS.textSecondary },
  providerActions: { gap: 8, alignItems: 'center' },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  chatBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  bookingInfo: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 14, paddingVertical: 12, alignItems: 'center',
  },
  cancelText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
});
