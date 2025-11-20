import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { Cliente } from '../types/database.types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  ClientsList: undefined;
  ClientDetail: { cliente: Cliente };
  NewClient: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ClientsList'>;

export default function ClientsListScreen({ navigation }: Props) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.log('Error cargando clientes:', error.message);
    } else {
      setClients((data ?? []) as unknown as Cliente[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter(c => c.nombre.toLowerCase().includes(s));
  }, [q, clients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Cliente }) => {
    const saldoColor =
      item.saldo > 0 ? colors.danger : item.saldo < 0 ? colors.info : colors.primary;

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
          <View style={styles.rowBetween}>
            <Text style={styles.sub}>{item.telefono ?? 'Sin teléfono'}</Text>
            <Text style={[styles.saldo, { color: saldoColor }]}>
              {item.saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>
      <SearchBar value={q} onChangeText={setQ} placeholder="Buscar por nombre..." />
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
            {loading ? 'Cargando...' : 'No se encontraron clientes.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Botón flotante para agregar cliente */}
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
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sub: {
    color: colors.subtext,
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