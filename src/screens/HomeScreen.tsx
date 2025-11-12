import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { QuickAccessCard } from '../components/QuickAccessCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type PedidoConCliente = {
  id: string;
  fecha: string;
  total: number;
  estado: string;
  cliente: { nombre: string };
};

export default function HomeScreen({ navigation }: Props) {
  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, fecha, total, estado, cliente:clientes(nombre)')
      .order('fecha', { ascending: false })
      .limit(10);

    if (error) {
      console.log('Error cargando pedidos:', error.message);
    } else {
      setPedidos((data ?? []) as unknown as PedidoConCliente[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPedidos();
    setRefreshing(false);
  };

  const onNuevoPedido = () => {
    Alert.alert('Próximamente', 'Pantalla de nuevo pedido en desarrollo');
    // navigation.navigate('NewPedido');
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
                onPress={() => Alert.alert('Próximamente', 'Pantalla de productos')}
              />
            </View>
            <View style={styles.grid}>
              <QuickAccessCard
                title="Proveedores"
                icon="🚚"
                color={colors.warning}
                onPress={() => Alert.alert('Próximamente', 'Pantalla de proveedores')}
              />
              <QuickAccessCard
                title="Pagos"
                icon="💰"
                color="#8B5CF6"
                onPress={() => Alert.alert('Próximamente', 'Pantalla de pagos')}
              />
            </View>

            {/* Últimos pedidos */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Últimos pedidos</Text>
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
                    {item.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: estadoColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: estadoColor }]}>{item.estado}</Text>
                  </View>
                </View>
              </View>
            </Card>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Cargando...' : 'No hay pedidos registrados.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Botón flotante */}
      <TouchableOpacity style={styles.fab} onPress={onNuevoPedido} activeOpacity={0.9}>
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