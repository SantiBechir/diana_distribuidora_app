import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PedidoRepository } from '../../repositories/PedidoRepository';
import { PedidoCompleto } from '../../types/database.types';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';
import { Badge } from '../../components/Badge';

export const PedidosListScreen = () => {
    const navigation = useNavigation<any>();
    const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'Todos' | 'Pagado' | 'Impago' | 'Parcial'>('Todos');

    const loadPedidos = async () => {
        try {
            const data = search
                ? await PedidoRepository.search(search)
                : await PedidoRepository.getAll();

            const filtered = filter === 'Todos'
                ? data
                : data.filter(p => p.estado === (filter === 'Parcial' ? 'Pagado Parcialmente' : filter));

            setPedidos(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPedidos();
        }, [search, filter])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadPedidos();
    };

    const renderItem = ({ item }: { item: PedidoCompleto }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.info}>
                    <Text style={styles.clientName}>{item.cliente.nombre}</Text>
                    <Text style={styles.date}>{new Date(item.fecha).toLocaleDateString()}</Text>
                    <View style={styles.badges}>
                        <Badge
                            label={item.estado}
                            variant={item.estado === 'Pagado' ? 'success' : item.estado === 'Impago' ? 'danger' : 'warning'}
                        />
                    </View>
                </View>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
                    <Text
                        style={styles.actionLink}
                        onPress={() => navigation.navigate('PedidoDetail', { id: item.id })}
                    >
                        Ver Detalle
                    </Text>
                </View>
            </View>
        </Card>
    );

    if (loading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Input
                    placeholder="Buscar por cliente..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
                <View style={styles.filters}>
                    {['Todos', 'Pagado', 'Impago', 'Parcial'].map(f => (
                        <Text
                            key={f}
                            style={[styles.filterTab, filter === f && styles.activeFilter]}
                            onPress={() => setFilter(f as any)}
                        >
                            {f}
                        </Text>
                    ))}
                </View>
            </View>

            <FlatList
                data={pedidos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron pedidos</Text>}
            />
            <FAB onPress={() => navigation.navigate('NewPedido')} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInput: {
        margin: 16,
        marginBottom: 8,
    },
    filters: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingBottom: 12,
    },
    filterTab: {
        color: colors.subtext,
        fontWeight: '600',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    activeFilter: {
        color: colors.primary,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
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
    },
    info: {
        flex: 1,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 8,
    },
    badges: {
        flexDirection: 'row',
    },
    totalContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    totalLabel: {
        fontSize: 12,
        color: colors.subtext,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
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
