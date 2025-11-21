import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ProductoRepository } from '../../repositories/ProductoRepository';
import { Producto } from '../../types/database.types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';

export const ProductDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { id } = route.params;

    const [product, setProduct] = useState<Producto | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProduct = async () => {
        try {
            const data = await ProductoRepository.getById(id);
            setProduct(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo cargar el producto');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProduct();
        }, [id])
    );

    const handleDelete = async () => {
        Alert.alert(
            'Eliminar Producto',
            '¿Estás seguro de que querés eliminar este producto? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await ProductoRepository.delete(id);
                            navigation.goBack();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'No se pudo eliminar el producto');
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <LoadingSpinner />;
    if (!product) return <View style={styles.container}><Text>Producto no encontrado</Text></View>;

    const margin = ((product.precio_venta - product.precio_costo) / product.precio_costo) * 100;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card style={styles.headerCard}>
                    <Text style={styles.name}>{product.nombre}</Text>
                    <Text style={styles.unit}>{product.unidad}</Text>

                    <View style={styles.pricesContainer}>
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>Costo</Text>
                            <Text style={styles.priceValue}>${product.precio_costo.toFixed(2)}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.priceItem}>
                            <Text style={styles.priceLabel}>Venta</Text>
                            <Text style={[styles.priceValue, styles.salePrice]}>${product.precio_venta.toFixed(2)}</Text>
                        </View>
                    </View>

                    <View style={styles.marginContainer}>
                        <Text style={styles.marginLabel}>Margen:</Text>
                        <Text style={[
                            styles.marginValue,
                            { color: margin < 0 ? colors.danger : margin < 30 ? colors.warning : colors.success }
                        ]}>
                            {margin.toFixed(2)}%
                        </Text>
                    </View>
                </Card>

                <Button
                    title="Editar Producto"
                    onPress={() => navigation.navigate('EditProduct', { id: product.id })}
                    variant="outline"
                    style={styles.editButton}
                />

                <Button
                    title="Eliminar Producto"
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
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    unit: {
        fontSize: 16,
        color: colors.subtext,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    pricesContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    priceItem: {
        alignItems: 'center',
    },
    separator: {
        width: 1,
        backgroundColor: colors.border,
        height: '100%',
    },
    priceLabel: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
    },
    salePrice: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    marginContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    marginLabel: {
        fontSize: 14,
        color: colors.subtext,
        marginRight: 8,
    },
    marginValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        marginBottom: 12,
    },
    deleteButton: {
        marginTop: 0,
    },
});
