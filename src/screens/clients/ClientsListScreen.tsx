import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ClienteRepository } from '../../repositories/ClienteRepository';
import { Cliente } from '../../types/database.types';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';
import { Badge } from '../../components/Badge';

export const ClientsListScreen = () => {
    const navigation = useNavigation<any>();
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadClients = async () => {
        try {
            const data = search
                ? await ClienteRepository.search(search)
                : await ClienteRepository.getAll();
            setClients(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadClients();
        }, [search])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadClients();
    };

    const renderItem = ({ item }: { item: Cliente }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.nombre}</Text>
                    {item.mail && <Text style={styles.subtext}>{item.mail}</Text>}
                    <View style={styles.badges}>
                        <Badge label={item.tipo} variant="info" />
                        {item.saldo !== 0 && (
                            <Badge
                                label={`$${item.saldo.toFixed(2)}`}
                                variant={item.saldo > 0 ? 'danger' : 'success'}
                                color={item.saldo > 0 ? colors.danger : colors.success}
                            />
                        )}
                    </View>
                </View>
                <Text
                    style={[styles.saldo, { color: item.saldo > 0 ? colors.danger : colors.success }]}
                    onPress={() => navigation.navigate('ClientDetail', { id: item.id })}
                >
                    Ver Detalle
                </Text>
            </View>
        </Card>
    );

    if (loading && !refreshing) return <LoadingSpinner />;

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Input
                    placeholder="Buscar por nombre o CUIL..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={clients}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron clientes</Text>}
            />
            <FAB onPress={() => navigation.navigate('NewClient')} />
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
    subtext: {
        fontSize: 14,
        color: colors.subtext,
        marginBottom: 8,
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
    },
    saldo: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.subtext,
        fontSize: 16,
    },
});
