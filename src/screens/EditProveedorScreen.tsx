import React, { useState } from 'react';
import { useFormGuard } from '../hooks/useFormGuard';
import { FieldError } from '../components/FieldError';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { proveedorService } from '../services';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProveedor'>;

export default function EditProveedorScreen({ navigation, route }: Props) {
  const { proveedor } = route.params;
  const [nombre, setNombre] = useState(proveedor.nombre);
  const [telefono, setTelefono] = useState(proveedor.telefono || '');
  const [direccion, setDireccion] = useState(proveedor.direccion || '');
  const [saving, setSaving] = useState(false);
  const { markSaved } = useFormGuard([nombre, telefono, direccion], saving);
  const validation = proveedorService.validate({ nombre, telefono });
  const errors = validation.errors;

  const onSave = async () => {
    if (!nombre.trim()) {
      return Alert.alert('Error', 'El nombre del proveedor es obligatorio.');
    }

    try {
      setSaving(true);
      await proveedorService.update(proveedor.id, {
        nombre,
        telefono,
        direccion,
      });

      markSaved();
      Alert.alert('Éxito', 'Proveedor actualizado exitosamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar el proveedor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Editar Proveedor</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={[styles.input, errors.nombre ? { borderColor: colors.danger } : null]}
        placeholder="Ej: Distribuidora Notari"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />
      <FieldError message={errors.nombre} />

      <Text style={styles.label}>Teléfono / Celular (opcional)</Text>
      <TextInput
        style={[styles.input, errors.telefono ? { borderColor: colors.danger } : null]}
        placeholder="3442-456789"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />
      <FieldError message={errors.telefono} />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ruta 14 Km 125"
        value={direccion}
        onChangeText={setDireccion}
        autoCapitalize="words"
      />

      <TouchableOpacity
        disabled={saving || !validation.isValid}
        onPress={onSave}
        style={[styles.button, { opacity: saving || !validation.isValid ? 0.6 : 1 }]}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  button: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
