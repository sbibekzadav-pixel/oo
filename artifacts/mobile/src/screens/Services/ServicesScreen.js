import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useData } from '../../context/DataContext';
import TopLogoBar from '../../components/TopLogoBar';
import CategorizedServicesView from './CategorizedServicesView';
import { SERVICE_SECTIONS, resolveSectionForSlug, WEBSITE_SERVICE_COUNT } from '../../data/websiteCatalog';
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

export default function ServicesScreen({ navigation, route }) {
  const { colors, shadows } = useTheme();
  const { t, language } = useLanguage();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { services } = useData();
  const { whatSlug, where, wherePlace, destinationPoint } = useSearchFilter();
  const runSearch = useCallback(() => {
    runWebsiteSearch(navigation, {
      services, whatSlug, where, wherePlace, destinationPoint,
    });
  }, [navigation, services, whatSlug, where, wherePlace, destinationPoint]);
  const [activeSection, setActiveSection] = useState('all');
  const { onScroll, onCollapsibleLayout, collapsibleStyle } = useCollapseOnScroll();

  const sectionPills = SERVICE_SECTIONS;

  useFocusEffect(
    useCallback(() => {
      const cat = route?.params?.category;
      if (cat) setActiveSection(resolveSectionForSlug(cat));
      else if (whatSlug) setActiveSection(resolveSectionForSlug(whatSlug));
    }, [route?.params?.category, whatSlug]),
  );

  const catalogServices = useMemo(
    () => filterServicesByWhatAndWhere(services, { whatSlug, location: where }),
    [services, whatSlug, where],
  );

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

  const filteredCount = useMemo(() => {
    const pool = whatSlug || where ? catalogServices : services;
    return pool.filter((s) => activeSection === 'all' || s.category === activeSection).length;
  }, [catalogServices, services, activeSection, whatSlug, where]);

  const totalLabel = whatSlug || where
    ? `${filteredCount} ${t('matchingServices')}`
    : `${WEBSITE_SERVICE_COUNT} ${t('servicesOnOrderMe')}`;

  return (
    <ThemedSafeArea edges={['left', 'right', 'bottom']}>
      <TopLogoBar />
      <View style={styles.header}>
        <View style={styles.backBtn} />
        <Text style={styles.headerTitle} numberOfLines={1}>{t('services')}</Text>
        <View style={styles.backBtn} />
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
          {sectionPills.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.catPill,
                  isActive && { backgroundColor: item.color, borderColor: item.color },
                ]}
                onPress={() => setActiveSection(item.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon} size={14} color={isActive ? '#fff' : item.color} />
                <Text style={[styles.catLabel, isActive && { color: '#fff' }]} numberOfLines={1}>
                  {getLocalizedSectionLabel(item.id, item.label, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.resultMeta}>{totalLabel}</Text>

        <CategorizedServicesView
          services={whatSlug || where ? catalogServices : services}
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
  backBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, flex: 1, textAlign: 'center' },
  listScroll: { flex: 1 },
  scroll: { paddingBottom: 16 },
  categoriesWrap: { height: 44, marginBottom: 4, marginTop: 4 },
  categoriesList: { paddingHorizontal: 20, alignItems: 'center' },
  catPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 50,
    paddingVertical: 8, paddingHorizontal: 12, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border, maxWidth: 200,
  },
  catLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text, marginLeft: 6, flexShrink: 1 },
  resultMeta: {
    fontSize: 13, color: COLORS.textSecondary,
    paddingHorizontal: 20, paddingBottom: 8,
  },
});
