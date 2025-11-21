import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, Modal, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { PagoRepository } from '../../repositories/PagoRepository';
import { Proveedor } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const PagosProveedoresScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const initialProveedorId = route.params?.proveedorId;

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Payment Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
    const [monto, setMonto] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

    const loadProveedores = async () => {
        try {
            const all = await ProveedorRepository.getAll();
            const debtors = all.filter(p => p.saldo > 0);
            setProveedores(debtors);

            if (initialProveedorId && !showModal) {
                const prov = all.find(p => p.id === initialProveedorId);
                if (prov) {
                    openPaymentModal(prov);
                    navigation.setParams({ proveedorId: undefined });
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
            loadProveedores();
        }, [initialProveedorId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadProveedores();
    };

    const openPaymentModal = (proveedor: Proveedor) => {
        setSelectedProveedor(proveedor);
        setMonto('');
        setFecha(new Date().toISOString().split('T')[0]);
        setShowModal(true);
    };

    const handleSavePago = async () => {
        if (!selectedProveedor || !monto || isNaN(parseFloat(monto))) {
            Alert.alert('Error', 'Ingrese un monto válido');
            return;
        }

        try {
            await PagoRepository.registrarPagoProveedor({
                proveedor_id: selectedProveedor.id,
                fecha,
                monto: parseFloat(monto)
            });
            Alert.alert('Éxito', 'Pago registrado');
            setShowModal(false);
            loadProveedores();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo registrar el pago');
        }
    };

    const filteredProveedores = search
        ? proveedores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
        : proveedores;

    const renderItem = ({ item }: { item: Proveedor }) => (
        <TouchableOpacity onPress={() => openPaymentModal(item)}>
            <Card style={styles.card}>
                <View style={styles.cardContent}>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.nombre}</Text>
                        <Text style={styles.subtext}>Saldo Pendiente</Text>
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
                    placeholder="Buscar proveedor..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={filteredProveedores}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay proveedores con saldo pendiente</Text>}
            />

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Registrar Pago a Proveedor</Text>
                        {selectedProveedor && (
                            <>
                                <Text style={styles.clientName}>{selectedProveedor.nombre}</Text>
                                <Text style={styles.currentDebt}>Saldo Actual: ${selectedProveedor.saldo.toFixed(2)}</Text>

                                <Input
                                    label="Monto"
                                    value={monto}
                                    onChangeText={setMonto}
                                    keyboardType="numeric"
                                    autoFocus
                                />

                                {monto && !isNaN(parseFloat(monto)) && (
                                    <Text style={styles.remainingDebt}>
                                        Restante: ${(selectedProveedor.saldo - parseFloat(monto)).toFixed(2)}
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
