import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Cliente, PedidoConCliente } from '../types/database.types';
import { clienteService } from '../services';
import { pedidoRepository } from '../repositories';
import { formatCentavos } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetail'>;

export default function ClientDetailScreen({ route, navigation }: Props) {
  const initialCliente = route.params.cliente;
  const [cliente, setCliente] = useState<Cliente>(initialCliente);
  const [pedidos, setPedidos] = useState<PedidoConCliente[]>([]);
  const [loading, setLoading] = useState(true);

  // Recargar cliente y pedidos cada vez que la pantalla recibe el foco (ej. tras editar)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        try {
          const [updatedClient, clientPedidos] = await Promise.all([
            clienteService.getById(initialCliente.id),
            pedidoRepository.getByCliente(initialCliente.id),
          ]);

          if (isMounted) {
            if (updatedClient) {
              setCliente(updatedClient);
              navigation.setOptions({ title: updatedClient.nombre });
            }
            setPedidos(clientPedidos);
            setLoading(false);
          }
        } catch (error: any) {
          console.log('Error recargando detalle de cliente:', error?.message || error);
          if (isMounted) setLoading(false);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [initialCliente.id, navigation])
  );

  const totalAdeudado = cliente.saldo_centavos > 0 ? cliente.saldo_centavos : 0;
  const tieneCredito = cliente.saldo_centavos < 0;

  return (
    <View style={styles.container}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.heading}>Información del Cliente</Text>
        <Text style={styles.label}>CUIL: <Text style={styles.value}>{cliente.cuil ?? 'No informado'}</Text></Text>
        <Text style={styles.label}>Email: <Text style={styles.value}>{cliente.mail ?? 'No informado'}</Text></Text>
        <Text style={styles.label}>Teléfono: <Text style={styles.value}>{cliente.telefono ?? 'No informado'}</Text></Text>
        <Text style={styles.label}>Dirección: <Text style={styles.value}>{cliente.direccion ?? 'No informada'}</Text></Text>

        {cliente.notas ? (
          <View style={styles.notasContainer}>
            <Text style={styles.label}>Notas:</Text>
            <Text style={styles.notasText}>{cliente.notas}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={[styles.pill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.pillText, { color: colors.primaryDark }]}>{cliente.tipo}</Text>
          </View>
          <View
            style={[
              styles.pill,
              {
                backgroundColor:
                  totalAdeudado > 0 ? '#FEE2E2' : tieneCredito ? '#E0F2FE' : '#DCFCE7',
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    totalAdeudado > 0
                      ? colors.danger
                      : tieneCredito
                        ? colors.info
                        : colors.primaryDark,
                },
              ]}
            >
              {totalAdeudado > 0
                ? `Deuda: ${formatCentavos(cliente.saldo_centavos)}`
                : tieneCredito
                  ? `Crédito a favor: ${formatCentavos(Math.abs(cliente.saldo_centavos))}`
                  : 'Al día'}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditClient', { cliente })}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Editar Cliente</Text>
          </TouchableOpacity>
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
              {formatCentavos(item.total_centavos)}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 12 }}>
            {loading ? 'Cargando pedidos...' : 'Este cliente no tiene pedidos registrados.'}
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
  heading: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 10 },
  label: { color: colors.subtext, marginBottom: 5, fontSize: 14 },
  value: { color: colors.text, fontWeight: '600' },
  notasContainer: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  notasText: { color: colors.text, fontStyle: 'italic', fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemAmount: { marginTop: 6, fontSize: 16, fontWeight: '700', color: colors.primaryDark },
});