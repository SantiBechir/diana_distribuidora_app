import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';

export const NewProveedorScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        direccion: '',
    });

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setLoading(true);
        try {
            await ProveedorRepository.create(form);
            Alert.alert('Éxito', 'Proveedor creado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el proveedor');
        } finally {
            setLoading(false);
        }
    };

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
                    title="Guardar Proveedor"
                    onPress={handleSave}
                    loading={loading}
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
