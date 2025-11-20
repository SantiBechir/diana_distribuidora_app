import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewProveedor'>;

export default function NewProveedorScreen({ navigation }: Props) {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saving, setSaving] = useState(false);

    const onSave = async () => {
        if (!nombre.trim()) {
            return Alert.alert('Error', 'El nombre es obligatorio');
        }

        setSaving(true);
        const saldo = saldoInicial.trim() ? parseFloat(saldoInicial) : 0;

        // Verificar si ya existe un proveedor con ese nombre
        const { data: existing } = await supabase
            .from('proveedores')
            .select('id')
            .ilike('nombre', nombre.trim())
            .limit(1);

        if (existing && existing.length > 0) {
            setSaving(false);
            return Alert.alert('Error', 'Ya existe un proveedor con ese nombre');
        }

        const { error } = await supabase
            .from('proveedores')
            .insert({
                nombre: nombre.trim(),
                direccion: direccion.trim() || null,
                saldo: isNaN(saldo) ? 0 : saldo,
            });

        setSaving(false);

        if (error) {
            console.log('Error creando proveedor:', error);
            return Alert.alert('Error', error.message);
        }

        // Navegar directamente a la lista
        navigation.navigate('ProveedoresList');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.title}>Nuevo Proveedor</Text>

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

            <Text style={styles.label}>Saldo Inicial</Text>
            <TextInput
                style={styles.input}
                placeholder="0.00"
                value={saldoInicial}
                onChangeText={setSaldoInicial}
                keyboardType="numeric"
            />
            <Text style={styles.hint}>Dejar vacío si es 0.</Text>

            <TouchableOpacity
                disabled={saving}
                onPress={onSave}
                style={[styles.button, { opacity: saving ? 0.6 : 1 }]}
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
