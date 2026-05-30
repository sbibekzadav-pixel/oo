import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  FlatList, Dimensions, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { callProviderNow } from '../../utils/bookingNavigation';
import CatalogLoader from '../../components/CatalogLoader';
import TopLogoBar from '../../components/TopLogoBar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const NEPAL_COORDS = { lat: 27.7172, lng: 85.3240 };

export default function MapScreen({ navigation }) {
  const { catalogLoading, providers } = useData();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);

  if (catalogLoading) {
    return (
      <View style={styles.container}>
        <CatalogLoader message="Loading map..." />
      </View>
    );
  }

  const getRelativePos = (provider) => {
    const x = ((provider.lng - 85.0) / 2) * width;
    const y = ((27.9 - provider.lat) / 2) * height * 0.5;
    return { x: Math.max(20, Math.min(x, width - 60)), y: Math.max(20, Math.min(y, height * 0.4)) };
  };

  const mapColors = isDark 
    ? ['#0b0f19', '#111827', '#1f2937'] 
    : ['#dce8ff', '#c5d8ff', '#b0c8ff'];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle={statusBar} />
      <TopLogoBar backgroundColor={isDark ? colors.background : '#dce8ff'} />

      {/* Map Background */}
      <LinearGradient colors={mapColors} style={styles.mapBg}>
        {/* Grid lines to simulate map */}
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.horizontal, { top: `${i * 14}%` }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.vertical, { left: `${i * 20}%` }]} />
        ))}

        {/* Roads */}
        <View style={[styles.road, { top: '35%', left: 0, right: 0, height: 8 }]} />
        <View style={[styles.road, { top: '55%', left: 0, right: 0, height: 6 }]} />
        <View style={[styles.road, { left: '25%', top: 0, bottom: 0, width: 8 }]} />
        <View style={[styles.road, { left: '60%', top: 0, bottom: 0, width: 6 }]} />

        {/* City Labels */}
        <Text style={[styles.cityLabel, { top: '25%', left: '30%' }]}>Kathmandu</Text>
        <Text style={[styles.cityLabel, { top: '60%', left: '55%' }]}>Biratnagar</Text>
        <Text style={[styles.cityLabel, { top: '40%', left: '10%' }]}>Dharan</Text>

        {/* Provider Pins */}
        {providers.map(p => {
          const pos = getRelativePos(p);
          const isSelected = selectedProvider?.id === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.pin, { left: pos.x, top: pos.y, zIndex: isSelected ? 10 : 5 }]}
              onPress={() => setSelectedProvider(isSelected ? null : p)}
              activeOpacity={0.9}
            >
              <View style={[styles.pinBubble, { backgroundColor: isSelected ? colors.primary : colors.card }]}>
                <Text style={[styles.pinText, { color: isSelected ? '#fff' : colors.primary }]}>
                  Rs.{p.price > 0 ? p.price : 'Free'}
                </Text>
              </View>
              <View style={[styles.pinTip, { borderTopColor: isSelected ? colors.primary : colors.card }]} />
            </TouchableOpacity>
          );
        })}

        {/* User Pin */}
        <View style={[styles.userPin, { left: width * 0.45, top: height * 0.22 }]}>
          <View style={styles.userPinPulse} />
          <View style={styles.userPinDot} />
        </View>
      </LinearGradient>

      {/* Header */}
      <SafeAreaView style={styles.mapHeaderSafe}>
        <View style={styles.mapHeader}>
          <View style={styles.searchPill}>
            <Ionicons name="search-outline" size={16} color={colors.textLight} />
            <Text style={styles.searchPillText}>Search location...</Text>
          </View>
          <TouchableOpacity style={styles.layerBtn}>
            <Ionicons name="layers-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setMapZoom(z => Math.min(z + 1, 20))}>
          <Ionicons name="add" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={() => setMapZoom(z => Math.max(z - 1, 5))}>
          <Ionicons name="remove" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Location Reset Button */}
      <TouchableOpacity style={styles.myLocBtn}>
        <Ionicons name="locate-outline" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Nearby Providers List */}
      {!selectedProvider ? (
        <View style={styles.nearbySheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.nearbyTitle}>Providers Near You</Text>
          <FlatList
            data={providers.slice(0, 4)}
            keyExtractor={p => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.nearbyCard}
                onPress={() => setSelectedProvider(item)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.avatar }} style={styles.nearbyAvatar} />
                <View style={styles.nearbyBadge}>
                  <Ionicons name="star" size={10} color="#f59e0b" />
                  <Text style={styles.nearbyBadgeText}>{item.rating}</Text>
                </View>
                <Text style={styles.nearbyName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.nearbyRole} numberOfLines={1}>{item.badge}</Text>
                <Text style={styles.nearbyPrice}>
                  {item.price > 0 ? `Rs.${item.price}` : 'Free'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        // Selected Provider Detail
        <View style={styles.selectedSheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProvider(null)}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.selectedRow}>
            <Image source={{ uri: selectedProvider.avatar }} style={styles.selectedAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedName}>{selectedProvider.name}</Text>
              <Text style={styles.selectedRole}>{selectedProvider.title}</Text>
              <View style={styles.selectedRating}>
                <Ionicons name="star" size={13} color="#f59e0b" />
                <Text style={styles.selectedRatingText}>{selectedProvider.rating} ({selectedProvider.reviewCount} reviews)</Text>
              </View>
              <View style={styles.selectedLocation}>
                <Ionicons name="location-outline" size={13} color={colors.primary} />
                <Text style={styles.selectedLocationText}>{selectedProvider.location}</Text>
              </View>
            </View>
            <View style={styles.selectedPrice}>
              <Text style={styles.selectedPriceVal}>
                {selectedProvider.price > 0 ? `Rs.${selectedProvider.price}` : 'Free'}
              </Text>
              <Text style={styles.selectedPriceUnit}>{selectedProvider.priceUnit}</Text>
            </View>
          </View>
          <View style={styles.selectedActions}>
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => navigation.navigate('ProviderProfile', { provider: selectedProvider })}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => callProviderNow(selectedProvider)}
              activeOpacity={0.9}
              style={{ flex: 1 }}
            >
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.bookNowBtn}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.bookNowText}>Call Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  mapBg: { flex: 1, position: 'relative', overflow: 'hidden' },
  gridLine: { position: 'absolute', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.4)' },
  horizontal: { left: 0, right: 0, height: 1 },
  vertical: { top: 0, bottom: 0, width: 1 },
  road: { position: 'absolute', backgroundColor: isDark ? '#1e293b' : '#fff', opacity: 0.8 },
  cityLabel: {
    position: 'absolute', fontSize: 11, fontWeight: '700',
    color: isDark ? 'rgba(241,245,249,0.6)' : 'rgba(30,41,59,0.7)', backgroundColor: 'transparent',
  },
  pin: { position: 'absolute', alignItems: 'center' },
  pinBubble: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  pinText: { fontSize: 11, fontWeight: '800' },
  pinTip: {
    width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8,
    borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  userPin: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  userPinPulse: {
    position: 'absolute', width: 40, height: 40, borderRadius: 20,
    backgroundColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(26,86,219,0.2)',
  },
  userPinDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary,
    borderWidth: 3, borderColor: isDark ? COLORS.background : '#fff',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
  },
  mapHeaderSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  mapHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0, gap: 10,
  },
  searchPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
  },
  searchPillText: { color: COLORS.textLight, fontSize: 14 },
  layerBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
  },
  zoomControls: {
    position: 'absolute', right: 16, top: '45%', backgroundColor: COLORS.card,
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
  },
  zoomBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  zoomDivider: { height: 1, backgroundColor: COLORS.border },
  myLocBtn: {
    position: 'absolute', right: 16, top: '58%',
    width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 8,
  },
  nearbySheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 24, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  nearbyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  nearbyCard: {
    width: 120, backgroundColor: COLORS.surfaceAlt, borderRadius: 16, padding: 12,
    alignItems: 'center', position: 'relative', ...SHADOWS.sm,
  },
  nearbyAvatar: { width: 54, height: 54, borderRadius: 27, marginBottom: 8 },
  nearbyBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.card,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  nearbyBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.text },
  nearbyName: { fontSize: 13, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  nearbyRole: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  nearbyPrice: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  selectedSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32,
    borderRadius: 16, backgroundColor: COLORS.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedRow: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  selectedAvatar: { width: 64, height: 64, borderRadius: 32 },
  selectedName: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  selectedRole: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  selectedRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  selectedRatingText: { fontSize: 12, color: COLORS.textSecondary },
  selectedLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedLocationText: { fontSize: 11, color: COLORS.primary },
  selectedPrice: { alignItems: 'flex-end' },
  selectedPriceVal: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  selectedPriceUnit: { fontSize: 11, color: COLORS.textSecondary },
  selectedActions: { flexDirection: 'row', gap: 12 },
  viewProfileBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  viewProfileText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  bookNowBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 13,
  },
  bookNowText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
