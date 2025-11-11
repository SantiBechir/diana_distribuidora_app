import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Cliente, Pedido } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  ClientsList: undefined;
  ClientDetail: { cliente: Cliente };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetail'>;

export default function ClientDetailScreen({ route, navigation }: Props) {
  const { cliente } = route.params;
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: cliente.nombre });
  }, [cliente.nombre, navigation]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .limit(20);
      if (error) console.log(error.message);
      setPedidos((data ?? []) as unknown as Pedido[]);
      setLoading(false);
    })();
  }, [cliente.id]);

  const onRegistrarPago = () => {
    // Por ahora solo demo de UI
    Alert.alert('Acción', 'Registrar pago (demo)');
  };

  const onNuevoPedido = () => {
    Alert.alert('Acción', 'Nuevo pedido (demo)');
  };

  const totalAdeudado = Math.max(cliente.saldo, 0);

  return (
    <View style={styles.container}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.heading}>Información</Text>
        <Text style={styles.label}>CUIL: <Text style={styles.value}>{cliente.cuil ?? '-'}</Text></Text>
        <Text style={styles.label}>Email: <Text style={styles.value}>{cliente.mail ?? '-'}</Text></Text>
        <Text style={styles.label}>Teléfono: <Text style={styles.value}>{cliente.telefono ?? '-'}</Text></Text>
        <Text style={styles.label}>Dirección: <Text style={styles.value}>{cliente.direccion ?? '-'}</Text></Text>

        <View style={styles.row}>
          <View style={[styles.pill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.pillText, { color: colors.primaryDark }]}>{cliente.tipo}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: totalAdeudado > 0 ? '#FEE2E2' : '#DCFCE7' }]}>
            <Text style={[styles.pillText, { color: totalAdeudado > 0 ? colors.danger : colors.primaryDark }]}>
              Saldo: {cliente.saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onRegistrarPago} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Registrar pago</Text>
          </TouchableOpacity>
          {/* Comentado: botón "Nuevo pedido" deshabilitado temporalmente
          <TouchableOpacity onPress={onNuevoPedido} style={[styles.button, { backgroundColor: colors.info }]}>
            <Text style={styles.buttonText}>Nuevo pedido</Text>
          </TouchableOpacity>
          */}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Pedidos recientes</Text>
      <FlatList
        data={loading ? [] : pedidos}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>
                {new Date(item.fecha).toLocaleDateString('es-AR')}
              </Text>
              <View style={[styles.pill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.pillText, { color: colors.primaryDark }]}>{item.estado}</Text>
              </View>
            </View>
            <Text style={styles.itemAmount}>
              {item.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 8 }}>
            {loading ? 'Cargando...' : 'Este cliente no tiene pedidos.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  label: { color: colors.subtext, marginBottom: 4 },
  value: { color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemAmount: { marginTop: 6, fontSize: 16, fontWeight: '700', color: colors.text },
});