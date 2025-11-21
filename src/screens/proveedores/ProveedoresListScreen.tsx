import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ProveedorRepository } from '../../repositories/ProveedorRepository';
import { Proveedor } from '../../types/database.types';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { Input } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors } from '../../theme/colors';
import { Badge } from '../../components/Badge';

export const ProveedoresListScreen = () => {
    const navigation = useNavigation<any>();
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadProveedores = async () => {
        try {
            const data = search
                ? await ProveedorRepository.search(search)
                : await ProveedorRepository.getAll();
            setProveedores(data);
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
        }, [search])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadProveedores();
    };

    const renderItem = ({ item }: { item: Proveedor }) => (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.nombre}</Text>
                    {item.direccion && <Text style={styles.subtext}>{item.direccion}</Text>}
                </View>
                <View style={styles.balance}>
                    {item.saldo !== 0 && (
                        <Badge
                            label={`$${item.saldo.toFixed(2)}`}
                            variant={item.saldo > 0 ? 'danger' : 'success'}
                            color={item.saldo > 0 ? colors.danger : colors.success}
                        />
                    )}
                </View>
                <Text
                    style={styles.actionLink}
                    onPress={() => navigation.navigate('ProveedorDetail', { id: item.id })}
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
                    placeholder="Buscar proveedor..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={proveedores}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron proveedores</Text>}
            />
            <FAB onPress={() => navigation.navigate('NewProveedor')} />
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
    },
    balance: {
        marginRight: 16,
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
