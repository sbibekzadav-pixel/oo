import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ThemedScrollView({ style, contentContainerStyle, children, ...rest }) {
  const { colors, isDark } = useTheme();
  return (
    <ScrollView
      style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
      indicatorStyle={isDark ? 'white' : 'black'}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
