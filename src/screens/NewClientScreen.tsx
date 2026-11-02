import React, { useState } from 'react';
import { useFormGuard } from '../hooks/useFormGuard';
import { FieldError } from '../components/FieldError';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { clienteService } from '../services';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewClient'>;

export default function NewClientScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [cuil, setCuil] = useState('');
  const [mail, setMail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tipo, setTipo] = useState<'Regular' | 'Licitación'>('Regular');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const { markSaved } = useFormGuard([nombre, cuil, mail, telefono, direccion, tipo, notas], saving);
  const validation = clienteService.validate({ nombre, cuil, mail, telefono });
  const errors = validation.errors;

  const onSave = async () => {
    try {
      setSaving(true);
      await clienteService.create({
        nombre,
        cuil,
        mail,
        telefono,
        direccion,
        tipo,
        notas,
        saldo_centavos: 0,
      });

      markSaved();
      Alert.alert('Éxito', 'Cliente registrado exitosamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Nuevo cliente</Text>

      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput
        style={[styles.input, errors.nombre ? { borderColor: colors.danger } : null]}
        placeholder="Ej: Almacén Don Pepe"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />
      <FieldError message={errors.nombre} />

      <Text style={styles.label}>CUIL (opcional)</Text>
      <TextInput
        style={[styles.input, errors.cuil ? { borderColor: colors.danger } : null]}
        placeholder="20-12345678-9"
        value={cuil}
        onChangeText={setCuil}
        keyboardType="numeric"
      />
      <FieldError message={errors.cuil} />

      <Text style={styles.label}>Email (opcional)</Text>
      <TextInput
        style={[styles.input, errors.mail ? { borderColor: colors.danger } : null]}
        placeholder="cliente@mail.com"
        value={mail}
        onChangeText={setMail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <FieldError message={errors.mail} />

      <Text style={styles.label}>Teléfono / WhatsApp (opcional)</Text>
      <TextInput
        style={[styles.input, errors.telefono ? { borderColor: colors.danger } : null]}
        placeholder="3442-123456"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />
      <FieldError message={errors.telefono} />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Av. Urquiza 742"
        value={direccion}
        onChangeText={setDireccion}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Tipo de cliente</Text>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => setTipo('Regular')}
          style={[
            styles.pill,
            {
              backgroundColor: tipo === 'Regular' ? colors.primaryLight : colors.border,
              borderWidth: tipo === 'Regular' ? 2 : 1,
              borderColor: tipo === 'Regular' ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: tipo === 'Regular' ? colors.primaryDark : colors.subtext }]}>
            Regular
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTipo('Licitación')}
          style={[
            styles.pill,
            {
              backgroundColor: tipo === 'Licitación' ? colors.primaryLight : colors.border,
              borderWidth: tipo === 'Licitación' ? 2 : 1,
              borderColor: tipo === 'Licitación' ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: tipo === 'Licitación' ? colors.primaryDark : colors.subtext }]}>
            Licitación
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Notas (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Observaciones de entrega, horarios, etc."
        value={notas}
        onChangeText={setNotas}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        disabled={saving || !validation.isValid}
        onPress={onSave}
        style={[styles.button, { opacity: saving || !validation.isValid ? 0.6 : 1 }]}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar cliente'}</Text>
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
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  pill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pillText: {
    fontWeight: '600',
    fontSize: 15,
  },
  button: {
    marginTop: 28,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});