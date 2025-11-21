import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProductoRepository } from '../../repositories/ProductoRepository';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const EditProductScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { id } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        unidad: 'Kg' as 'Kg' | 'Bolsa' | 'Unidad',
        precio_costo: '',
        precio_venta: '',
    });
    const [margin, setMargin] = useState<number | null>(null);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const product = await ProductoRepository.getById(id);
                if (product) {
                    setForm({
                        nombre: product.nombre,
                        unidad: product.unidad,
                        precio_costo: product.precio_costo.toString(),
                        precio_venta: product.precio_venta.toString(),
                    });
                } else {
                    Alert.alert('Error', 'Producto no encontrado');
                    navigation.goBack();
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'No se pudo cargar el producto');
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    useEffect(() => {
        const costo = parseFloat(form.precio_costo);
        const venta = parseFloat(form.precio_venta);
        if (!isNaN(costo) && !isNaN(venta) && costo > 0) {
            const margen = ((venta - costo) / costo) * 100;
            setMargin(margen);
        } else {
            setMargin(null);
        }
    }, [form.precio_costo, form.precio_venta]);

    const handleSave = async () => {
        if (!form.nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }
        if (!form.precio_costo || isNaN(parseFloat(form.precio_costo))) {
            Alert.alert('Error', 'El precio de costo es inválido');
            return;
        }
        if (!form.precio_venta || isNaN(parseFloat(form.precio_venta))) {
            Alert.alert('Error', 'El precio de venta es inválido');
            return;
        }

        setSaving(true);
        try {
            await ProductoRepository.update(id, {
                nombre: form.nombre,
                unidad: form.unidad,
                precio_costo: parseFloat(form.precio_costo),
                precio_venta: parseFloat(form.precio_venta),
            });
            Alert.alert('Éxito', 'Producto actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo actualizar el producto');
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

                <View style={styles.unitContainer}>
                    <Text style={styles.label}>Unidad *</Text>
                    <View style={styles.unitButtons}>
                        {['Kg', 'Bolsa', 'Unidad'].map((u) => (
                            <Button
                                key={u}
                                title={u}
                                onPress={() => setForm({ ...form, unidad: u as any })}
                                variant={form.unidad === u ? 'primary' : 'outline'}
                                style={styles.unitButton}
                            />
                        ))}
                    </View>
                </View>

                <Input
                    label="Precio Costo *"
                    value={form.precio_costo}
                    onChangeText={(text) => setForm({ ...form, precio_costo: text })}
                    keyboardType="numeric"
                />
                <Input
                    label="Precio Venta *"
                    value={form.precio_venta}
                    onChangeText={(text) => setForm({ ...form, precio_venta: text })}
                    keyboardType="numeric"
                />

                {margin !== null && (
                    <View style={styles.marginContainer}>
                        <Text style={styles.marginLabel}>Margen de Ganancia:</Text>
                        <Text style={[
                            styles.marginValue,
                            { color: margin < 0 ? colors.danger : margin < 30 ? colors.warning : colors.success }
                        ]}>
                            {margin.toFixed(2)}%
                        </Text>
                    </View>
                )}

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
    unitContainer: {
        marginVertical: 8,
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
        fontWeight: '500',
    },
    unitButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    unitButton: {
        flex: 1,
        paddingVertical: 8,
    },
    marginContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    marginLabel: {
        fontSize: 16,
        color: colors.text,
    },
    marginValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    saveButton: {
        marginTop: 24,
    },
});
