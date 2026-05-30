import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { buildServiceSectionList } from '../../data/websiteCatalog';
import { getLocalizedSectionLabel, getLocalizedServiceLabel } from '../../utils/serviceLabels';

function ServiceTile({ service, onPress, styles, fallbackIcon, language, listedText }) {
  const iconName = service.icon || fallbackIcon || 'cube-outline';
  const color = service.categoryColor || '#1a56db';
  const title = getLocalizedServiceLabel(service.slug, service.title, language);

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => onPress(service)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={iconName} size={24} color={color} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>{title}</Text>
      {service.providerCount > 0 ? (
        <Text style={styles.tileMeta}>{service.providerCount} {listedText}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function SectionGrid({ items, sectionIcon, onSelectService, styles, language, listedText }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(items.slice(i, i + 3));
  }

  return (
    <View style={styles.sectionGrid}>
      {rows.map((row) => (
        <View key={row.map((s) => s.id).join('-')} style={styles.row}>
          {row.map((svc) => (
            <ServiceTile
              key={svc.id}
              service={svc}
              onPress={onSelectService}
              styles={styles}
              fallbackIcon={sectionIcon}
              language={language}
              listedText={listedText}
            />
          ))}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`pad-${i}`} style={[styles.tile, styles.tilePad]} />
            ))
            : null}
        </View>
      ))}
    </View>
  );
}

export default function CategorizedServicesView({
  services,
  activeSection = 'all',
  onSelectService,
  emptyMessage = 'No services in this category.',
}) {
  const { colors, shadows } = useTheme();
  const { t, language } = useLanguage();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const sections = useMemo(
    () => buildServiceSectionList(services, { activeSection }),
    [services, activeSection],
  );

  if (!sections.length) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="grid-outline" size={48} color={colors.textLight} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: section.bg }]}>
              <Ionicons name={section.icon} size={22} color={section.color} />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>
                {getLocalizedSectionLabel(section.id, section.label, language)}
              </Text>
              <Text style={styles.sectionCount}>
                {section.items.length} {t('servicesCount')}
              </Text>
            </View>
          </View>
          <SectionGrid
            items={section.items}
            sectionIcon={section.icon}
            onSelectService={onSelectService}
            styles={styles}
            language={language}
            listedText={t('listed')}
          />
        </View>
      ))}
    </View>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingBottom: 8 },
  section: { marginBottom: 22 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  sectionTitleWrap: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  sectionCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionGrid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1, alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4,
    borderWidth: 1, borderColor: COLORS.border, minHeight: 100,
    ...SHADOWS.sm,
  },
  tilePad: { opacity: 0, borderWidth: 0, elevation: 0 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  tileLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.text, textAlign: 'center',
  },
  tileMeta: {
    fontSize: 9, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4,
  },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
});
