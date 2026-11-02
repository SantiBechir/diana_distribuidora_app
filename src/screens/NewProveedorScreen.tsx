import React, { useState } from 'react';
import { useFormGuard } from '../hooks/useFormGuard';
import { FieldError } from '../components/FieldError';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { proveedorService } from '../services';
import { colors } from '../theme/colors';
import { pesosToCentavos, parseMoneyInput } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProveedor'>;

export default function NewProveedorScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saving, setSaving] = useState(false);
  const { markSaved } = useFormGuard([nombre, telefono, direccion, saldoInicial], saving);
  const validation = proveedorService.validate({ nombre, telefono,
    saldo_centavos: saldoInicial.trim() ? Math.round(parseMoneyInput(saldoInicial) * 100) : 0,
  });
  const errors = validation.errors;

  const onSave = async () => {
    if (!nombre.trim()) {
      return Alert.alert('Error', 'El nombre del proveedor es obligatorio.');
    }

    try {
      setSaving(true);
      const saldoPesos = saldoInicial.trim() ? parseMoneyInput(saldoInicial) : 0;
      if (isNaN(saldoPesos) || saldoPesos < 0) {
        setSaving(false);
        return Alert.alert('Error', 'El saldo inicial debe ser un número mayor o igual a 0.');
      }

      const saldoCentavos = pesosToCentavos(saldoPesos);

      await proveedorService.create({
        nombre,
        telefono,
        direccion,
        saldo_centavos: saldoCentavos,
      });

      markSaved();
      Alert.alert('Éxito', 'Proveedor registrado exitosamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el proveedor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Nuevo Proveedor</Text>

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

      <Text style={styles.label}>Saldo Inicial de deuda ($)</Text>
      <TextInput
        style={[styles.input, errors.saldo_centavos ? { borderColor: colors.danger } : null]}
        placeholder="0.00"
        value={saldoInicial}
        onChangeText={setSaldoInicial}
        keyboardType="numeric"
      />
      <FieldError message={errors.saldo_centavos} />
      <Text style={styles.hint}>Dejar vacío si no hay deuda previa pendiente.</Text>

      <TouchableOpacity
        disabled={saving || !validation.isValid}
        onPress={onSave}
        style={[styles.button, { opacity: saving || !validation.isValid ? 0.6 : 1 }]}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar proveedor'}</Text>
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
  hint: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
  },
  button: {
    marginTop: 32,
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
