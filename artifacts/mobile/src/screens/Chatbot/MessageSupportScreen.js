import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { messageProvider } from '../../utils/bookingNavigation';
import { ORDERME_SUPPORT } from '../../data/websiteCatalog';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import TopLogoBar from '../../components/TopLogoBar';
import { Ionicons } from '@expo/vector-icons';

export default function MessageSupportScreen({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;

    const openMessage = async () => {
      try {
        const success = messageProvider(
          ORDERME_SUPPORT.phone,
          'नमस्ते OrderMe, मलाई घर सेवा बारे जानकारी चाहिन्छ। कृपया सम्पर्क गर्नुहोस्।'
        );

        if (mounted) {
          setTimeout(() => {
            if (mounted) navigation.navigate('Home');
          }, success ? 800 : 2000);
        }
      } catch (error) {
        console.error('Message open error:', error);
        if (mounted) {
          Alert.alert('Error', 'Could not open messaging app. Please try again.');
          navigation.navigate('Home');
        }
      }
    };

    openMessage();

    return () => {
      mounted = false;
    };
  }, [navigation]);

  return (
    <ThemedSafeArea>
      <TopLogoBar />
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 30 }} />
        <Ionicons name="chatbubble-ellipses-outline" size={70} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          Messaging App खुल्दैछ...
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          OrderMe Support (+977 9842843848) लाई सन्देश पठाउँदै...
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: 30, fontSize: 15 }]}>
          तपाईंको सन्देश पूर्व-भरिएको छ। कृपया पठाउनुहोस्।
        </Text>
      </View>
    </ThemedSafeArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 30,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});
