import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  disabled?: boolean;
  onChange: (id: string) => void;
}

export function SearchSelect({ label, value, options, disabled, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find(option => option.id === value);
  const filtered = options.filter(option => option.label.toLocaleLowerCase('es-AR').includes(query.trim().toLocaleLowerCase('es-AR')));
  const close = () => { setVisible(false); setQuery(''); };
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
        style={styles.input} onPress={() => setVisible(true)}>
        <Text style={{ color: selected ? colors.text : colors.subtext }}>{selected?.label ?? 'Seleccionar…'}</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>{label}</Text>
            <TextInput accessibilityLabel={`Buscar ${label.toLowerCase()}`} placeholder="Buscar por nombre…"
              style={styles.input} value={query} onChangeText={setQuery} autoFocus />
            <FlatList data={filtered} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No hay coincidencias.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity accessibilityRole="button" style={styles.option} onPress={() => { onChange(item.id); close(); }}>
                  <Text style={{ color: item.id === value ? colors.primary : colors.text }}>{item.label}</Text>
                </TouchableOpacity>
              )} />
            <TouchableOpacity accessibilityRole="button" onPress={close} style={styles.option}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, color: colors.text },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { width: '100%', maxWidth: 600, maxHeight: '80%', backgroundColor: colors.white, padding: 20, borderRadius: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  option: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  empty: { color: colors.subtext, paddingVertical: 20 },
});
