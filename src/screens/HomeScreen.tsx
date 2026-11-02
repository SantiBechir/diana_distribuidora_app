import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { pedidoRepository } from '../repositories';
import { PedidoConCliente } from '../types/database.types';
import { formatCentavos } from '../utils/money';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { QuickAccessCard } from '../components/QuickAccessCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPedidos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await pedidoRepository.getAll();
      setPedidos(data.slice(0, 10));
    } catch (error: any) {
      setError(error?.message || 'No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPedidos();
    }, [fetchPedidos])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPedidos();
    setRefreshing(false);
  };

  const onNuevoPedido = () => {
    navigation.navigate('NewPedido');
  };

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Accesos rápidos */}
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <View style={styles.grid}>
              <QuickAccessCard
                title="Clientes"
                icon="👥"
                color={colors.primary}
                onPress={() => navigation.navigate('ClientsList')}
              />
              <QuickAccessCard
                title="Productos"
                icon="📦"
                color={colors.info}
                onPress={() => navigation.navigate('ProductosList')}
              />
            </View>
            <View style={styles.grid}>
              <QuickAccessCard
                title="Proveedores"
                icon="🚚"
                color={colors.warning}
                onPress={() => navigation.navigate('ProveedoresList')}
              />
              <QuickAccessCard
                title="Pagos"
                icon="💰"
                color="#8B5CF6"
                onPress={() => Alert.alert('Próximamente', 'Módulo de pagos planificado para la Fase 5')}
              />
            </View>

            {/* Últimos pedidos */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Últimos pedidos</Text>
            {!!error && <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}
          </>
        }
        data={loading ? [] : pedidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const estadoColor =
            item.estado === 'Pagado'
              ? colors.primary
              : item.estado === 'Impago'
                ? colors.danger
                : colors.warning;

          return (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver pedido de ${item.cliente.nombre}`}
              onPress={() => navigation.navigate('PedidoDetail', { id: item.id })}>
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clienteName}>{item.cliente?.nombre ?? 'Sin cliente'}</Text>
                  <Text style={styles.date}>
                    {new Date(item.fecha).toLocaleDateString('es-AR')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.total}>
                    {formatCentavos(item.total_centavos)}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: estadoColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: estadoColor }]}>{item.estado}</Text>
                  </View>
                </View>
              </View>
            </Card>
            </TouchableOpacity>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Cargando pedidos...' : 'No hay pedidos registrados.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Botón flotante */}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Nuevo pedido" style={styles.fab} onPress={onNuevoPedido} activeOpacity={0.9}>
        <Text style={styles.fabText}>＋</Text>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  clienteName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.subtext,
    marginTop: 2,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.subtext,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '600',
  },
});
