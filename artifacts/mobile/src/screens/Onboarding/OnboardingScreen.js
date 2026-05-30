import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Image, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { setOnboardingDone } from '../../utils/onboardingStorage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'All Home Services\nAt Your Doorstep',
    subtitle: 'Message providers directly, browse cleaning, plumbing, electrical & 50+ services — book instantly in Nepal.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600',
    gradient: ['#1a56db', '#3b82f6'],
    icon: 'home',
  },
  {
    id: '2',
    title: 'Verified &\nTrusted Experts',
    subtitle: 'Every professional is background-checked, trained, and rated by thousands of satisfied customers.',
    image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600',
    gradient: ['#059669', '#10b981'],
    icon: 'shield-checkmark',
  },
  {
    id: '3',
    title: 'Track Your\nService Live',
    subtitle: 'Know exactly where your service provider is with real-time GPS tracking and instant updates.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    gradient: ['#7c3aed', '#8b5cf6'],
    icon: 'location',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors, statusBar, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const finishingRef = useRef(false);

  const goToLogin = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      await setOnboardingDone();
      navigation.replace('Login');
    } catch {
      finishingRef.current = false;
    }
  }, [navigation]);

  const handleNext = () => {
    if (finishingRef.current) return;

    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
      return;
    }

    goToLogin();
  };

  const handleSkip = () => goToLogin();

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <LinearGradient colors={item.gradient} style={styles.topSection}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
          <View style={styles.iconCircle}>
            <Ionicons name={item.icon} size={32} color="#fff" />
          </View>
        </View>
      </LinearGradient>
      <View style={styles.bottomSection}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dots}>
      {SLIDES.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={i}
            style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={finishingRef.current}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!finishingRef.current}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      <View style={styles.footer}>
        {renderDots()}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={finishingRef.current}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.nextBtn}>
            <Text style={styles.nextText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  skipBtn: { position: 'absolute', top: 50, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  slide: { width, flex: 1 },
  topSection: { height: height * 0.5, justifyContent: 'center', alignItems: 'center' },
  imageWrapper: { width: width * 0.75, height: width * 0.75, borderRadius: 30, overflow: 'hidden', position: 'relative' },
  slideImage: { width: '100%', height: '100%' },
  iconCircle: {
    position: 'absolute', bottom: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 25, width: 50, height: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  bottomSection: { flex: 1, paddingHorizontal: 32, paddingTop: 40, backgroundColor: COLORS.card },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text, lineHeight: 36, marginBottom: 16 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 32, paddingBottom: 40, backgroundColor: COLORS.card,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 50,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
