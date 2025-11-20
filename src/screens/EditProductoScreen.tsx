import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProducto'>;

export default function EditProductoScreen({ navigation, route }: Props) {
    const { producto } = route.params;
    const [nombre, setNombre] = useState(producto.nombre);
    const [unidad, setUnidad] = useState<'Kg' | 'Bolsa' | 'Unidad'>(producto.unidad);
    const [precioCosto, setPrecioCosto] = useState(producto.precio_costo.toString());
    const [precioVenta, setPrecioVenta] = useState(producto.precio_venta.toString());
    const [saving, setSaving] = useState(false);

    const onSave = async () => {
        if (!nombre.trim()) return Alert.alert('Error', 'El nombre es obligatorio');
        if (!precioCosto.trim()) return Alert.alert('Error', 'El precio de costo es obligatorio');
        if (!precioVenta.trim()) return Alert.alert('Error', 'El precio de venta es obligatorio');

        const costo = parseFloat(precioCosto);
        const venta = parseFloat(precioVenta);

        if (isNaN(costo) || isNaN(venta)) {
            return Alert.alert('Error', 'Los precios deben ser numéricos');
        }

        setSaving(true);
        const { error } = await supabase
            .from('productos')
            .update({
                nombre: nombre.trim(),
                unidad,
                precio_costo: costo,
                precio_venta: venta,
            })
            .eq('id', producto.id);

        setSaving(false);

        if (error) {
            console.log('Error actualizando producto:', error);
            return Alert.alert('Error', error.message);
        }

        // Navegar a la lista para ver los cambios
        navigation.navigate('ProductosList');
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
                style={styles.input}
                placeholder="Ej: Papas Fritas"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
            />

            <Text style={styles.label}>Unidad</Text>
            <View style={styles.row}>
                {renderUnidadOption('Unidad')}
                {renderUnidadOption('Kg')}
                {renderUnidadOption('Bolsa')}
            </View>

            <Text style={styles.label}>Precio Costo *</Text>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                value={precioCosto}
                onChangeText={setPrecioCosto}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Precio Venta *</Text>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                value={precioVenta}
                onChangeText={setPrecioVenta}
                keyboardType="numeric"
            />

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
