import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { productoService } from '../services';
import { Producto } from '../types/database.types';
import { colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { formatCentavos } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductosList'>;
type FilterTab = 'activos' | 'archivados' | 'todos';

export default function ProductosListScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<FilterTab>('activos');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Traemos todos los productos (incluyendo archivados) para poder filtrar en pestañas
      const data = await productoService.getAll(true);
      setProducts(data);
    } catch (error: any) {
      console.log('Error cargando productos:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga automática al volver de crear, editar o archivar
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const filtered = useMemo(() => {
    let list = products;

    // Filtro por pestaña de estado
    if (tab === 'activos') {
      list = list.filter(p => p.activo);
    } else if (tab === 'archivados') {
      list = list.filter(p => !p.activo);
    }

    // Búsqueda por nombre
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(p => p.nombre.toLowerCase().includes(s));
  }, [q, tab, products]);

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
        <Card style={!item.activo ? styles.cardArchived : undefined}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.name, !item.activo && styles.textArchived]}>
                {item.nombre}
              </Text>
              {!item.activo && (
                <View style={[styles.badge, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={[styles.badgeText, { color: '#6B7280' }]}>Archivado</Text>
                </View>
              )}
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={styles.badgeText}>{item.unidad}</Text>
            </View>
          </View>

          {item.descripcion ? (
            <Text style={styles.desc} numberOfLines={1}>{item.descripcion}</Text>
          ) : null}

          <View style={[styles.rowBetween, { marginTop: 8 }]}>
            <Text style={styles.sub}>
              Costo: {formatCentavos(item.precio_costo_centavos)}
            </Text>
            <Text style={[styles.price, !item.activo && styles.textArchived]}>
              {formatCentavos(item.precio_venta_centavos)}
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

      {/* Pestañas de filtro Activos / Archivados / Todos */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setTab('activos')}
          style={[styles.tabButton, tab === 'activos' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'activos' && styles.tabTextActive]}>
            Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('archivados')}
          style={[styles.tabButton, tab === 'archivados' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'archivados' && styles.tabTextActive]}>
            Archivados
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('todos')}
          style={[styles.tabButton, tab === 'todos' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, tab === 'todos' && styles.tabTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>

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
            {loading ? 'Cargando productos...' : 'No se encontraron productos.'}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    marginTop: 10,
    marginBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subtext,
  },
  tabTextActive: {
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  desc: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 3,
  },
  sub: {
    color: colors.subtext,
    fontSize: 13,
  },
  price: {
    fontSize: 17,
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
  cardArchived: {
    opacity: 0.75,
    backgroundColor: '#F9FAFB',
  },
  textArchived: {
    color: '#6B7280',
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
