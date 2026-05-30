import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { ABOUT_CONTENT, ORDERME_SUPPORT } from '../../data/websiteCatalog';

export default function AboutScreen({ navigation }) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const openTel = () => Linking.openURL(`tel:${ORDERME_SUPPORT.phone.replace(/\s/g, '')}`);
  const openMail = () => Linking.openURL(`mailto:${ORDERME_SUPPORT.email}`);
  const openWeb = () => Linking.openURL(ORDERME_SUPPORT.website);

  return (
    <ThemedSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={colors.gradientHeader} style={styles.hero}>
          <Ionicons name="shield-checkmark" size={48} color="#fff" />
          <Text style={styles.heroTitle}>{ABOUT_CONTENT.title}</Text>
        </LinearGradient>

        <Text style={styles.intro}>{ABOUT_CONTENT.intro}</Text>

        <Text style={styles.sectionHeading}>Why Choose Us?</Text>
        {ABOUT_CONTENT.whyChooseUs.map((item) => (
          <View key={item.title} style={[styles.bulletCard, shadows.card]}>
            <View style={[styles.bulletIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            </View>
            <View style={styles.bulletText}>
              <Text style={styles.bulletTitle}>{item.title}</Text>
              <Text style={styles.bulletBody}>{item.text}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.bottomLine, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.bottomLineText, { color: colors.primary }]}>
            {ABOUT_CONTENT.bottomLine}
          </Text>
        </View>

        <Text style={styles.sectionHeading}>Reach Us</Text>
        <View style={[styles.contactCard, shadows.card]}>
          <TouchableOpacity style={styles.contactRow} onPress={openTel}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>{ORDERME_SUPPORT.phone}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={openMail}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>{ORDERME_SUPPORT.email}</Text>
          </TouchableOpacity>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { flex: 1 }]}>{ORDERME_SUPPORT.address}</Text>
          </View>
          <TouchableOpacity style={styles.contactRow} onPress={openWeb}>
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.primary }]}>orderme.com.np</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('VendorRegistration')}
        >
          <LinearGradient colors={colors.gradientBlue} style={styles.registerGrad}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.registerText}>Register as Vendor</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>{ABOUT_CONTENT.footerBlurb}</Text>
        <Text style={styles.copyright}>© 2024–2026 Orderme. All Rights Reserved.</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  hero: {
    borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20,
  },
  heroTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 12,
  },
  intro: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 20 },
  sectionHeading: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginTop: 8 },
  bulletCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  bulletIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bulletText: { flex: 1, marginLeft: 12 },
  bulletTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  bulletBody: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bottomLine: { borderRadius: 14, padding: 16, marginVertical: 16 },
  bottomLineText: { fontSize: 14, fontWeight: '600', lineHeight: 22, textAlign: 'center' },
  contactCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, gap: 14,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  registerBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  registerGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  registerText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footer: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  copyright: { fontSize: 11, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
});
