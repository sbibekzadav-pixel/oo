import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AppLogo from '../../components/AppLogo';
import { USE_NATIVE_DRIVER } from '../../utils/animation';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import AuthInfoLinks from '../../components/AuthInfoLinks';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

  const { signInWithGoogle, googleLoading, googleReady } = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;


  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      const msg = e.message || 'Google sign-in failed';
      if (msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('popup')) return;

      // Handle the common Vercel/Firebase domain error
      if (msg.includes('unauthorized-domain') || msg.includes('auth/unauthorized-domain')) {
        setError('Google sign-in is blocked on this preview domain (vercel.app).\n\nUse Email/Password login or add this domain in Firebase Console > Authentication > Authorized domains.');
      } else {
        setError(msg);
      }
      shake();
    }
  };


  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      shake();
      return;
    }
    setError('');
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message || 'Invalid credentials. Please try again.');
      shake();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={statusBar} />
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <AppLogo size="large" />
          </View>
          <Text style={styles.logoSub}>Home Services Nepal</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Welcome Back 👋</Text>
        <Text style={styles.subHeading}>Sign in to explore services & chat with our assistant</Text>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor={colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading || googleLoading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.loginBtn}>
            {isLoading ? (
              <Text style={styles.loginBtnText}>Signing in...</Text>
            ) : (
              <>
                <Text style={styles.loginBtnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.socialBtn, (!googleReady || googleLoading) && styles.socialBtnDisabled]}
          onPress={handleGoogle}
          disabled={!googleReady || googleLoading || isLoading}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-google" size={22} color="#EA4335" />
          <Text style={styles.socialText}>
            {googleLoading ? 'Connecting...' : 'Google बाट लगिन गर्नुहोस्'}
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <AuthInfoLinks navigation={navigation} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 55, left: 20, padding: 8 },
  logoArea: { alignItems: 'center' },
  logoBox: {
    backgroundColor: isDark ? COLORS.surface : '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
    ...SHADOWS.md,
  },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  body: { flex: 1 },
  bodyContent: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  subHeading: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 24 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: isDark ? COLORS.dangerLight : '#fef2f2',
    borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: isDark ? COLORS.danger : '#fecaca',
  },
  errorText: { color: COLORS.danger, fontSize: 13, flex: 1 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 14, backgroundColor: COLORS.inputBg || COLORS.surfaceAlt,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textSecondary, fontSize: 13 },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, paddingVertical: 14,
    backgroundColor: COLORS.card,
  },
  socialBtnDisabled: { opacity: 0.55 },
  socialText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
