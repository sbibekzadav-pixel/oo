import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import CategorizedServicesView from './CategorizedServicesView';
import { SERVICE_SECTIONS, WEBSITE_SERVICE_COUNT } from '../../data/websiteCatalog';
import { getLocalizedSectionLabel } from '../../utils/serviceLabels';
import { useSearchFilter } from '../../context/SearchFilterContext';
import {
  filterServicesByWhatAndWhere,
  applyDestinationFilterToService,
  applyLocationFilterToService,
} from '../../utils/serviceFilters';
import { runWebsiteSearch } from '../../utils/websiteSearch';
import ServiceWhereWhatFlow from '../../components/ServiceWhereWhatFlow';
import useCollapseOnScroll from '../../hooks/useCollapseOnScroll';

export default function AllServicesScreen({ navigation }) {
  const { colors: COLORS, shadows: SHADOWS } = useTheme();
  const { t, language } = useLanguage();
  const styles = useMemo(() => createStyles(COLORS, SHADOWS), [COLORS, SHADOWS]);
  const { services } = useData();
  const { whatSlug, where, wherePlace, destinationPoint } = useSearchFilter();
  const runSearch = useCallback(() => {
    runWebsiteSearch(navigation, {
      services, whatSlug, where, wherePlace, destinationPoint,
    });
  }, [navigation, services, whatSlug, where, wherePlace, destinationPoint]);
  const catalogServices = useMemo(
    () => filterServicesByWhatAndWhere(services, { whatSlug, location: where }),
    [services, whatSlug, where],
  );
  const [activeSection, setActiveSection] = useState('all');
  const { onScroll, onCollapsibleLayout, collapsibleStyle } = useCollapseOnScroll();

  const openService = useCallback(
    (item) => {
      if (!item?.id) return;
      let svc = where
        ? applyLocationFilterToService(item, where, wherePlace)
        : item;
      if (destinationPoint) svc = applyDestinationFilterToService(svc, destinationPoint);
      navigation.navigate('ServiceDetail', { service: svc });
    },
    [navigation, destinationPoint, where, wherePlace],
  );

  const displayServices = whatSlug || where ? catalogServices : services;

  const filteredCount = useMemo(() => displayServices.filter(
    (s) => activeSection === 'all' || s.category === activeSection,
  ).length, [displayServices, activeSection]);

  const totalLabel = whatSlug || where
    ? `${filteredCount} ${t('matchingServices')}`
    : `${WEBSITE_SERVICE_COUNT} ${t('servicesOnOrderMe')}`;

  return (
    <ThemedSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('allServices')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <Animated.View style={collapsibleStyle}>
        <View onLayout={onCollapsibleLayout}>
          <ServiceWhereWhatFlow compact onSearch={runSearch} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesWrap}
          contentContainerStyle={styles.categoriesList}
        >
          {SERVICE_SECTIONS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.catPill,
                  isActive && { backgroundColor: item.color, borderColor: item.color },
                ]}
                onPress={() => setActiveSection(item.id)}
              >
                <Ionicons name={item.icon} size={14} color={isActive ? '#fff' : item.color} />
                <Text style={[styles.catLabel, isActive && { color: '#fff' }]} numberOfLines={1}>
                  {getLocalizedSectionLabel(item.id, item.label, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.resultCount}>{totalLabel}</Text>

        <CategorizedServicesView
          services={displayServices}
          activeSection={activeSection}
          onSelectService={openService}
          emptyMessage={
            whatSlug || where
              ? t('noServicesForLocation')
              : t('noServicesInCategory')
          }
        />
        <View style={{ height: 24 }} />
      </Animated.ScrollView>
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  categoriesWrap: { height: 44, marginBottom: 8 },
  categoriesList: { paddingHorizontal: 20 },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 50,
    paddingVertical: 8, paddingHorizontal: 12, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border, maxWidth: 200,
  },
  catLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginLeft: 6 },
  resultCount: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 20, marginBottom: 8 },
  listScroll: { flex: 1 },
  scroll: { paddingBottom: 20 },
});
