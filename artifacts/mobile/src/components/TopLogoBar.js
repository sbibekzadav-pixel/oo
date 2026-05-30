import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import AppLogo from './AppLogo';

export default function TopLogoBar({ size = 'medium', backgroundColor }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.background;
  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 8), backgroundColor: bg, borderBottomColor: colors.border }]}>
      <AppLogo size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
});
