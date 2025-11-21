import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ProductoRepository } from '../../repositories/ProductoRepository';
import { Producto } from '../../types/database.types';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';
import { Badge } from '../../components/Badge';

export const ProductsListScreen = () => {
    const navigation = useNavigation<any>();
    const [products, setProducts] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadProducts = async () => {
        try {
            const data = search
                ? await ProductoRepository.search(search)
                : await ProductoRepository.getAll();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProducts();
        }, [search])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    const renderItem = ({ item }: { item: Producto }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.nombre}</Text>
                    <Text style={styles.unit}>{item.unidad}</Text>
                </View>
                <View style={styles.prices}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Costo:</Text>
                        <Text style={styles.priceValue}>${item.precio_costo.toFixed(2)}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Venta:</Text>
                        <Text style={[styles.priceValue, styles.salePrice]}>${item.precio_venta.toFixed(2)}</Text>
                    </View>
                </View>
                <Text
                    style={styles.actionLink}
                    onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
                >
                    Ver
                </Text>
            </View>
        </Card>
    );

    if (loading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Input
                    placeholder="Buscar producto..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron productos</Text>}
            />
            <FAB onPress={() => navigation.navigate('NewProduct')} />
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
        paddingBottom: 80,
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
        marginBottom: 4,
    },
    unit: {
        fontSize: 14,
        color: colors.subtext,
        fontStyle: 'italic',
    },
    prices: {
        marginRight: 16,
        alignItems: 'flex-end',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: colors.subtext,
        marginRight: 4,
    },
    priceValue: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    salePrice: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionLink: {
        color: colors.primary,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.subtext,
        fontSize: 16,
    },
});
