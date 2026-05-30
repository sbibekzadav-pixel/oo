import React from 'react';
import {
  Modal, Pressable, View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import WebsiteServicesGrid from '../screens/Services/WebsiteServicesGrid';
import { WEBSITE_SERVICE_TILES } from '../data/websiteCatalog';
import { getLocalizedServiceLabel } from '../utils/serviceLabels';

export default function ServiceWhatPickerModal({
  visible,
  onClose,
  services,
  selectedSlug,
  onSelect,
  filterLocation = null,
}) {
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const handleSelect = (service) => {
    if (!service?.slug) return;
    const tile = WEBSITE_SERVICE_TILES.find((entry) => entry.slug === service.slug);
    const label = getLocalizedServiceLabel(service.slug, tile?.label || service.title, language);
    onSelect(service.slug, label);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.text }]}>{t('whatDoYouWant')}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {t('chooseService')}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <WebsiteServicesGrid
              services={services}
              onSelectService={handleSelect}
              filterLocation={filterLocation}
            />
          </ScrollView>
          {selectedSlug ? (
            <TouchableOpacity onPress={onClose} style={[styles.doneBtn, { backgroundColor: colors.primaryLight }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('done')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={28} color={colors.textLight} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8, maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1',
    alignSelf: 'center', marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center', marginBottom: 12, marginTop: 4 },
  doneBtn: {
    marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  closeBtn: { alignSelf: 'center', marginTop: 8 },
});
