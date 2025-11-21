import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const EditClientScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        cuil: '',
        direccion: '',
        telefono: '',
        mail: '',
        tipo: 'Regular' as 'Regular' | 'Licitación',
    });

    useEffect(() => {
        const loadClient = async () => {
            try {
                const client = await ClienteRepository.getById(id);
                if (client) {
                    setForm({
                        nombre: client.nombre,
                        cuil: client.cuil || '',
                        direccion: client.direccion || '',
                        telefono: client.telefono || '',
                        mail: client.mail || '',
                        tipo: client.tipo,
                    });
                } else {
                    Alert.alert('Error', 'Cliente no encontrado');
                    navigation.goBack();
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo cargar el cliente');
            } finally {
                setLoading(false);
            }
        };
        loadClient();
    }, [id]);

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setSaving(true);
        try {
            await ClienteRepository.update(id, form);
            Alert.alert('Éxito', 'Cliente actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el cliente');
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
                    label="CUIL"
                    value={form.cuil}
                    onChangeText={(text) => setForm({ ...form, cuil: text })}
                    keyboardType="numeric"
                />
                <Input
                    label="Dirección"
                    value={form.direccion}
                    onChangeText={(text) => setForm({ ...form, direccion: text })}
                />
                <Input
                    label="Teléfono"
                    value={form.telefono}
                    onChangeText={(text) => setForm({ ...form, telefono: text })}
                    keyboardType="phone-pad"
                />
                <Input
                    label="Email"
                    value={form.mail}
                    onChangeText={(text) => setForm({ ...form, mail: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.typeContainer}>
                    <Button
                        title="Regular"
                        onPress={() => setForm({ ...form, tipo: 'Regular' })}
                        variant={form.tipo === 'Regular' ? 'primary' : 'outline'}
                        style={styles.typeButton}
                    />
                    <Button
                        title="Licitación"
                        onPress={() => setForm({ ...form, tipo: 'Licitación' })}
                        variant={form.tipo === 'Licitación' ? 'primary' : 'outline'}
                        style={styles.typeButton}
                    />
                </View>

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
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
        gap: 16,
    },
    typeButton: {
        flex: 1,
    },
    saveButton: {
        marginTop: 24,
    },
});
