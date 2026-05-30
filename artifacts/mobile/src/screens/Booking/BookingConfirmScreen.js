import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function BookingConfirmScreen({ navigation, route }) {
  const { booking, service } = route.params;
  const { colors, statusBar, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBar} />
      <LinearGradient colors={colors.gradientHeader} style={styles.bg} />

      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.checkGrad}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], alignItems: 'center' }}>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>Your service has been booked successfully</Text>

          <View style={styles.refCard}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refCode}>{booking.bookingRef}</Text>
          </View>

          <View style={styles.detailCard}>
            <DetailRow icon="construct-outline" label="Service" value={booking.serviceName} />
            <DetailRow icon="person-outline" label="Provider" value={booking.providerName} />
            <DetailRow icon="cube-outline" label="Package" value={booking.package} />
            <DetailRow icon="calendar-outline" label="Date" value={booking.date} />
            <DetailRow icon="time-outline" label="Time" value={booking.time} />
            <DetailRow icon="location-outline" label="Address" value={booking.address} last />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>Rs. {booking.price.toLocaleString()}</Text>
          </View>

          <Text style={styles.note}>
            📞 The provider will contact you 30 minutes before arrival.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => navigation.replace('Tracking', { booking })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.trackGrad}>
              <Ionicons name="location-outline" size={18} color="#fff" />
              <Text style={styles.trackText}>Track Service</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyBookings')}
            activeOpacity={0.85}
            style={{ marginBottom: 10 }}
          >
            <LinearGradient
              colors={isDark ? [colors.surfaceAlt, colors.surface] : ['#fff', '#f8faff']}
              style={styles.homeBtn}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.homeBtnText}>View My Bookings</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDark ? [colors.surfaceAlt, colors.surface] : ['#fff', '#f8faff']}
              style={styles.homeBtn}
            >
              <Ionicons name="home-outline" size={18} color={colors.primary} />
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const DetailRow = ({ icon, label, value, last }) => {
  const { colors } = useTheme();
  return (
    <View style={[
      styles.detailRow,
      !last && { borderBottomWidth: 1, borderBottomColor: colors.divider }
    ]}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
};

const createStyles = (COLORS, isDark) => StyleSheet.create({
  container: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  checkCircle: {
    width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
    marginBottom: 24, shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  checkGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 20 },
  refCard: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingVertical: 12,
    paddingHorizontal: 24, alignItems: 'center', marginBottom: 16,
  },
  refLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  refCode: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  detailCard: {
    backgroundColor: COLORS.card, borderRadius: 16, width: '100%', padding: 4, marginBottom: 12,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  detailLabel: { fontSize: 13, width: 72 },
  detailValue: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  totalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 20, width: '100%', marginBottom: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  totalVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
  note: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  buttons: { width: '100%', gap: 12, marginTop: 20 },
  trackBtn: { borderRadius: 50, overflow: 'hidden' },
  trackGrad: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 50,
  },
  trackText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  homeBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 50,
  },
  homeBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
