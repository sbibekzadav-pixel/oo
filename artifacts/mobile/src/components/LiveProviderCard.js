import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SHADOWS } from '../theme/colors';

/**
 * Provider card — shows image, name, location, route.
 * Single Message button opens in-app chat via onMessage prop.
 */
export default function LiveProviderCard({
  provider,
  onPress,
  onMessage,
  placeholderIcon = 'storefront-outline',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, SHADOWS), [colors]);
  const [imageFailed, setImageFailed] = useState(false);

  if (!provider) return null;

  const title = provider.name || provider.business || 'Provider';
  const company = provider.business && provider.name ? provider.business : null;
  const origin = provider.origin || provider.location;
  const destination = provider.destinationCity || provider.address;
  const route = provider.route || provider.badge;
  const imageUri = provider.imageUrl || provider.avatar || null;
  const showImage = Boolean(imageUri) && !imageFailed;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.9 : 1}>
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name={placeholderIcon} size={36} color={colors.textLight} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text }]}>{title.toUpperCase()}</Text>
        {company ? (
          <View style={styles.row}>
            <Ionicons name="storefront-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.rowText, { color: colors.textSecondary }]}>{company}</Text>
          </View>
        ) : null}
        {origin ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.rowText, { color: colors.textSecondary }]}>{origin}</Text>
          </View>
        ) : null}
        {destination ? (
          <View style={styles.row}>
            <Ionicons name="map-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.rowText, { color: colors.textSecondary }]}>{destination}</Text>
          </View>
        ) : null}
        {route ? (
          <View style={[styles.row, styles.routeRow]}>
            <Ionicons name="ribbon-outline" size={14} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.primary, fontWeight: '700' }]}>{route}</Text>
          </View>
        ) : null}
        {onMessage ? (
          <TouchableOpacity
            style={[styles.msgBtn, { backgroundColor: colors.primary }]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#fff" />
            <Text style={styles.msgBtnText}>Message</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Wrapper>
  );
}

const createStyles = (colors, shadows) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  image: {
    width: 100,
    minHeight: 130,
    backgroundColor: colors.surfaceAlt,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowText: {
    flex: 1,
    fontSize: 13,
  },
  routeRow: {
    marginTop: 2,
  },
  msgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  msgBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
