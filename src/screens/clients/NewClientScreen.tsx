import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';

export const NewClientScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        cuil: '',
        direccion: '',
        telefono: '',
        mail: '',
        tipo: 'Regular' as 'Regular' | 'Licitación',
    });

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        setLoading(true);
        try {
            await ClienteRepository.create(form);
            Alert.alert('Éxito', 'Cliente creado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el cliente');
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
                    title="Guardar Cliente"
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
