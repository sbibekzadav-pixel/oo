import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import ThemedScrollView from '../../components/ThemedScrollView';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { uploadUserAvatar } from '../../services/avatarUpload';
import { withAvatarCache } from '../../utils/avatarUri';

const AVATAR_UPLOAD_MS = 5000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const baselineRef = useRef({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    avatar: user?.avatar || '',
  });

  const [name, setName] = useState(baselineRef.current.name);
  const [phone, setPhone] = useState(baselineRef.current.phone);
  const [address, setAddress] = useState(baselineRef.current.address);
  const [city, setCity] = useState(baselineRef.current.city);
  const [avatarUri, setAvatarUri] = useState(baselineRef.current.avatar);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const pendingAvatarRef = useRef(null);

  const syncFormFromUser = useCallback((profile) => {
    if (!profile?.id || savingRef.current) return;
    const b = {
      name: profile.name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      city: profile.city || '',
      avatar: profile.avatar || '',
    };
    baselineRef.current = b;
    setName(b.name);
    setPhone(b.phone);
    setAddress(b.address);
    setCity(b.city);
    setAvatarUri(b.avatar);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      syncFormFromUser(user);
    }, [user?.id, user?.updatedAt, user?.avatarVersion, syncFormFromUser]),
  );

  const hasChanges = useMemo(() => {
    const b = baselineRef.current;
    const avatarChanged = avatarUri !== b.avatar;
    return (
      name.trim() !== b.name.trim()
      || phone.trim() !== b.phone.trim()
      || address.trim() !== b.address.trim()
      || city.trim() !== b.city.trim()
      || avatarChanged
    );
  }, [name, phone, address, city, avatarUri]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const onChangePhoto = () => {
    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Gallery', onPress: pickImage },
      { text: 'Camera', onPress: takePhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadAvatarInBackground = (localUri) => {
    pendingAvatarRef.current = localUri;
    withTimeout(uploadUserAvatar(user.id, localUri), AVATAR_UPLOAD_MS)
      .then((url) => {
        if (pendingAvatarRef.current !== localUri) return;
        return updateProfile({ avatar: url });
      })
      .catch((err) => {
        console.warn('Avatar upload:', err?.message);
      })
      .finally(() => {
        if (pendingAvatarRef.current === localUri) {
          pendingAvatarRef.current = null;
        }
      });
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
      };

      const isNewLocalPhoto =
        avatarUri && !avatarUri.startsWith('http') && !avatarUri.startsWith('data:');
      const saved = await updateProfile(payload);

      const b = {
        name: saved?.name ?? payload.name,
        phone: saved?.phone ?? payload.phone,
        address: saved?.address ?? payload.address,
        city: saved?.city ?? payload.city,
        avatar: saved?.avatar || baselineRef.current.avatar,
      };
      baselineRef.current = b;
      setName(b.name);
      setPhone(b.phone);
      setAddress(b.address);
      setCity(b.city);

      savingRef.current = false;
      setSaving(false);
      navigation.goBack();

      if (isNewLocalPhoto) {
        setAvatarUri(avatarUri);
        uploadAvatarInBackground(avatarUri);
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save profile');
      savingRef.current = false;
      setSaving(false);
    }
  };

  const displayAvatar =
    avatarUri?.startsWith('http')
      ? withAvatarCache(avatarUri, user?.avatarVersion)
      : avatarUri;

  return (
    <ThemedSafeArea>
      <LinearGradient colors={colors.gradientHeader} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ThemedScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarSection} onPress={onChangePhoto} activeOpacity={0.85}>
          <Image key={displayAvatar} source={{ uri: displayAvatar }} style={styles.avatar} />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </TouchableOpacity>

        <Field styles={styles} label="Full Name" value={name} onChangeText={setName} icon="person-outline" colors={colors} />
        <Field styles={styles} label="Email" value={user?.email || ''} editable={false} icon="mail-outline" colors={colors} />
        <Field styles={styles} label="Phone" value={phone} onChangeText={setPhone} icon="call-outline" keyboardType="phone-pad" colors={colors} />
        <Field styles={styles} label="Address" value={address} onChangeText={setAddress} icon="location-outline" colors={colors} />
        <Field styles={styles} label="City" value={city} onChangeText={setCity} icon="business-outline" colors={colors} />

        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={colors.gradientBlue} style={styles.saveBtn}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noChangesHint}>Change a field to enable save</Text>
        )}
      </ThemedScrollView>
    </ThemedSafeArea>
  );
}

function Field({ styles, label, icon, editable = true, colors, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !editable && styles.inputDisabled]}>
        <Ionicons name={icon} size={20} color={colors.textLight} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          editable={editable}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  body: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: COLORS.card, ...SHADOWS.md },
  cameraBadge: {
    position: 'absolute', bottom: 28, right: '32%',
    backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.card,
  },
  changePhotoText: { marginTop: 10, fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, ...SHADOWS.sm,
  },
  inputDisabled: { backgroundColor: COLORS.surfaceAlt, opacity: 0.85 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: Platform.OS === 'web' ? 12 : 14, fontSize: 15, color: COLORS.text },
  saveBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16, marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noChangesHint: {
    textAlign: 'center', marginTop: 16, fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic',
  },
});
