import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/database.types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductosList'>;

export default function ProductosListScreen({ navigation }: Props) {
    const [products, setProducts] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [q, setQ] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.log('Error cargando productos:', error.message);
        } else {
            setProducts((data ?? []) as unknown as Producto[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return products;
        return products.filter(p => p.nombre.toLowerCase().includes(s));
    }, [q, products]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProducts();
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: Producto }) => {
        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('ProductoDetail', { producto: item })}
                activeOpacity={0.8}
                style={{ marginBottom: 12 }}
            >
                <Card>
                    <View style={styles.rowBetween}>
                        <Text style={styles.name}>{item.nombre}</Text>
                        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                            <Text style={styles.badgeText}>{item.unidad}</Text>
                        </View>
                    </View>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sub}>Costo: {item.precio_costo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Text>
                        <Text style={styles.price}>
                            {item.precio_venta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </Text>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Productos</Text>
            <SearchBar value={q} onChangeText={setQ} placeholder="Buscar producto..." />
            <FlatList
                contentContainerStyle={{ paddingVertical: 12 }}
                data={loading ? [] : filtered}
                keyExtractor={(it) => it.id}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <Text style={styles.empty}>
                        {loading ? 'Cargando...' : 'No se encontraron productos.'}
                    </Text>
                }
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NewProducto')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    sub: {
        color: colors.subtext,
        fontSize: 14,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.primaryDark,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    badgeText: {
        color: colors.primaryDark,
        fontWeight: '600',
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.subtext,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    fabText: {
        fontSize: 32,
        color: colors.white,
        fontWeight: '300',
        marginTop: -2,
    },
});
