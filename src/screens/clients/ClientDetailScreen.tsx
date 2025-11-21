import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { Cliente } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const ClientDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;

    const [client, setClient] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    const loadClient = async () => {
        try {
            const data = await ClienteRepository.getById(id);
            setClient(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar el cliente');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadClient();
        }, [id])
    );

    if (loading) return <LoadingSpinner />;
    if (!client) return <View style={styles.container}><Text>Cliente no encontrado</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <Text style={styles.name}>{client.nombre}</Text>
                        <Badge label={client.tipo} variant="info" />
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Saldo Actual</Text>
                        <Text style={[
                            styles.balanceValue,
                            { color: client.saldo > 0 ? colors.danger : colors.success }
                        ]}>
                            ${client.saldo.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>CUIL:</Text>
                        <Text style={styles.value}>{client.cuil || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Teléfono:</Text>
                        <Text style={styles.value}>{client.telefono || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{client.mail || '-'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Dirección:</Text>
                        <Text style={styles.value}>{client.direccion || '-'}</Text>
                    </View>
                </Card>

                <View style={styles.actions}>
                    <Button
                        title="Nuevo Pedido"
                        onPress={() => navigation.navigate('NewPedido', { clienteId: client.id })}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Registrar Pago"
                        onPress={() => navigation.navigate('PagosClientes', { clienteId: client.id })}
                        variant="secondary"
                        style={styles.actionButton}
                    />
                </View>

                <Button
                    title="Editar Datos"
                    onPress={() => navigation.navigate('EditClient', { id: client.id })}
                    variant="outline"
                    style={styles.editButton}
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        flex: 1,
        marginRight: 8,
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
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
    },
    editButton: {
        marginTop: 8,
    },
});
