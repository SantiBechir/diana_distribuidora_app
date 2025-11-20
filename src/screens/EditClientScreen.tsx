import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditClient'>;

export default function EditClientScreen({ navigation, route }: Props) {
  const { cliente } = route.params;
  const [nombre, setNombre] = useState(cliente.nombre);
  const [cuil, setCuil] = useState(cliente.cuil || '');
  const [mail, setMail] = useState(cliente.mail || '');
  const [telefono, setTelefono] = useState(cliente.telefono || '');
  const [direccion, setDireccion] = useState(cliente.direccion || '');
  const [tipo, setTipo] = useState<'Regular' | 'Licitación'>(cliente.tipo);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!nombre.trim()) {
      return Alert.alert('Error', 'El nombre es obligatorio');
    }

    setSaving(true);
    const { error } = await supabase
      .from('clientes')
      .update({
        nombre: nombre.trim(),
        cuil: cuil.trim() || null,
        mail: mail.trim() || null,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        tipo,
      })
      .eq('id', cliente.id);

    setSaving(false);

    if (error) {
      console.log('Error actualizando cliente:', error);
      return Alert.alert('Error', error.message);
    }

    // Navegar a la lista para ver los cambios
    navigation.navigate('ClientsList');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Editar cliente</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Almacén Don Pepe"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />

      <Text style={styles.label}>CUIL</Text>
      <TextInput
        style={styles.input}
        placeholder="20-12345678-9"
        value={cuil}
        onChangeText={setCuil}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="cliente@mail.com"
        value={mail}
        onChangeText={setMail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        placeholder="11-5555-0000"
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={styles.input}
        placeholder="Av. Siempreviva 742"
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

      <TouchableOpacity
        disabled={saving}
        onPress={onSave}
        style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
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
    marginBottom: 20,
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
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
    marginTop: 24,
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
