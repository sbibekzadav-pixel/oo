import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { getDeviceBookingDates, getDeviceTimeSlots, formatDeviceDateTime } from '../../utils/deviceSchedule';

export default function BookingScreen({ navigation, route }) {
  const { service, selectedPackage, provider } = route.params || {};
  const { addBooking } = useBooking();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { colors, shadows, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const bookingDates = useMemo(() => getDeviceBookingDates(14), []);
  const timeSlots = useMemo(() => getDeviceTimeSlots(), []);

  const [selectedDate, setSelectedDate] = useState(bookingDates[0]);
  const [selectedTime, setSelectedTime] = useState(timeSlots[2] || timeSlots[0]);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!service?.id || !selectedPackage) {
      Alert.alert('Invalid booking', 'Please select a service first.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [service, selectedPackage, navigation]);

  useEffect(() => {
    const addr = user?.address || user?.savedAddresses?.[0]?.address || '';
    if (addr) setAddress(addr);
  }, [user?.address, user?.savedAddresses]);

  if (!service?.id || !selectedPackage) {
    return null;
  }

  const handleConfirm = async () => {
    if (!address?.trim()) {
      Alert.alert('Address required', 'Please enter a service address.');
      return;
    }
    setConfirming(true);
    try {
      const booking = await addBooking({
        serviceId: service.id,
        serviceName: service.title,
        providerName: provider?.name || 'OrderMe Provider',
        providerAvatar: provider?.avatar,
        package: selectedPackage.name,
        price: selectedPackage.price,
        date: selectedDate.date,
        time: selectedTime,
        address: address.trim(),
        category: service.category,
        categoryColor: service.categoryColor,
        note,
      });

      await addNotification({
        type: 'booking',
        icon: 'checkmark-circle',
        color: '#10b981',
        bg: colors.accentLight,
        title: 'Booking confirmed',
        message: `${service.title} · ${formatDeviceDateTime(selectedDate.date, selectedTime)}`,
      });

      navigation.replace('BookingConfirm', { booking, service, provider });
    } catch (e) {
      Alert.alert('Booking failed', e.message || 'Could not create booking');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBar} backgroundColor={colors.background} />
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{service.title}</Text>
            <Text style={styles.summaryPackage}>
              <Text style={{ color: colors.primary }}>●</Text> {selectedPackage.name} Package
            </Text>
            <Text style={styles.deviceScheduleHint}>
              {formatDeviceDateTime(selectedDate.date, selectedTime)}
            </Text>
          </View>
          <View style={styles.summaryPrice}>
            <Text style={styles.summaryPriceVal}>Rs. {selectedPackage.price.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date (device)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {bookingDates.map((d) => (
              <TouchableOpacity
                key={d.date}
                style={[styles.dateCard, selectedDate.date === d.date && styles.dateCardActive]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateDay, selectedDate.date === d.date && { color: '#fff' }]}>
                  {d.isToday ? 'Today' : d.day}
                </Text>
                <Text style={[styles.dateNum, selectedDate.date === d.date && { color: '#fff' }]}>{d.num}</Text>
                <Text style={[styles.dateMonth, selectedDate.date === d.date && { color: 'rgba(255,255,255,0.7)' }]}>
                  {d.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time (device)</Text>
          <View style={styles.timesGrid}>
            {timeSlots.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                onPress={() => setSelectedTime(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.timeText, selectedTime === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          {user?.savedAddresses?.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addrCard, address === addr.address && styles.addrCardActive]}
              onPress={() => setAddress(addr.address)}
              activeOpacity={0.85}
            >
              <View style={[styles.addrIcon, { backgroundColor: address === addr.address ? colors.primaryLight : colors.surfaceAlt }]}>
                <Ionicons name={addr.label === 'Home' ? 'home-outline' : 'briefcase-outline'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLabel}>{addr.label}</Text>
                <Text style={styles.addrText} numberOfLines={2}>{addr.address}</Text>
              </View>
              {address === addr.address && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          ))}
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color={colors.textLight} />
            <TextInput
              style={styles.addrInput}
              placeholder="Enter your address..."
              placeholderTextColor={colors.textLight}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.noteInput}>
            <TextInput
              style={{ flex: 1, color: colors.text, fontSize: 14, minHeight: 80 }}
              placeholder="Special instructions..."
              placeholderTextColor={colors.textLight}
              value={note}
              onChangeText={setNote}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.priceSummary}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Service Charge</Text>
            <Text style={styles.priceRowVal}>Rs. {selectedPackage.price.toLocaleString()}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>Rs. {selectedPackage.price.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.footerPriceLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>Rs. {selectedPackage.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity onPress={handleConfirm} disabled={confirming} activeOpacity={0.9} style={{ flex: 1 }}>
          <LinearGradient colors={colors.gradientBlue} style={styles.confirmBtn}>
            <Text style={styles.confirmText}>{confirming ? 'Booking…' : 'Confirm Booking'}</Text>
            {!confirming && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card, marginBottom: 4,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  summaryPackage: { fontSize: 13, color: COLORS.textSecondary },
  deviceScheduleHint: { fontSize: 12, color: COLORS.primary, marginTop: 6, fontWeight: '600' },
  summaryPrice: { alignItems: 'flex-end' },
  summaryPriceVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  dateCard: {
    width: 64, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14,
    paddingVertical: 12, ...SHADOWS.sm, borderWidth: 2, borderColor: COLORS.border,
  },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  dateDay: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  dateNum: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginVertical: 4 },
  dateMonth: { fontSize: 11, color: COLORS.textSecondary },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50,
    backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  addrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14, marginBottom: 10, ...SHADOWS.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  addrCardActive: { borderColor: COLORS.primary },
  addrIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addrLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  addrText: { fontSize: 12, color: COLORS.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm, marginTop: 4,
  },
  addrInput: { flex: 1, fontSize: 14, color: COLORS.text, minHeight: 40 },
  noteInput: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  priceSummary: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceRowLabel: { fontSize: 14, color: COLORS.textSecondary },
  priceRowVal: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  totalVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, gap: 16,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
  },
  footerPriceLabel: { fontSize: 11, color: COLORS.textSecondary },
  footerPrice: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  confirmBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 50, paddingVertical: 16,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
