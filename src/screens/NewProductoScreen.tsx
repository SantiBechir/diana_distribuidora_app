import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProducto'>;

export default function NewProductoScreen({ navigation }: Props) {
    const [nombre, setNombre] = useState('');
    const [unidad, setUnidad] = useState<'Kg' | 'Bolsa' | 'Unidad'>('Unidad');
    const [precioCosto, setPrecioCosto] = useState('');
    const [precioVenta, setPrecioVenta] = useState('');
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

        // Verificar si ya existe un producto con ese nombre
        const { data: existing } = await supabase
            .from('productos')
            .select('id')
            .ilike('nombre', nombre.trim())
            .limit(1);

        if (existing && existing.length > 0) {
            setSaving(false);
            return Alert.alert('Error', 'Ya existe un producto con ese nombre');
        }

        const { error } = await supabase
            .from('productos')
            .insert({
                nombre: nombre.trim(),
                unidad,
                precio_costo: costo,
                precio_venta: venta,
            });

        setSaving(false);

        if (error) {
            console.log('Error creando producto:', error);
            return Alert.alert('Error', error.message);
        }

        // Navegar directamente a la lista
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
            <Text style={styles.title}>Nuevo Producto</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: Papa"
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
                <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar producto'}</Text>
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
