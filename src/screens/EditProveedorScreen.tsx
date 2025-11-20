import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProveedor'>;

export default function EditProveedorScreen({ navigation, route }: Props) {
    const { proveedor } = route.params;
    const [nombre, setNombre] = useState(proveedor.nombre);
    const [direccion, setDireccion] = useState(proveedor.direccion || '');
    const [saving, setSaving] = useState(false);

    const onSave = async () => {
        if (!nombre.trim()) {
            return Alert.alert('Error', 'El nombre es obligatorio');
        }

        setSaving(true);
        const { error } = await supabase
            .from('proveedores')
            .update({
                nombre: nombre.trim(),
                direccion: direccion.trim() || null,
            })
            .eq('id', proveedor.id);

        setSaving(false);

        if (error) {
            console.log('Error actualizando proveedor:', error);
            return Alert.alert('Error', error.message);
        }

        // Navegar a la lista para ver los cambios
        navigation.navigate('ProveedoresList');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Editar Proveedor</Text>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
                style={styles.input}
                placeholder="Ej: Distribuidora Mayorista"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
            />

            <Text style={styles.label}>Dirección</Text>
            <TextInput
                style={styles.input}
                placeholder="Calle Falsa 123"
                value={direccion}
                onChangeText={setDireccion}
                autoCapitalize="words"
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
