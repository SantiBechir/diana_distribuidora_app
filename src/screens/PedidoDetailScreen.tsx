import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { pedidoService } from '../services';
import { PedidoCompleto } from '../types/database.types';
import { Card } from '../components/Card';
import { FieldError } from '../components/FieldError';
import { formatCentavos } from '../utils/money';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'PedidoDetail'>;

export default function PedidoDetailScreen({ route }: Props) {
  const [pedido, setPedido] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    pedidoService.getById(route.params.id).then(data => {
      if (active) { setPedido(data); if (!data) setError('No se encontró el pedido.'); }
    }).catch(err => { if (active) setError(err.message || 'No se pudo cargar el pedido.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [route.params.id, reload]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading ? <ActivityIndicator color={colors.primary} /> : error ? <>
        <FieldError message={error} />
        <TouchableOpacity onPress={() => setReload(value => value + 1)}><Text style={styles.link}>Reintentar</Text></TouchableOpacity>
      </> : pedido && <>
        <Text style={styles.title}>Pedido #{pedido.numero_pedido ?? pedido.id.slice(0, 8)}</Text>
        <Card>
          <Text style={styles.heading}>{pedido.cliente.nombre}</Text>
          <Text style={styles.text}>{new Date(pedido.fecha).toLocaleDateString('es-AR')} · {pedido.estado}</Text>
          {!!pedido.notas && <Text style={styles.text}>{pedido.notas}</Text>}
        </Card>
        <Text style={styles.heading}>Productos</Text>
        {pedido.pedido_lineas.map(linea => <Card key={linea.id} style={{ marginBottom: 10 }}>
          <Text style={styles.heading}>{linea.producto.nombre}</Text>
          <Text style={styles.text}>{linea.cantidad} {linea.producto.unidad} · {linea.proveedor?.nombre}</Text>
          <Text style={styles.text}>Costo unitario: {formatCentavos(linea.precio_unit_costo_centavos)}</Text>
          <Text style={styles.text}>Venta unitaria: {formatCentavos(linea.precio_unit_venta_centavos)}</Text>
          <Text style={styles.heading}>Subtotal: {formatCentavos(linea.subtotal_venta_centavos)}</Text>
        </Card>)}
        <Card>
          <Text style={styles.text}>Costo total: {formatCentavos(pedido.total_costo_centavos)}</Text>
          <Text style={styles.title}>Total: {formatCentavos(pedido.total_centavos)}</Text>
          <Text style={styles.heading}>Ganancia: {formatCentavos(pedido.total_centavos - pedido.total_costo_centavos)}</Text>
          <Text style={styles.text}>Cobrado: {formatCentavos(pedido.pagos_clientes.reduce((sum, pago) => sum + pago.monto_centavos, 0))}</Text>
        </Card>
      </>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, maxWidth: 850, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginVertical: 12 },
  heading: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: 10 },
  text: { color: colors.subtext, lineHeight: 24 },
  link: { color: colors.primary, paddingVertical: 16, fontWeight: '700' },
});
