import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  WEBSITE_SERVICE_TILES, NEPAL_ADMIN, VENDOR_TYPES, GENDER_OPTIONS,
} from '../../data/websiteCatalog';
import { ref, set, push } from 'firebase/database';
import { rtdb } from '../../config/firebase';
import { PATHS } from '../../services/rtdb';
import { uploadVendorRegistrationImages } from '../../services/vendorRegistrationUpload';
import { notifyAdminInbox } from '../../services/adminInbox';

const MAX_PP_KB = 500;
const MAX_DOC_KB = 1000;

function FieldLabel({ text, required }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
      {text}
      {required ? <Text style={{ color: '#ef4444' }}> *</Text> : null}
    </Text>
  );
}

function SelectRow({ label, value, options, onSelect, colors }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel text={label} required />
      <TouchableOpacity
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: 12,
          padding: 14, backgroundColor: colors.card, flexDirection: 'row',
          justifyContent: 'space-between', alignItems: 'center',
        }}
        onPress={() => setOpen(!open)}
      >
        <Text style={{ color: value ? colors.text : colors.textLight, fontSize: 14 }}>
          {value || 'Select'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textLight} />
      </TouchableOpacity>
      {open && (
        <View style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: 12,
          marginTop: 4, backgroundColor: colors.card, maxHeight: 200,
        }}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {options.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.label;
              const id = typeof opt === 'string' ? opt : opt.id;
              return (
                <TouchableOpacity
                  key={id || val}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  onPress={() => { onSelect(typeof opt === 'string' ? opt : opt.label); setOpen(false); }}
                >
                  <Text style={{ color: colors.text, fontSize: 14 }}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function VendorRegistrationScreen({ navigation }) {
  const { colors, shadows } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [telephone, setTelephone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [areaTole, setAreaTole] = useState('');
  const [destinationPoint, setDestinationPoint] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [dobBs, setDobBs] = useState('');
  const [vendorType, setVendorType] = useState('');
  const [category, setCategory] = useState('');
  const [fieldExperience, setFieldExperience] = useState('');
  const [firmName, setFirmName] = useState('');
  const [expertise, setExpertise] = useState('');
  const [gender, setGender] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [docUri, setDocUri] = useState(null);
  const [certUri, setCertUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');

  const districts = province ? (NEPAL_ADMIN[province] || []) : [];
  const categoryOptions = WEBSITE_SERVICE_TILES.map((t) => t.label);

  const pickImage = useCallback(async (setter, maxKb, label) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `Allow photo access to upload ${label}.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.55,
      allowsEditing: true,
      aspect: label === 'profile photo' ? [1, 1] : [4, 3],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > maxKb * 1024) {
      Alert.alert('File too large', `Max size ${maxKb}KB for ${label}.`);
      return;
    }
    setter(asset.uri);
  }, []);

  const validate = () => {
    if (!fullName.trim()) return 'Full Name is required';
    if (!phone.trim()) return 'Phone is required';
    if (!province) return 'Province is required';
    if (!district) return 'District is required';
    if (!municipality.trim()) return 'Municipality is required';
    if (!areaTole.trim()) return 'Area / Tole is required';
    if (!email.trim()) return 'Email is required';
    if (!dobBs.trim()) return 'DOB (BS) is required';
    if (!vendorType) return 'Vendor Type is required';
    if (!category) return 'Category is required';
    if (!fieldExperience.trim()) return 'Field Experience is required';
    if (!expertise.trim()) return 'Expertise is required';
    if (!gender) return 'Gender is required';
    if (!photoUri) return 'Photo (PP size) is required';
    if (!docUri) return 'Register Document Photo is required';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Missing information', err);
      return;
    }
    setSubmitting(true);
    setSubmitPhase('Preparing photos…');
    try {
      const regRef = push(ref(rtdb, PATHS.vendorRegistrations));
      const registrationId = regRef.key;
      if (!registrationId) throw new Error('Could not create registration record');

      const [photoUrl, registerDocUrl, trainingCertUrl] = await uploadVendorRegistrationImages(
        registrationId,
        [
          { uri: photoUri, kind: 'photo' },
          { uri: docUri, kind: 'register_doc' },
          { uri: certUri, kind: 'training_cert' },
        ],
      );

      setSubmitPhase('Saving registration…');

      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        telephone: telephone.trim() || null,
        province,
        district,
        municipality: municipality.trim(),
        areaTole: areaTole.trim(),
        destinationPoint: destinationPoint.trim() || null,
        email: email.trim(),
        dobBs: dobBs.trim(),
        vendorType,
        category,
        fieldExperience: fieldExperience.trim(),
        firmName: firmName.trim() || null,
        expertise: expertise.trim(),
        gender,
        photoUrl,
        registerDocUrl,
        trainingCertUrl,
        userId: user?.id || null,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        source: 'mobile-app',
      };
      await set(regRef, { ...payload, id: registrationId });

      notifyAdminInbox({
        type: 'vendor_registration',
        title: 'New vendor registration',
        message: `${payload.fullName} · ${category} (${vendorType})`,
        meta: {
          registrationId,
          phone: payload.phone,
          email: payload.email,
          province,
          district,
        },
      });

      Alert.alert(
        'Registration submitted',
        'Thank you! Our team will review your application and contact you soon.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Submission failed', e?.message || 'Please try again later.');
    } finally {
      setSubmitting(false);
      setSubmitPhase('');
    }
  };

  const PhotoSlot = ({ label, hint, uri, onPick, required }) => (
    <View style={{ marginBottom: 14 }}>
      <FieldLabel text={label} required={required} />
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>{hint}</Text>
      <TouchableOpacity style={styles.photoBox} onPress={onPick} activeOpacity={0.85}>
        {uri ? (
          <Image source={{ uri }} style={styles.photoPreview} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={32} color={colors.primary} />
            <Text style={styles.photoHint}>Tap to upload</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Registration</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.formIntro}>
          Register as a service provider on OrderMe Nepal
        </Text>

        <FieldLabel text="Full Name" required />
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full Name" placeholderTextColor={colors.textLight} />

        <FieldLabel text="Phone" required />
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98XXXXXXXX" placeholderTextColor={colors.textLight} />

        <FieldLabel text="Telephone" />
        <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholderTextColor={colors.textLight} />

        <SelectRow label="Province" value={province} options={Object.keys(NEPAL_ADMIN)} onSelect={(v) => { setProvince(v); setDistrict(''); }} colors={colors} />
        <SelectRow label="District" value={district} options={districts} onSelect={setDistrict} colors={colors} />

        <FieldLabel text="Municipality" required />
        <TextInput style={styles.input} value={municipality} onChangeText={setMunicipality} placeholderTextColor={colors.textLight} />

        <FieldLabel text="Area / Tole" required />
        <TextInput style={styles.input} value={areaTole} onChangeText={setAreaTole} placeholderTextColor={colors.textLight} />

        <FieldLabel text="Destination Point" />
        <TextInput style={styles.input} value={destinationPoint} onChangeText={setDestinationPoint} placeholderTextColor={colors.textLight} />

        <FieldLabel text="Your Email" required />
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textLight} />

        <FieldLabel text="DOB (BS)" required />
        <TextInput style={styles.input} value={dobBs} onChangeText={setDobBs} placeholder="e.g. 2055-08-15" placeholderTextColor={colors.textLight} />

        <SelectRow label="Choose Vendor Type" value={vendorType} options={VENDOR_TYPES} onSelect={setVendorType} colors={colors} />
        <SelectRow label="Choose Category" value={category} options={categoryOptions} onSelect={setCategory} colors={colors} />

        <FieldLabel text="Field Experience" required />
        <TextInput style={styles.input} value={fieldExperience} onChangeText={setFieldExperience} placeholder="Years / details" placeholderTextColor={colors.textLight} />

        <FieldLabel text="Firm Name (if any)" />
        <TextInput style={styles.input} value={firmName} onChangeText={setFirmName} placeholderTextColor={colors.textLight} />

        <FieldLabel text="Expertise" required />
        <TextInput style={[styles.input, styles.textArea]} value={expertise} onChangeText={setExpertise} multiline placeholderTextColor={colors.textLight} />

        <FieldLabel text="Gender" required />
        <View style={styles.genderRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderChip, gender === g && styles.genderChipActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PhotoSlot
          label="Photo"
          hint="PP size, max 500KB"
          uri={photoUri}
          required
          onPick={() => pickImage(setPhotoUri, MAX_PP_KB, 'profile photo')}
        />
        <PhotoSlot
          label="Register Document Photo"
          hint="Gov verified, max 1000KB"
          uri={docUri}
          required
          onPick={() => pickImage(setDocUri, MAX_DOC_KB, 'document')}
        />
        <PhotoSlot
          label="Training Certificate (if any)"
          hint="max 1000KB"
          uri={certUri}
          onPick={() => pickImage(setCertUri, MAX_DOC_KB, 'certificate')}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={submitting}>
          <LinearGradient colors={colors.gradientBlue} style={styles.submitGrad}>
            {submitting ? (
              <>
                <ActivityIndicator color="#fff" />
                {submitPhase ? (
                  <Text style={styles.submitPhaseText}>{submitPhase}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />
      </ScrollView>
    </ThemedSafeArea>
  );
}

const createStyles = (COLORS, SHADOWS) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  form: { paddingHorizontal: 20, paddingBottom: 24 },
  formIntro: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.text, backgroundColor: COLORS.card, marginBottom: 14,
  },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  genderChip: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 50,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  genderChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  genderText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  genderTextActive: { color: COLORS.primary },
  photoBox: {
    height: 120, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.card, overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  submitGrad: { paddingVertical: 16, alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  submitPhaseText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
});
