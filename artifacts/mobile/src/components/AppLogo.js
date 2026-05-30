import React from 'react';
import { Image, StyleSheet } from 'react-native';

const LOGO = require('../logo.png');

const SIZES = {
  small: { height: 28, width: 112 },
  medium: { height: 36, width: 144 },
  large: { height: 48, width: 192 },
};

export default function AppLogo({ size = 'medium', style }) {
  const dimensions = SIZES[size] || SIZES.medium;
  return (
    <Image
      source={LOGO}
      style={[styles.logo, dimensions, style]}
      resizeMode="contain"
      accessibilityLabel="OrderMe logo"
    />
  );
}

const styles = StyleSheet.create({
  logo: {},
});
