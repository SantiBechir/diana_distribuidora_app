import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { PedidoRepository } from '../../repositories/PedidoRepository';
import { PedidoCompleto } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const PedidoDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;

    const [pedido, setPedido] = useState<PedidoCompleto | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPedido = async () => {
        try {
            const data = await PedidoRepository.getById(id);
            setPedido(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar el pedido');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPedido();
        }, [id])
    );

    const generatePDF = async () => {
        if (!pedido) return;

        const html = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #2E7D32; }
            .header { margin-bottom: 20px; }
            .client-info { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Diana Distribuidora</h1>
          <div class="header">
            <p>Fecha: ${new Date(pedido.fecha).toLocaleDateString()}</p>
            <p>Pedido ID: ${pedido.id.slice(0, 8)}</p>
          </div>
          <div class="client-info">
            <h3>Cliente: ${pedido.cliente.nombre}</h3>
            <p>Dirección: ${pedido.cliente.direccion || '-'}</p>
            <p>CUIL: ${pedido.cliente.cuil || '-'}</p>
          </div>
          <table>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
            ${pedido.pedido_lineas.map(l => `
              <tr>
                <td>${l.producto.nombre}</td>
                <td>${l.cantidad} ${l.producto.unidad}</td>
                <td>$${l.precio_unit_venta.toFixed(2)}</td>
                <td>$${(l.cantidad * l.precio_unit_venta).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total">
            Total: $${pedido.total.toFixed(2)}
          </div>
        </body>
      </html>
    `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo generar el PDF');
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!pedido) return <View style={styles.container}><Text>Pedido no encontrado</Text></View>;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <Text style={styles.clientName}>{pedido.cliente.nombre}</Text>
                        <Badge
                            label={pedido.estado}
                            variant={pedido.estado === 'Pagado' ? 'success' : pedido.estado === 'Impago' ? 'danger' : 'warning'}
                        />
                    </View>
                    <Text style={styles.date}>Fecha: {new Date(pedido.fecha).toLocaleDateString()}</Text>

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>${pedido.total.toFixed(2)}</Text>
                    </View>
                </Card>

                <Text style={styles.sectionTitle}>Detalle de Productos</Text>
                {pedido.pedido_lineas.map((linea, index) => (
                    <Card key={index} style={styles.lineItem}>
                        <View style={styles.lineItemRow}>
                            <Text style={styles.productName}>{linea.producto.nombre}</Text>
                            <Text style={styles.productTotal}>${(linea.cantidad * linea.precio_unit_venta).toFixed(2)}</Text>
                        </View>
                        <Text style={styles.productDetail}>
                            {linea.cantidad} {linea.producto.unidad} x ${linea.precio_unit_venta.toFixed(2)}
                        </Text>
                    </Card>
                ))}

                <View style={styles.actions}>
                    {pedido.estado !== 'Pagado' && (
                        <Button
                            title="Registrar Pago"
                            onPress={() => navigation.navigate('PagosClientes', { clienteId: pedido.cliente_id, pedidoId: pedido.id })}
                            style={styles.actionButton}
                        />
                    )}

                    <Button
                        title="Generar Boleta PDF"
                        onPress={generatePDF}
                        variant="secondary"
                        style={styles.actionButton}
                    />

                    {pedido.estado !== 'Pagado' && (
                        <Button
                            title="Modificar Pedido"
                            onPress={() => navigation.navigate('EditPedido', { id: pedido.id })}
                            variant="outline"
                            style={styles.actionButton}
                        />
                    )}
                </View>
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
        marginBottom: 8,
    },
    clientName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    date: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 16,
    },
    totalContainer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 14,
        color: colors.subtext,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: colors.text,
    },
    lineItem: {
        marginBottom: 8,
        padding: 12,
    },
    lineItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
    },
    productTotal: {
        fontWeight: 'bold',
    },
    productDetail: {
        color: colors.subtext,
        fontSize: 14,
    },
    actions: {
        marginTop: 24,
        marginBottom: 40,
    },
    actionButton: {
        marginBottom: 12,
    },
});
