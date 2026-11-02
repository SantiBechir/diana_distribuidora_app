import React, { useState } from 'react';
import { useFormGuard } from '../hooks/useFormGuard';
import { FieldError } from '../components/FieldError';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { productoService } from '../services';
import { colors } from '../theme/colors';
import { centavosToPesos, pesosToCentavos, parseMoneyInput } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProducto'>;

export default function EditProductoScreen({ navigation, route }: Props) {
  const { producto } = route.params;
  const [nombre, setNombre] = useState(producto.nombre);
  const [descripcion, setDescripcion] = useState(producto.descripcion || '');
  const [unidad, setUnidad] = useState<'Kg' | 'Bolsa' | 'Unidad'>(producto.unidad);
  const [precioCosto, setPrecioCosto] = useState(centavosToPesos(producto.precio_costo_centavos).toString());
  const [precioVenta, setPrecioVenta] = useState(centavosToPesos(producto.precio_venta_centavos).toString());
  const [saving, setSaving] = useState(false);
  const { markSaved } = useFormGuard([nombre, descripcion, unidad, precioCosto, precioVenta], saving);
  const validation = productoService.validate({
    nombre,
    precio_costo_centavos: Math.round(parseMoneyInput(precioCosto) * 100),
    precio_venta_centavos: Math.round(parseMoneyInput(precioVenta) * 100),
  });
  const errors = validation.errors;

  const executeSave = async (costoCentavos: number, ventaCentavos: number) => {
    try {
      setSaving(true);
      await productoService.update(producto.id, {
        nombre,
        descripcion,
        unidad,
        precio_costo_centavos: costoCentavos,
        precio_venta_centavos: ventaCentavos,
      });

      markSaved();
      Alert.alert('Éxito', 'Producto actualizado exitosamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => {
    if (!nombre.trim()) {
      return Alert.alert('Error', 'El nombre del producto es obligatorio.');
    }
    if (!precioCosto.trim()) {
      return Alert.alert('Error', 'El precio de costo es obligatorio.');
    }
    if (!precioVenta.trim()) {
      return Alert.alert('Error', 'El precio de venta es obligatorio.');
    }

    const costoNum = parseMoneyInput(precioCosto);
    const ventaNum = parseMoneyInput(precioVenta);

    if (isNaN(costoNum) || isNaN(ventaNum)) {
      return Alert.alert('Error', 'Los precios deben ser valores numéricos válidos.');
    }
    if (costoNum < 0 || ventaNum < 0) {
      return Alert.alert('Error', 'Los precios no pueden ser negativos.');
    }

    const costoCentavos = pesosToCentavos(costoNum);
    const ventaCentavos = pesosToCentavos(ventaNum);

    if (productoService.isMargenNegativo(costoCentavos, ventaCentavos)) {
      Alert.alert(
        'Advertencia de margen negativo',
        `El precio de venta ($${ventaNum.toFixed(2)}) es menor al precio de costo ($${costoNum.toFixed(2)}).\n\n¿Deseas guardar los cambios de todas formas?`,
        [
          { text: 'Corregir', style: 'cancel' },
          {
            text: 'Guardar de todas formas',
            style: 'destructive',
            onPress: () => executeSave(costoCentavos, ventaCentavos),
          },
        ]
      );
      return;
    }

    executeSave(costoCentavos, ventaCentavos);
  };

  const renderUnidadOption = (val: 'Kg' | 'Bolsa' | 'Unidad') => (
    <TouchableOpacity
      onPress={() => setUnidad(val)}
      style={[
        styles.pill,
        {
          backgroundColor: unidad === val ? colors.primaryLight : colors.border,
          borderWidth: unidad === val ? 2 : 1,
          borderColor: unidad === val ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: unidad === val ? colors.primaryDark : colors.subtext }]}>
        {val}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Editar Producto</Text>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput
        style={[styles.input, errors.nombre ? { borderColor: colors.danger } : null]}
        placeholder="Ej: Tomate Perita"
        value={nombre}
        onChangeText={setNombre}
        autoCapitalize="words"
      />
      <FieldError message={errors.nombre} />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ej: Cajón x 18kg de primera calidad"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={2}
      />

      <Text style={styles.label}>Unidad de medida</Text>
      <View style={styles.row}>
        {renderUnidadOption('Kg')}
        {renderUnidadOption('Bolsa')}
        {renderUnidadOption('Unidad')}
      </View>

      <Text style={styles.label}>Precio Costo sugerido ($) *</Text>
      <TextInput
        style={[styles.input, errors.precio_costo ? { borderColor: colors.danger } : null]}
        placeholder="0.00"
        value={precioCosto}
        onChangeText={setPrecioCosto}
        keyboardType="numeric"
      />
      <FieldError message={errors.precio_costo} />

      <Text style={styles.label}>Precio Venta sugerido ($) *</Text>
      <TextInput
        style={[styles.input, errors.precio_venta ? { borderColor: colors.danger } : null]}
        placeholder="0.00"
        value={precioVenta}
        onChangeText={setPrecioVenta}
        keyboardType="numeric"
      />
      <FieldError message={errors.precio_venta} />

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
  textArea: {
    minHeight: 60,
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
