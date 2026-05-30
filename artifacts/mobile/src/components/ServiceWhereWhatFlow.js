import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearchFilter } from '../context/SearchFilterContext';
import { useData } from '../context/DataContext';
import { getWebsiteLocations, formatLocationLabel } from '../data/websiteLocations';
import { WEBSITE_SERVICE_TILES } from '../data/websiteCatalog';
import {
  filterWebsiteLocations,
  filterWebsiteServiceTiles,
} from '../utils/websiteSearch';
import {
  getDestinationPointsForService,
  serviceNeedsDestinationPicker,
} from '../utils/serviceFilters';
import { getLocalizedServiceLabel } from '../utils/serviceLabels';
import { useWebSpeechToText } from '../hooks/useWebSpeechToText';

const WEBSITE_SEARCH_YELLOW = '#FFCD00';

/**
 * Dual-field search bar like orderme.com.np/service — What | Where | yellow search.
 */
export default function ServiceWhereWhatFlow({ onSearch, compact = false }) {
  const { colors, shadows } = useTheme();
  const { t, language } = useLanguage();
  const { services } = useData();
  const {
    whatSlug, whatLabel, where, destinationPoint, destinationLabel,
    needsDestination, setWhat, setWhereFromLoc, setDestination, isReady,
  } = useSearchFilter();
  const [whatModalVisible, setWhatModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [destinationModalVisible, setDestinationModalVisible] = useState(false);
  const [whatQuery, setWhatQuery] = useState('');
  const [whereQuery, setWhereQuery] = useState('');

  const speechLang = language === 'ne' ? 'ne-NP' : 'en-US';
  const whatSpeech = useWebSpeechToText(speechLang);
  const whereSpeech = useWebSpeechToText(speechLang);

  const locations = useMemo(() => getWebsiteLocations(), []);

  const selectedService = useMemo(
    () => (services || []).find((s) => s.slug === whatSlug) || null,
    [services, whatSlug],
  );

  const destinationOptions = useMemo(() => {
    if (!whatSlug || !serviceNeedsDestinationPicker(whatSlug)) return [];
    return getDestinationPointsForService(selectedService || { slug: whatSlug });
  }, [whatSlug, selectedService]);

  const filteredServices = useMemo(
    () => filterWebsiteServiceTiles(whatQuery, { filterLocation: where, services, language }),
    [whatQuery, where, services, language],
  );

  const filteredLocations = useMemo(
    () => filterWebsiteLocations(whereQuery, locations),
    [whereQuery, locations],
  );

  const localizedWhatLabel = useMemo(() => {
    if (!whatSlug) return whatLabel;
    const tile = WEBSITE_SERVICE_TILES.find((item) => item.slug === whatSlug);
    return getLocalizedServiceLabel(whatSlug, tile?.label || whatLabel, language);
  }, [whatSlug, whatLabel, language]);

  const onSelectWhat = useCallback((slug, label) => {
    if (whatSlug === slug) {
      setWhat(null, null);
      setWhatModalVisible(false);
      setWhatQuery('');
      return;
    }
    const localized = getLocalizedServiceLabel(slug, label, language);
    setWhat(slug, localized);
    setWhatModalVisible(false);
    setWhatQuery('');
  }, [setWhat, whatSlug, language]);

  const onSelectWhere = useCallback((loc) => {
    setWhereFromLoc(loc);
    setLocationModalVisible(false);
    setWhereQuery('');
  }, [setWhereFromLoc]);

  const onSelectDestination = useCallback((point) => {
    setDestination(point.value, point.label);
    setDestinationModalVisible(false);
  }, [setDestination]);

  const handleSearch = useCallback(() => {
    if (!isReady || !onSearch) return;
    onSearch();
  }, [isReady, onSearch]);

  const toggleWhatVoice = useCallback(() => {
    if (whatSpeech.isListening) {
      whatSpeech.stop();
      return;
    }
    whatSpeech.start((text) => setWhatQuery(text));
  }, [whatSpeech]);

  const toggleWhereVoice = useCallback(() => {
    if (whereSpeech.isListening) {
      whereSpeech.stop();
      return;
    }
    whereSpeech.start((text) => setWhereQuery(text));
  }, [whereSpeech]);

  const whatDisplay = localizedWhatLabel || t('whatDoYouWant');
  const whereDisplay = where || t('whereDoYouWant');

  const routesForLabel = t('routesFor').replace('{service}', localizedWhatLabel || t('transport'));

  const fieldBg = colors.inputBg || colors.card;

  return (
    <View style={compact ? styles.compactWrap : styles.wrap}>
      {/* Selected service chip with X */}
      {whatSlug ? (
        <View style={[styles.chipRow]}>
          <View style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.chipText, { color: colors.primary }]} numberOfLines={1}>
              {localizedWhatLabel}
            </Text>
            <TouchableOpacity
              onPress={() => { setWhat(null, null); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.chipX}
            >
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {where ? (
            <View style={[styles.chip, { backgroundColor: colors.surfaceAlt || colors.card, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.chipText, { color: colors.textSecondary }]} numberOfLines={1}>
                {where}
              </Text>
              <TouchableOpacity
                onPress={() => { setWhereFromLoc(null); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.chipX}
              >
                <Ionicons name="close-circle" size={16} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <TouchableOpacity
          style={[styles.field, { backgroundColor: fieldBg, borderColor: colors.border }]}
          onPress={() => setWhatModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text
            style={whatLabel ? [styles.fieldValue, { color: colors.text }] : [styles.fieldPlaceholder, { color: colors.textLight }]}
            numberOfLines={1}
          >
            {whatDisplay}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.field, { backgroundColor: fieldBg, borderColor: colors.border }]}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text
            style={where ? [styles.fieldValue, { color: colors.text }] : [styles.fieldPlaceholder, { color: colors.textLight }]}
            numberOfLines={1}
          >
            {whereDisplay}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.searchBtn, !isReady && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!isReady}
          activeOpacity={0.9}
        >
          <Ionicons name="search" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {needsDestination && destinationOptions.length > 0 ? (
        <TouchableOpacity
          style={[styles.destRow, { backgroundColor: colors.card, borderColor: colors.border }, shadows.sm]}
          onPress={() => setDestinationModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="bus-outline" size={18} color={colors.primary} />
          <Text
            style={destinationLabel
              ? [styles.destValue, { color: colors.text }]
              : [styles.destPlaceholder, { color: colors.textLight }]}
            numberOfLines={1}
          >
            {destinationLabel
              ? t('destinationToValue').replace('{value}', destinationLabel)
              : t('destinationTo')}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textLight} />
        </TouchableOpacity>
      ) : null}

      <PickerModal
        visible={whatModalVisible}
        onClose={() => { setWhatModalVisible(false); setWhatQuery(''); whatSpeech.stop(); }}
        title={t('whatDoYouWant')}
        subtitle={t('whatPickerSub')}
        query={whatQuery}
        onQueryChange={setWhatQuery}
        colors={colors}
        t={t}
        voice={{
          isListening: whatSpeech.isListening,
          isSupported: whatSpeech.isSupported,
          error: whatSpeech.error,
          onToggle: toggleWhatVoice,
        }}
      >
        {filteredServices.map((tile) => {
          const svc = (services || []).find((s) => s.slug === tile.slug);
          const selected = whatSlug === tile.slug;
          const label = getLocalizedServiceLabel(tile.slug, tile.label, language);
          return (
            <TouchableOpacity
              key={tile.slug}
              style={[styles.optionItem, selected && { backgroundColor: colors.primaryLight }]}
              onPress={() => onSelectWhat(tile.slug, tile.label)}
              disabled={!svc}
            >
              <Text style={[styles.optionTitle, { color: colors.text }, !svc && { opacity: 0.45 }]}>
                {label}
              </Text>
              {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
        {!filteredServices.length ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('noMatchingServices')}</Text>
        ) : null}
      </PickerModal>

      <PickerModal
        visible={locationModalVisible}
        onClose={() => { setLocationModalVisible(false); setWhereQuery(''); whereSpeech.stop(); }}
        title={t('whereDoYouWant')}
        subtitle={t('wherePickerSub')}
        query={whereQuery}
        onQueryChange={setWhereQuery}
        colors={colors}
        t={t}
        voice={{
          isListening: whereSpeech.isListening,
          isSupported: whereSpeech.isSupported,
          error: whereSpeech.error,
          onToggle: toggleWhereVoice,
        }}
      >
        {filteredLocations.map((loc) => {
          const label = formatLocationLabel(loc);
          const selected = where === label;
          return (
            <TouchableOpacity
              key={loc.id}
              style={[styles.optionItem, selected && { backgroundColor: colors.primaryLight }]}
              onPress={() => onSelectWhere(loc)}
            >
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{loc.place}</Text>
                <Text style={[styles.optionSub, { color: colors.textSecondary }]}>{loc.area}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </PickerModal>

      <PickerModal
        visible={destinationModalVisible}
        onClose={() => setDestinationModalVisible(false)}
        title={t('destinationPoint')}
        subtitle={routesForLabel}
        query=""
        onQueryChange={() => {}}
        colors={colors}
        t={t}
        hideSearch
      >
        {destinationOptions.map((point) => {
          const selected = destinationPoint === point.value;
          return (
            <TouchableOpacity
              key={`${point.value}-${point.area}`}
              style={[styles.optionItem, selected && { backgroundColor: colors.primaryLight }]}
              onPress={() => onSelectDestination(point)}
            >
              <Text style={[styles.optionTitle, { color: colors.text }]}>{point.value}</Text>
              {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </PickerModal>
    </View>
  );
}

function PickerModal({
  visible, onClose, title, subtitle, query, onQueryChange, colors, children, hideSearch, t, voice,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>{subtitle}</Text>
          {!hideSearch ? (
            <>
              <View style={[styles.searchInputWrap, { borderColor: colors.border, backgroundColor: colors.inputBg || colors.surfaceAlt }]}>
                <Ionicons name="search" size={18} color={colors.textLight} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder={t('typeToSearch')}
                  placeholderTextColor={colors.textLight}
                  value={query}
                  onChangeText={onQueryChange}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {voice ? (
                  <TouchableOpacity
                    onPress={voice.onToggle}
                    style={[
                      styles.micBtn,
                      voice.isListening && { backgroundColor: colors.danger + '22' },
                    ]}
                    accessibilityLabel={t('voiceTapMic')}
                  >
                    <Ionicons
                      name={voice.isListening ? 'stop-circle' : 'mic-outline'}
                      size={20}
                      color={voice.isListening ? colors.danger : colors.primary}
                    />
                  </TouchableOpacity>
                ) : null}
                {query ? (
                  <TouchableOpacity onPress={() => onQueryChange('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textLight} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {voice?.isListening ? (
                <Text style={[styles.voiceHint, { color: colors.primary }]}>{t('voiceListening')}</Text>
              ) : null}
              {voice?.error && voice.error !== 'unsupported' ? (
                <Text style={[styles.voiceHint, { color: colors.danger }]}>{t('voiceError')}</Text>
              ) : null}
              {voice && !voice.isSupported && !voice.isListening ? (
                <Text style={[styles.voiceHint, { color: colors.textSecondary }]}>{t('voiceUnsupported')}</Text>
              ) : null}
            </>
          ) : null}
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginBottom: 8 },
  compactWrap: { marginHorizontal: 20, marginBottom: 4 },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  chipX: { marginLeft: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'stretch', gap: 6,
  },
  field: {
    flex: 1, justifyContent: 'center',
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 11, minHeight: 44,
  },
  fieldPlaceholder: { fontSize: 12, fontWeight: '600' },
  fieldValue: { fontSize: 13, fontWeight: '700' },
  searchBtn: {
    width: 48, borderRadius: 8, backgroundColor: WEBSITE_SEARCH_YELLOW,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.45 },
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1,
  },
  destPlaceholder: { flex: 1, fontSize: 13, fontWeight: '600' },
  destValue: { flex: 1, fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { borderRadius: 16, padding: 16, maxHeight: '80%' },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sheetSub: { fontSize: 12, marginBottom: 10 },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  micBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  voiceHint: { fontSize: 11, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8,
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionSub: { fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', padding: 20 },
});
