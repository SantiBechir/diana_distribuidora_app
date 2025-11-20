import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Proveedor } from '../types/database.types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProveedoresList'>;

export default function ProveedoresListScreen({ navigation }: Props) {
    const [providers, setProviders] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [q, setQ] = useState('');

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('proveedores')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.log('Error cargando proveedores:', error.message);
        } else {
            setProviders((data ?? []) as unknown as Proveedor[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return providers;
        return providers.filter(p => p.nombre.toLowerCase().includes(s));
    }, [q, providers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProviders();
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: Proveedor }) => {
        const saldoColor = item.saldo > 0 ? colors.danger : colors.primary;

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('ProveedorDetail', { proveedor: item })}
                activeOpacity={0.8}
                style={{ marginBottom: 12 }}
            >
                <Card>
                    <View style={styles.rowBetween}>
                        <Text style={styles.name}>{item.nombre}</Text>
                        <Text style={[styles.saldo, { color: saldoColor }]}>
                            {item.saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </Text>
                    </View>
                    <Text style={styles.sub}>{item.direccion ?? 'Sin dirección'}</Text>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Proveedores</Text>
            <SearchBar value={q} onChangeText={setQ} placeholder="Buscar proveedor..." />
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
                        {loading ? 'Cargando...' : 'No se encontraron proveedores.'}
                    </Text>
                }
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('NewProveedor')}
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
        marginTop: 4,
    },
    saldo: {
        fontSize: 16,
        fontWeight: '700',
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
