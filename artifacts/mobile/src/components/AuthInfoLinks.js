import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/** About Us & Vendor Registration links for login / sign-up screens. */
export default function AuthInfoLinks({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.link, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('About')}
        activeOpacity={0.85}
      >
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.text }]}>About Us</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.link, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('VendorRegistration')}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.text }]}>Vendor Registration</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 20 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600' },
});
