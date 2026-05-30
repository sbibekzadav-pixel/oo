import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import AppLogo from '../../components/AppLogo';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import AuthInfoLinks from '../../components/AuthInfoLinks';

export default function RegisterScreen({ navigation }) {
  const { register, isLoading } = useAuth();
  const { colors, shadows, isDark, statusBar } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows, isDark), [colors, shadows, isDark]);

  const { signInWithGoogle, googleLoading, googleReady } = useGoogleSignIn();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      const msg = e.message || 'Google sign-up failed';
      if (msg.toLowerCase().includes('cancelled')) return;
      setError(msg);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms & Conditions');
      return;
    }
    setError('');
    try {
      await register(name, email, phone, password);
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={statusBar} />
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.logoBox}>
          <AppLogo size="medium" />
        </View>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSub}>Join OrderMe today</Text>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {[
          { label: 'Full Name', val: name, setter: setName, icon: 'person-outline', placeholder: 'Your full name', type: 'default' },
          { label: 'Email Address', val: email, setter: setEmail, icon: 'mail-outline', placeholder: 'you@email.com', type: 'email-address' },
          { label: 'Phone Number', val: phone, setter: setPhone, icon: 'call-outline', placeholder: '+977 98XXXXXXXX', type: 'phone-pad' },
        ].map(field => (
          <View key={field.label} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.inputRow}>
              <Ionicons name={field.icon} size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textLight}
                value={field.val}
                onChangeText={field.setter}
                keyboardType={field.type}
                autoCapitalize={field.type === 'default' ? 'words' : 'none'}
              />
            </View>
          </View>
        ))}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create a strong password"
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

        <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading || googleLoading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.registerBtn}>
            <Text style={styles.registerBtnText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, (!googleReady || googleLoading) && { opacity: 0.55 }]}
          onPress={handleGoogle}
          disabled={!googleReady || googleLoading || isLoading}
        >
          <Ionicons name="logo-google" size={22} color="#EA4335" />
          <Text style={styles.googleBtnText}>
            {googleLoading ? 'Connecting...' : 'Sign up with Google'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <AuthInfoLinks navigation={navigation} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS, SHADOWS, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
  logoBox: {
    backgroundColor: isDark ? COLORS.surface : '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body: { flex: 1 },
  bodyContent: { padding: 24, paddingBottom: 40 },
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
    borderRadius: 14, backgroundColor: COLORS.inputBg || COLORS.surfaceAlt, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.primary },
  termsText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
  registerBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, color: COLORS.textSecondary, fontSize: 13 },
  googleBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, paddingVertical: 14,
    backgroundColor: COLORS.card,
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
