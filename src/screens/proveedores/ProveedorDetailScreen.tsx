import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { Proveedor } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const ProveedorDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;

    const [proveedor, setProveedor] = useState<Proveedor | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProveedor = async () => {
        try {
            const data = await ProveedorRepository.getById(id);
            setProveedor(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar el proveedor');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProveedor();
        }, [id])
    );

    const handleDelete = async () => {
        Alert.alert(
            'Eliminar Proveedor',
            '¿Estás seguro de que querés eliminar este proveedor? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ProveedorRepository.delete(id);
                            navigation.goBack();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'No se pudo eliminar el proveedor');
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <LoadingSpinner />;
    if (!proveedor) return <View style={styles.container}><Text>Proveedor no encontrado</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card style={styles.headerCard}>
                    <Text style={styles.name}>{proveedor.nombre}</Text>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Saldo Actual</Text>
                        <Text style={[
                            styles.balanceValue,
                            { color: proveedor.saldo > 0 ? colors.danger : colors.success }
                        ]}>
                            ${proveedor.saldo.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Dirección:</Text>
                        <Text style={styles.value}>{proveedor.direccion || '-'}</Text>
                    </View>
                </Card>

                <View style={styles.actions}>
                    <Button
                        title="Registrar Pago"
                        onPress={() => navigation.navigate('PagosProveedores', { proveedorId: proveedor.id })}
                        style={styles.actionButton}
                    />
                </View>

                <Button
                    title="Editar Datos"
                    onPress={() => navigation.navigate('EditProveedor', { id: proveedor.id })}
                    variant="outline"
                    style={styles.editButton}
                />

                <Button
                    title="Eliminar Proveedor"
                    onPress={handleDelete}
                    variant="danger"
                    style={styles.deleteButton}
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
    headerCard: {
        marginBottom: 24,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    balanceContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 4,
    },
    balanceValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        width: 80,
        fontWeight: '600',
        color: colors.subtext,
    },
    value: {
        flex: 1,
        color: colors.text,
    },
    actions: {
        marginBottom: 16,
    },
    actionButton: {
        marginBottom: 8,
    },
    editButton: {
        marginBottom: 12,
    },
    deleteButton: {
        marginTop: 0,
    },
});
