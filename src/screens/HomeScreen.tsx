import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { PedidoRepository } from '../repositories/PedidoRepository';
import { PedidoCompleto } from '../types/database.types';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { FAB } from '../components/FAB';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [recentOrders, setRecentOrders] = useState<PedidoCompleto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const orders = await PedidoRepository.getAll();
      setRecentOrders(orders.slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const QuickAccessCard = ({ title, icon, route, color }: any) => (
    <TouchableOpacity
      style={[styles.quickAccessCard, { backgroundColor: color }]}
      onPress={() => navigation.navigate(route)}
    >
      <Ionicons name={icon} size={32} color={colors.white} />
      <Text style={styles.quickAccessTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.grid}>
          <QuickAccessCard title="Clientes" icon="people" route="ClientsList" color={colors.info} />
          <QuickAccessCard title="Productos" icon="nutrition" route="ProductsList" color={colors.warning} />
          <QuickAccessCard title="Proveedores" icon="business" route="ProveedoresList" color={colors.subtext} />
          <QuickAccessCard title="Pagos" icon="cash" route="PagosClientes" color={colors.success} />
        </View>

        <Text style={styles.sectionTitle}>Últimos Pedidos</Text>

        {recentOrders.map((order) => (
          <Card key={order.id} style={styles.orderCard}>
            <TouchableOpacity onPress={() => navigation.navigate('PedidoDetail', { id: order.id })}>
              <View style={styles.orderHeader}>
                <Text style={styles.clientName}>{order.cliente.nombre}</Text>
                <Text style={styles.orderTotal}>${order.total.toFixed(2)}</Text>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{new Date(order.fecha).toLocaleDateString()}</Text>
                <Badge
                  label={order.estado}
                  variant={order.estado === 'Pagado' ? 'success' : order.estado === 'Impago' ? 'danger' : 'warning'}
                />
              </View>
            </TouchableOpacity>
          </Card>
        ))}

        {recentOrders.length === 0 && (
          <Text style={styles.emptyText}>No hay pedidos recientes</Text>
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('NewPedido')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAccessCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1.2,
    elevation: 4,
  },
  quickAccessTitle: {
    color: colors.white,
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    color: colors.subtext,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.subtext,
    marginTop: 20,
  },
});
