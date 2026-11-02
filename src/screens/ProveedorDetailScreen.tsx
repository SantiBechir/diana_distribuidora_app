import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Proveedor, PagoProveedor } from '../types/database.types';
import { proveedorService } from '../services';
import { pagoProveedorRepository } from '../repositories';
import { formatCentavos } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProveedorDetail'>;

export default function ProveedorDetailScreen({ route, navigation }: Props) {
  const initialProveedor = route.params.proveedor;
  const [proveedor, setProveedor] = useState<Proveedor>(initialProveedor);
  const [pagos, setPagos] = useState<PagoProveedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Recargar datos del proveedor y pagos cada vez que recibe el foco
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        try {
          const [updatedProveedor, pagosList] = await Promise.all([
            proveedorService.getById(initialProveedor.id),
            pagoProveedorRepository.getByProveedor(initialProveedor.id),
          ]);

          if (isMounted) {
            if (updatedProveedor) {
              setProveedor(updatedProveedor);
              navigation.setOptions({ title: updatedProveedor.nombre });
            }
            setPagos(pagosList);
            setLoading(false);
          }
        } catch (err: any) {
          console.log('Error recargando proveedor:', err?.message || err);
          if (isMounted) setLoading(false);
        }
      };

      load();
      return () => {
        isMounted = false;
      };
    }, [initialProveedor.id, navigation])
  );

  return (
    <View style={styles.container}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.heading}>Información del Proveedor</Text>
        <Text style={styles.label}>
          Teléfono: <Text style={styles.value}>{proveedor.telefono ?? 'No informado'}</Text>
        </Text>
        <Text style={styles.label}>
          Dirección: <Text style={styles.value}>{proveedor.direccion ?? 'No informada'}</Text>
        </Text>

        <View
          style={[
            styles.pill,
            {
              backgroundColor: proveedor.saldo_centavos > 0 ? '#FEE2E2' : '#DCFCE7',
              alignSelf: 'flex-start',
              marginTop: 12,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: proveedor.saldo_centavos > 0 ? colors.danger : colors.primaryDark },
            ]}
          >
            {proveedor.saldo_centavos > 0
              ? `Deuda: ${formatCentavos(proveedor.saldo_centavos)}`
              : 'Al día'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProveedor', { proveedor })}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Editar Proveedor</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Pagos registrados</Text>
      <FlatList
        data={loading ? [] : pagos}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.itemTitle}>
                {new Date(item.fecha).toLocaleDateString('es-AR')}
              </Text>
              <Text style={styles.itemAmount}>
                {formatCentavos(item.monto_centavos)}
              </Text>
            </View>
            {item.metodo_pago ? (
              <Text style={styles.subtext}>Método: {item.metodo_pago}</Text>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 12 }}>
            {loading ? 'Cargando pagos...' : 'Este proveedor no tiene pagos registrados.'}
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
  subtext: { color: colors.subtext, fontSize: 12, marginTop: 4 },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontWeight: '600', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemAmount: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
});
