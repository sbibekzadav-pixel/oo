import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedSafeArea from '../../components/ThemedSafeArea';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

function emptyForm() {
  return { label: '', address: '', city: '' };
}

export default function SavedAddressesScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const addresses = user?.savedAddresses || [];

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const saveAddress = async () => {
    if (!form.label.trim() || !form.address.trim()) {
      Alert.alert('Required', 'Label and address are required.');
      return;
    }
    setSaving(true);
    try {
      const entry = {
        id: editingId || `addr_${Date.now()}`,
        label: form.label.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
      };
      let next;
      if (editingId) {
        next = addresses.map((a) => (a.id === editingId ? entry : a));
      } else {
        next = [...addresses, entry];
      }
      await updateProfile({ savedAddresses: next });
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = (id) => {
    Alert.alert('Remove address', 'Delete this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateProfile({
              savedAddresses: addresses.filter((a) => a.id !== id),
            });
            if (editingId === id) resetForm();
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not remove address');
          }
        },
      },
    ]);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({ label: item.label, address: item.address, city: item.city || '' });
  };

  return (
    <ThemedSafeArea>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {addresses.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{item.address}</Text>
              {item.city ? (
                <Text style={[styles.cardCity, { color: colors.textLight }]}>{item.city}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => startEdit(item)}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeAddress(item.id)} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.formTitle, { color: colors.text }]}>
          {editingId ? 'Edit address' : 'Add address'}
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Label (Home, Office…)"
          placeholderTextColor={colors.textLight}
          value={form.label}
          onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="Street address"
          placeholderTextColor={colors.textLight}
          value={form.address}
          onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
        />
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
          placeholder="City"
          placeholderTextColor={colors.textLight}
          value={form.city}
          onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
        />
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={saveAddress}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Save address'}</Text>
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity onPress={resetForm} style={styles.cancelLink}>
            <Text style={{ color: colors.textSecondary }}>Cancel edit</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </ThemedSafeArea>
  );
}

const createStyles = (colors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { padding: 20, paddingBottom: 40, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1,
  },
  cardLabel: { fontSize: 15, fontWeight: '700' },
  cardAddress: { fontSize: 13, marginTop: 4 },
  cardCity: { fontSize: 12, marginTop: 2 },
  formTitle: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14 },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
});
