import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const EditProveedorScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        direccion: '',
    });

    useEffect(() => {
        const loadProveedor = async () => {
            try {
                const proveedor = await ProveedorRepository.getById(id);
                if (proveedor) {
                    setForm({
                        nombre: proveedor.nombre,
                        direccion: proveedor.direccion || '',
                    });
                } else {
                    Alert.alert('Error', 'Proveedor no encontrado');
                    navigation.goBack();
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo cargar el proveedor');
            } finally {
                setLoading(false);
            }
        };
        loadProveedor();
    }, [id]);

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setSaving(true);
        try {
            await ProveedorRepository.update(id, form);
            Alert.alert('Éxito', 'Proveedor actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el proveedor');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Input
                    label="Nombre *"
                    value={form.nombre}
                    onChangeText={(text) => setForm({ ...form, nombre: text })}
                />
                <Input
                    label="Dirección"
                    value={form.direccion}
                    onChangeText={(text) => setForm({ ...form, direccion: text })}
                />

                <Button
                    title="Guardar Cambios"
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveButton}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        padding: 16,
    },
    saveButton: {
        marginTop: 24,
    },
});
