import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function ThemedSafeArea({ children, style, edges, statusBar = true }) {
  const { colors, statusBar: barStyle } = useTheme();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]} edges={edges}>
      {statusBar ? <StatusBar barStyle={barStyle} backgroundColor={colors.background} /> : null}
      {children}
    </SafeAreaView>
  );
}
