import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { WEBSITE_SERVICE_TILES } from '../../data/websiteCatalog';
import { getServiceTileIconUrl } from '../../data/serviceTileIcons';
import { getServiceLocations, locationMatches } from '../../utils/serviceFilters';
import { getLocalizedServiceLabel } from '../../utils/serviceLabels';

export default function WebsiteServicesGrid({
  services, onSelectService, filterLocation = null,
}) {
  const { colors, shadows } = useTheme();
  const { t, language } = useLanguage();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const serviceBySlug = useMemo(() => {
    const map = {};
    (services || []).forEach((s) => {
      if (s.slug) map[s.slug] = s;
    });
    return map;
  }, [services]);

  const tiles = WEBSITE_SERVICE_TILES.filter((t) => {
    if (!filterLocation) return true;
    const svc = serviceBySlug[t.slug];
    if (!svc) return false;
    return locationMatches(getServiceLocations(svc), filterLocation);
  });

  const renderTile = ({ item }) => {
    const svc = serviceBySlug[item.slug];
    const iconUrl = getServiceTileIconUrl(item.slug);
    return (
      <TouchableOpacity
        style={styles.tile}
        onPress={() => svc && onSelectService(svc)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
          {iconUrl ? (
            <Image source={{ uri: iconUrl }} style={styles.tileImage} resizeMode="contain" />
          ) : (
            <Ionicons name={item.icon} size={26} color={item.color} />
          )}
        </View>
        <Text style={styles.tileLabel} numberOfLines={2}>
          {getLocalizedServiceLabel(item.slug, item.label, language)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={tiles}
      renderItem={renderTile}
      keyExtractor={(item) => item.slug}
      numColumns={3}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      ListEmptyComponent={
        <Text style={styles.empty}>{t('noServicesInLocation')}</Text>
      }
    />
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  grid: { paddingHorizontal: 12 },
  row: { gap: 8, marginBottom: 8 },
  tile: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 4,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  tileImage: { width: 40, height: 40 },
  tileLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.text, textAlign: 'center',
  },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
});
