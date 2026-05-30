import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Switch, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { useBooking } from '../../context/BookingContext';
import { LANGUAGE_LABELS } from '../../i18n/translations';
import AppLogo from '../../components/AppLogo';
import { withAvatarCache } from '../../utils/avatarUri';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const { services, providers } = useData();
  const { t, language, setLanguage, languageLabel } = useLanguage();
  const { colors, shadows, isDark, setMode } = useTheme();
  const { bookmarkList } = useBookmarks();
  const { bookings } = useBooking();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const activeBookings = bookings?.filter((b) => b.status !== 'cancelled' && b.status !== 'completed') || [];
  const bookmarkCount = bookmarkList?.length || 0;

  const MenuItem = ({ icon, label, subtitle, value, onPress, isToggle, toggleVal, onToggle, danger, badge, rightIcon = 'chevron-forward' }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.divider }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isToggle}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? colors.dangerLight : colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, { color: colors.text }, danger && { color: colors.danger }]} numberOfLines={1}>{label}</Text>
        {subtitle ? <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {isToggle ? (
        <Switch
          value={toggleVal}
          onValueChange={onToggle}
          trackColor={{ false: isDark ? '#1e293b' : '#cbd5e1', true: colors.primary }}
          thumbColor={toggleVal ? '#ffffff' : (isDark ? '#64748b' : '#f4f3f4')}
          ios_backgroundColor={isDark ? '#1e293b' : '#cbd5e1'}
        />
      ) : badge != null && badge > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : value ? (
        <Text style={[styles.menuValue, { color: colors.textSecondary }]} numberOfLines={1}>{value}</Text>
      ) : (
        <Ionicons name={rightIcon} size={18} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );

  const notifEnabled = user?.notificationsEnabled !== false;
  const locationEnabled = user?.locationEnabled !== false;
  const serviceCount = services.length;
  const providerCount = providers.length;

  const selectLanguage = async (lang) => {
    await setLanguage(lang);
    setLanguageModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={colors.gradientHeader} style={styles.header}>
          <View style={styles.headerTop}>
            <AppLogo size="small" style={styles.headerLogo} />
            <Text style={styles.headerTitle}>{t('profile') || 'Profile'}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.userCard}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
              <Image
                key={user?.avatarVersion || user?.avatar}
                source={{ uri: withAvatarCache(user?.avatar, user?.avatarVersion) }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user?.name}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
              {!!user?.phone && <Text style={styles.userPhone} numberOfLines={1}>{user?.phone}</Text>}
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{serviceCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{providerCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Providers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{activeBookings.length}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Bookings</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Main menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account') || 'Account'}</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }, shadows.card]}>
            <MenuItem
              icon="person-outline"
              label={t('editProfile') || 'Edit Profile'}
              subtitle="Photo, name, phone, address"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="calendar-outline"
              label="My Bookings"
              subtitle="Track and manage your orders"
              badge={activeBookings.length}
              onPress={() => navigation.navigate('MyBookings')}
            />
            <MenuItem
              icon="chatbubbles-outline"
              label="Chats"
              subtitle="Messages with service providers"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Chats' })}
            />
            <MenuItem
              icon="bookmark-outline"
              label="My Bookmarks"
              subtitle={`${bookmarkCount} saved items`}
              onPress={() => navigation.navigate('Bookmarks')}
            />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              subtitle="Coming soon"
              onPress={() => {}}
            />
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }, shadows.card]}>
            <MenuItem
              icon="help-circle-outline"
              label="Support"
              subtitle="Get help with your bookings"
              onPress={() => navigation.navigate('Chat', {
                provider: {
                  id: 'support',
                  name: 'OrderMe Support',
                  avatar: null,
                  category: 'Support',
                  phone: '+9779842843848',
                },
                prefillMessage: 'Hello, I need help with my account.',
              })}
            />
            <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => {}} />
            <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
            <MenuItem icon="star-outline" label="Rate the App" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Settings</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }, shadows.card]}>
            <MenuItem
              icon={isDark ? 'moon' : 'sunny-outline'}
              label={isDark ? (t('darkMode') || 'Dark Mode') : (t('lightMode') || 'Light Mode')}
              subtitle={isDark ? 'Dark Neo Premium' : 'Classic light'}
              isToggle
              toggleVal={isDark}
              onToggle={(v) => setMode(v ? 'dark' : 'light')}
            />
            <MenuItem
              icon="notifications-outline"
              label={t('pushNotifications') || 'Push Notifications'}
              isToggle
              toggleVal={notifEnabled}
              onToggle={(v) => updateProfile({ notificationsEnabled: v })}
            />
            <MenuItem
              icon="location-outline"
              label={t('locationServices') || 'Location Services'}
              isToggle
              toggleVal={locationEnabled}
              onToggle={(v) => updateProfile({ locationEnabled: v })}
            />
            <MenuItem
              icon="language-outline"
              label={t('language') || 'Language'}
              value={languageLabel}
              onPress={() => setLanguageModalVisible(true)}
            />
            <MenuItem
              icon="location-outline"
              label="Saved Addresses"
              subtitle={`${user?.savedAddresses?.length || 0} addresses`}
              onPress={() => navigation.navigate('SavedAddresses')}
            />
            <MenuItem
              icon="information-circle-outline"
              label="About Us"
              subtitle="Learn about OrderMe Nepal"
              onPress={() => navigation.navigate('About')}
            />
            <MenuItem
              icon="person-add-outline"
              label="Vendor Registration"
              subtitle="Register as a service provider"
              onPress={() => navigation.navigate('VendorRegistration')}
            />
            <MenuItem icon="code-slash-outline" label="App Version" value="1.0.0" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
          <LinearGradient
            colors={isDark ? [colors.dangerLight, colors.dangerLight] : ['#fef2f2', '#fee2e2']}
            style={styles.logoutGrad}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>{t('signOut') || 'Sign Out'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text }]}>OrderMe • Home Services Nepal</Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>orderme.np@gmail.com • +977 9842843848</Text>
          <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>© 2024-2026 All Rights Reserved</Text>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }, shadows.lg]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('selectLanguage') || 'Select Language'}</Text>
            {(['en', 'ne']).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, { borderColor: colors.border, backgroundColor: colors.card }, language === lang && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                onPress={() => selectLanguage(lang)}
                activeOpacity={0.8}
              >
                <View style={styles.langOptionLeft}>
                  <Ionicons name={lang === 'ne' ? 'flag-outline' : 'globe-outline'} size={22} color={language === lang ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.langOptionText, { color: language === lang ? colors.primary : colors.text }, language === lang && { fontWeight: '800' }]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </View>
                {language === lang && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setLanguageModalVisible(false)}>
              <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>{t('close') || 'Close'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  safeArea: { flex: 1 },
  header: { paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 20 },
  headerLogo: { backgroundColor: isDark ? COLORS.surfaceAlt : '#fff', borderRadius: 10, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', flex: 1, textAlign: 'center' },
  editBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff' },
  userInfo: { flex: 1, minWidth: 0, marginLeft: 14, marginRight: 8 },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10, flexShrink: 0 },
  verifiedText: { fontSize: 11, color: '#10b981', fontWeight: '700', marginLeft: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  statVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'stretch' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuCard: { borderRadius: 18, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuTextWrap: { flex: 1, minWidth: 0, marginLeft: 14, marginRight: 8 },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuSubtitle: { fontSize: 11, marginTop: 2 },
  menuValue: { fontSize: 13, fontWeight: '600', maxWidth: 100 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logoutBtn: { marginHorizontal: 20, marginTop: 24, borderRadius: 16, overflow: 'hidden' },
  logoutGrad: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  logoutText: { fontSize: 16, fontWeight: '800', marginLeft: 10, color: COLORS.danger },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, fontWeight: '700' },
  footerSubtext: { fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  langOptionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  langOptionText: { fontSize: 16, fontWeight: '600', marginLeft: 12 },
  modalCloseBtn: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  modalCloseText: { fontSize: 15, fontWeight: '600' },
});
