import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PedidoRepository } from '../../repositories/PedidoRepository';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { ProductoRepository } from '../../repositories/ProductoRepository';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { Cliente, Producto, Proveedor, PedidoLinea } from '../../types/database.types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const NewPedidoScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const initialClienteId = route.params?.clienteId;

    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);

    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [lineas, setLineas] = useState<Partial<PedidoLinea & { producto: Producto, proveedor: Proveedor | null }>[]>([]);

    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);
    const [searchProduct, setSearchProduct] = useState('');
    const [searchClient, setSearchClient] = useState('');

    // Line item form
    const [currentLine, setCurrentLine] = useState<{
        producto: Producto | null;
        cantidad: string;
        precio_costo: string;
        precio_venta: string;
        proveedor: Proveedor | null;
    }>({
        producto: null,
        cantidad: '',
        precio_costo: '',
        precio_venta: '',
        proveedor: null,
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (initialClienteId && clientes.length > 0) {
            const client = clientes.find(c => c.id === initialClienteId);
            if (client) setSelectedCliente(client);
        }
    }, [initialClienteId, clientes]);

    const loadData = async () => {
        const [c, p, pr] = await Promise.all([
            ClienteRepository.getAll(),
            ProductoRepository.getAll(),
            ProveedorRepository.getAll(),
        ]);
        setClientes(c);
        setProductos(p);
        setProveedores(pr);
    };

    const handleAddLine = () => {
        if (!currentLine.producto) {
            Alert.alert('Error', 'Seleccione un producto');
            return;
        }
        if (!currentLine.cantidad || isNaN(parseFloat(currentLine.cantidad))) {
            Alert.alert('Error', 'Cantidad inválida');
            return;
        }
        if (!currentLine.precio_venta || isNaN(parseFloat(currentLine.precio_venta))) {
            Alert.alert('Error', 'Precio de venta inválido');
            return;
        }

        const newLine = {
            producto_id: currentLine.producto.id,
            producto: currentLine.producto,
            cantidad: parseFloat(currentLine.cantidad),
            precio_unit_costo: parseFloat(currentLine.precio_costo),
            precio_unit_venta: parseFloat(currentLine.precio_venta),
            proveedor_id: currentLine.proveedor?.id || null,
            proveedor: currentLine.proveedor,
        };

        setLineas([...lineas, newLine]);
        setCurrentLine({
            producto: null,
            cantidad: '',
            precio_costo: '',
            precio_venta: '',
            proveedor: null,
        });
        setShowProductModal(false);
    };

    const handleRemoveLine = (index: number) => {
        const newLineas = [...lineas];
        newLineas.splice(index, 1);
        setLineas(newLineas);
    };

    const calculateTotal = () => {
        return lineas.reduce((acc, curr) => acc + (curr.cantidad! * curr.precio_unit_venta!), 0);
    };

    const handleSave = async () => {
        if (!selectedCliente) {
            Alert.alert('Error', 'Seleccione un cliente');
            return;
        }
        if (lineas.length === 0) {
            Alert.alert('Error', 'Agregue al menos un producto');
            return;
        }

        setLoading(true);
        try {
            await PedidoRepository.create({
                cliente_id: selectedCliente.id,
                fecha,
                total: calculateTotal(),
                estado: 'Impago',
            }, lineas as any);

            Alert.alert('Éxito', 'Pedido creado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el pedido');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = searchProduct
        ? productos.filter(p => p.nombre.toLowerCase().includes(searchProduct.toLowerCase()))
        : productos;

    const filteredClients = searchClient
        ? clientes.filter(c => c.nombre.toLowerCase().includes(searchClient.toLowerCase()))
        : clientes;

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Cliente Selection */}
                <TouchableOpacity onPress={() => setShowClientModal(true)}>
                    <Input
                        label="Cliente *"
                        value={selectedCliente?.nombre || ''}
                        editable={false}
                        placeholder="Seleccionar Cliente"
                        pointerEvents="none"
                    />
                </TouchableOpacity>

                <Input
                    label="Fecha"
                    value={fecha}
                    onChangeText={setFecha}
                    placeholder="YYYY-MM-DD"
                />

                <Text style={styles.sectionTitle}>Productos</Text>

                {lineas.map((linea, index) => (
                    <Card key={index} style={styles.lineItemCard}>
                        <View style={styles.lineItemHeader}>
                            <Text style={styles.lineItemName}>{linea.producto?.nombre}</Text>
                            <TouchableOpacity onPress={() => handleRemoveLine(index)}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.lineItemDetail}>
                            {linea.cantidad} {linea.producto?.unidad} x ${linea.precio_unit_venta?.toFixed(2)}
                        </Text>
                        <Text style={styles.lineItemTotal}>
                            Subtotal: ${(linea.cantidad! * linea.precio_unit_venta!).toFixed(2)}
                        </Text>
                    </Card>
                ))}

                <Button
                    title="Agregar Producto"
                    onPress={() => setShowProductModal(true)}
                    variant="outline"
                    style={styles.addButton}
                />

                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total General:</Text>
                    <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
                </View>

                <Button
                    title="Guardar Pedido"
                    onPress={handleSave}
                    loading={loading}
                    style={styles.saveButton}
                />
            </ScrollView>

            {/* Product Modal */}
            <Modal visible={showProductModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Agregar Producto</Text>

                    {!currentLine.producto ? (
                        <>
                            <Input
                                placeholder="Buscar producto..."
                                value={searchProduct}
                                onChangeText={setSearchProduct}
                            />
                            <FlatList
                                data={filteredProducts}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.listItem}
                                        onPress={() => setCurrentLine({
                                            ...currentLine,
                                            producto: item,
                                            precio_costo: item.precio_costo.toString(),
                                            precio_venta: item.precio_venta.toString(),
                                        })}
                                    >
                                        <Text style={styles.listItemText}>{item.nombre}</Text>
                                        <Text style={styles.listItemSubtext}>${item.precio_venta}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    ) : (
                        <ScrollView>
                            <Text style={styles.selectedProduct}>{currentLine.producto.nombre}</Text>
                            <Input
                                label="Cantidad"
                                value={currentLine.cantidad}
                                onChangeText={t => setCurrentLine({ ...currentLine, cantidad: t })}
                                keyboardType="numeric"
                            />
                            <Input
                                label="Precio Costo (Unitario)"
                                value={currentLine.precio_costo}
                                onChangeText={t => setCurrentLine({ ...currentLine, precio_costo: t })}
                                keyboardType="numeric"
                            />
                            <Input
                                label="Precio Venta (Unitario)"
                                value={currentLine.precio_venta}
                                onChangeText={t => setCurrentLine({ ...currentLine, precio_venta: t })}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Proveedor (Opcional)</Text>
                            <ScrollView horizontal style={styles.providerList}>
                                {proveedores.map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[
                                            styles.providerChip,
                                            currentLine.proveedor?.id === p.id && styles.selectedProviderChip
                                        ]}
                                        onPress={() => setCurrentLine({ ...currentLine, proveedor: p })}
                                    >
                                        <Text style={[
                                            styles.providerChipText,
                                            currentLine.proveedor?.id === p.id && styles.selectedProviderChipText
                                        ]}>{p.nombre}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <Button title="Agregar" onPress={handleAddLine} style={{ flex: 1, marginRight: 8 }} />
                                <Button
                                    title="Cancelar"
                                    variant="secondary"
                                    onPress={() => {
                                        setCurrentLine({ ...currentLine, producto: null });
                                        setShowProductModal(false);
                                    }}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </ScrollView>
                    )}
                    {!currentLine.producto && (
                        <Button title="Cerrar" onPress={() => setShowProductModal(false)} variant="secondary" />
                    )}
                </View>
            </Modal>

            {/* Client Modal */}
            <Modal visible={showClientModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
                    <Input
                        placeholder="Buscar cliente..."
                        value={searchClient}
                        onChangeText={setSearchClient}
                    />
                    <FlatList
                        data={filteredClients}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.listItem}
                                onPress={() => {
                                    setSelectedCliente(item);
                                    setShowClientModal(false);
                                }}
                            >
                                <Text style={styles.listItemText}>{item.nombre}</Text>
                                <Text style={styles.listItemSubtext}>{item.direccion}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <Button title="Cerrar" onPress={() => setShowClientModal(false)} variant="secondary" />
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
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: colors.text,
    },
    lineItemCard: {
        padding: 12,
        marginBottom: 8,
    },
    lineItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lineItemName: {
        fontSize: 16,
        fontWeight: '600',
    },
    lineItemDetail: {
        color: colors.subtext,
        marginVertical: 4,
    },
    lineItemTotal: {
        fontWeight: 'bold',
        alignSelf: 'flex-end',
    },
    addButton: {
        marginVertical: 16,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderRadius: 8,
        marginBottom: 24,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
    },
    saveButton: {
        marginBottom: 40,
    },
    modalContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.bg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    listItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.white,
    },
    listItemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    listItemSubtext: {
        color: colors.subtext,
    },
    selectedProduct: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
        fontWeight: '500',
    },
    providerList: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    providerChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.border,
        marginRight: 8,
    },
    selectedProviderChip: {
        backgroundColor: colors.primary,
    },
    providerChipText: {
        color: colors.text,
    },
    selectedProviderChipText: {
        color: colors.white,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 16,
    },
});
