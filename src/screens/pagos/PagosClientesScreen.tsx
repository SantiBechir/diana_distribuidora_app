import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Modal, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { PagoRepository } from '../../repositories/PagoRepository';
import { Cliente } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const PagosClientesScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const initialClienteId = route.params?.clienteId;
    const initialPedidoId = route.params?.pedidoId;

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Payment Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [monto, setMonto] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [pedidoId, setPedidoId] = useState<string | null>(null);

    const loadClientes = async () => {
        try {
            const all = await ClienteRepository.getAll();
            // Filter clients with debt > 0 or all?
            // "Lista de clientes con deuda > 0" according to prompt.
            const debtors = all.filter(c => c.saldo > 0);
            setClientes(debtors);

            if (initialClienteId && !showModal) {
                const client = all.find(c => c.id === initialClienteId);
                if (client) {
                    openPaymentModal(client, initialPedidoId);
                    // Clear params to avoid reopening
                    navigation.setParams({ clienteId: undefined, pedidoId: undefined });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadClientes();
        }, [initialClienteId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadClientes();
    };

    const openPaymentModal = (cliente: Cliente, pId: string | null = null) => {
        setSelectedCliente(cliente);
        setPedidoId(pId);
        setMonto('');
        setFecha(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleSavePago = async () => {
        if (!selectedCliente || !monto || isNaN(parseFloat(monto))) {
            Alert.alert('Error', 'Ingrese un monto válido');
            return;
        }

        try {
            await PagoRepository.registrarPagoCliente({
                cliente_id: selectedCliente.id,
                pedido_id: pedidoId,
                fecha,
                monto: parseFloat(monto)
            });
            Alert.alert('Éxito', 'Pago registrado');
            setShowModal(false);
            loadClientes();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo registrar el pago');
        }
    };

    const filteredClientes = search
        ? clientes.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
        : clientes;

    const renderItem = ({ item }: { item: Cliente }) => (
        <TouchableOpacity onPress={() => openPaymentModal(item)}>
            <Card style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.nombre}</Text>
                        <Text style={styles.subtext}>Deuda Total</Text>
                    </View>
                    <Text style={styles.debt}>${item.saldo.toFixed(2)}</Text>
                </View>
            </Card>
        </TouchableOpacity>
    );

    if (loading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Input
                    placeholder="Buscar cliente con deuda..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={filteredClientes}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay clientes con deuda pendiente</Text>}
            />

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registrar Pago</Text>
                        {selectedCliente && (
                            <>
                                <Text style={styles.clientName}>{selectedCliente.nombre}</Text>
                                <Text style={styles.currentDebt}>Deuda Actual: ${selectedCliente.saldo.toFixed(2)}</Text>

                                <Input
                                    label="Monto"
                                    value={monto}
                                    onChangeText={setMonto}
                                    keyboardType="numeric"
                                    autoFocus
                                />

                                {monto && !isNaN(parseFloat(monto)) && (
                                    <Text style={styles.remainingDebt}>
                                        Restante: ${(selectedCliente.saldo - parseFloat(monto)).toFixed(2)}
                                    </Text>
                                )}

                                <Input
                                    label="Fecha"
                                    value={fecha}
                                    onChangeText={setFecha}
                                    placeholder="YYYY-MM-DD"
                                />

                                <View style={styles.modalActions}>
                                    <Button title="Guardar" onPress={handleSavePago} style={{ flex: 1, marginRight: 8 }} />
                                    <Button title="Cancelar" variant="secondary" onPress={() => setShowModal(false)} style={{ flex: 1 }} />
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInput: {
        marginVertical: 0,
    },
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtext: {
        fontSize: 14,
        color: colors.subtext,
    },
    debt: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.danger,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.subtext,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    clientName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    currentDebt: {
        fontSize: 16,
        color: colors.danger,
        marginBottom: 16,
        textAlign: 'center',
    },
    remainingDebt: {
        fontSize: 16,
        color: colors.success,
        marginBottom: 16,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 16,
    },
});
