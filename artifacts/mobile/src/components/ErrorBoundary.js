import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppLogo from './AppLogo';

function ErrorBoundaryFallback({ error, onReset }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <AppLogo size="large" />
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <ScrollView style={styles.scroll}>
        <Text style={[styles.message, { color: colors.danger }]}>{String(error?.message || error)}</Text>
      </ScrollView>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={onReset}
      >
        <Text style={styles.btnText}>Try again</Text>
      </TouchableOpacity>
      {Platform.OS === 'web' && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Check the browser console (F12) for details.</Text>
      )}
    </View>
  );
}

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('OrderMe ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 12 },
  scroll: { maxHeight: 200, width: '100%', marginBottom: 16 },
  message: { fontSize: 13, textAlign: 'center' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { marginTop: 16, fontSize: 12 },
});
