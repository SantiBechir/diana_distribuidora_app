import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { clienteService } from '../services';
import { matchesCliente } from '../utils/clientSearch';
import { Cliente } from '../types/database.types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { formatCentavos } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientsList'>;

export default function ClientsListScreen({ navigation }: Props) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll();
      setClients(data);
    } catch (error: any) {
      console.log('Error cargando clientes:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresca automáticamente al recibir el foco (al volver de crear o editar)
  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [fetchClients])
  );

  // Búsqueda por coincidencia en nombre o CUIL
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(c => matchesCliente(c, s));
  }, [q, clients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Cliente }) => {
    const saldoColor =
      item.saldo_centavos > 0 ? colors.danger : item.saldo_centavos < 0 ? colors.info : colors.primary;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ClientDetail', { cliente: item })}
        activeOpacity={0.8}
        style={{ marginBottom: 12 }}
      >
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{item.nombre}</Text>
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.badgeText}>{item.tipo}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {item.cuil ? (
              <Text style={styles.cuilBadge}>CUIL: {item.cuil}</Text>
            ) : null}
            <Text style={styles.sub}>{item.telefono ?? 'Sin teléfono'}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.address} numberOfLines={1}>{item.direccion ?? 'Sin dirección'}</Text>
            <Text style={[styles.saldo, { color: saldoColor }]}>
              {formatCentavos(item.saldo_centavos)}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      <SearchBar
        value={q}
        onChangeText={setQ}
        placeholder="Buscar por nombre o CUIL..."
      />
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
            {loading ? 'Cargando clientes...' : 'No se encontraron clientes.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Botón flotante para agregar nuevo cliente */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewClient')}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  cuilBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  sub: {
    color: colors.subtext,
    fontSize: 13,
  },
  address: {
    color: colors.subtext,
    fontSize: 13,
    flex: 1,
  },
  saldo: {
    fontSize: 16,
    fontWeight: '700',
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
