import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { clienteService, productoService, proveedorService, pedidoService, fechaPedidoISO, lineaDesdeFormulario, totalesPedido, NuevaLineaPedido, LineaPedidoForm } from '../services';
import { Cliente, Producto, Proveedor } from '../types/database.types';
import { useFormGuard } from '../hooks/useFormGuard';
import { SearchSelect } from '../components/SearchSelect';
import { Card } from '../components/Card';
import { FieldError } from '../components/FieldError';
import { centavosToPesos, formatCentavos, parseMoneyInput } from '../utils/money';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NewPedido'>;
type LineaVista = { key: number; data: NuevaLineaPedido; producto: string; proveedor: string; unidad: string };
const emptyLine = (): LineaPedidoForm => ({ producto_id: '', proveedor_id: '', cantidad: '1', costo: '', venta: '' });
const fechaHoy = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
};

export default function NewPedidoScreen({ navigation }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [reload, setReload] = useState(0);
  const [clienteId, setClienteId] = useState('');
  const [fecha, setFecha] = useState(fechaHoy);
  const [notas, setNotas] = useState('');
  const [draft, setDraft] = useState(emptyLine);
  const [lineas, setLineas] = useState<LineaVista[]>([]);
  const [lineError, setLineError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const busy = useRef(false);
  const nextKey = useRef(0);
  const { markSaved } = useFormGuard([clienteId, fecha, notas, draft, lineas], saving);
  const totales = totalesPedido(lineas.map(linea => linea.data));
  const productoSeleccionado = productos.find(producto => producto.id === draft.producto_id);
  const perdida = parseMoneyInput(draft.venta) < parseMoneyInput(draft.costo);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setCatalogError('');
    Promise.all([clienteService.getAll(), productoService.getAll(), proveedorService.getAll()])
      .then(([cs, ps, provs]) => { if (active) { setClientes(cs); setProductos(ps); setProveedores(provs); } })
      .catch(error => { if (active) setCatalogError(error.message || 'No se pudieron cargar los datos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]));

  // El guardado actualiza primero la protección de cambios antes de reemplazar la pantalla.
  useEffect(() => {
    if (createdId && !saving) navigation.replace('PedidoDetail', { id: createdId });
  }, [createdId, saving, navigation]);

  const changeDraft = (key: keyof LineaPedidoForm, value: string) => {
    setLineError('');
    setDraft(current => ({ ...current, [key]: value }));
  };
  const selectProducto = (id: string) => {
    const producto = productos.find(item => item.id === id);
    if (!producto) return;
    setLineError('');
    setDraft(current => ({ ...current, producto_id: id,
      costo: centavosToPesos(producto.precio_costo_centavos).toFixed(2),
      venta: centavosToPesos(producto.precio_venta_centavos).toFixed(2) }));
  };
  const addLine = () => {
    try {
      const data = lineaDesdeFormulario(draft);
      const producto = productos.find(item => item.id === data.producto_id);
      const proveedor = proveedores.find(item => item.id === data.proveedor_id);
      if (!producto || !proveedor) throw new Error('Seleccioná un producto activo y un proveedor de la lista.');
      totalesPedido([...lineas.map(linea => linea.data), data]);
      setLineas(current => [...current, { key: nextKey.current++, data, producto: producto.nombre, proveedor: proveedor.nombre, unidad: producto.unidad }]);
      setDraft({ ...emptyLine(), proveedor_id: draft.proveedor_id });
      setLineError('');
      setSaveError('');
    } catch (error: any) { setLineError(error.message); }
  };
  const save = async () => {
    if (busy.current) return;
    if (draft.producto_id) { setSaveError('Hay un producto sin agregar. Agregalo al pedido o descartá esa línea.'); return; }
    busy.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const pedido = await pedidoService.create({ pedido: { cliente_id: clienteId, fecha: fechaPedidoISO(fecha), notas },
        lineas: lineas.map(linea => linea.data) });
      markSaved();
      setCreatedId(pedido.id);
    } catch (error: any) {
      setSaveError(error.message || 'No se pudo guardar el pedido. Tus datos siguen en el formulario.');
    } finally { busy.current = false; setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nuevo pedido</Text>
        {loading && <ActivityIndicator color={colors.primary} />}
        {!!catalogError && <View><FieldError message={catalogError} /><TouchableOpacity onPress={() => setReload(value => value + 1)}><Text style={styles.link}>Reintentar carga</Text></TouchableOpacity></View>}
        {!loading && !catalogError && (!clientes.length || !productos.length || !proveedores.length) && (
          <Card>
            <Text style={styles.body}>Para crear un pedido necesitás al menos un cliente, un producto activo y un proveedor.</Text>
            {!clientes.length && <TouchableOpacity onPress={() => navigation.navigate('NewClient')}><Text style={styles.link}>Crear cliente</Text></TouchableOpacity>}
            {!productos.length && <TouchableOpacity onPress={() => navigation.navigate('NewProducto')}><Text style={styles.link}>Crear producto</Text></TouchableOpacity>}
            {!proveedores.length && <TouchableOpacity onPress={() => navigation.navigate('NewProveedor')}><Text style={styles.link}>Crear proveedor</Text></TouchableOpacity>}
          </Card>
        )}
        <SearchSelect label="Cliente" value={clienteId} disabled={saving || loading} onChange={setClienteId}
          options={clientes.map(cliente => ({ id: cliente.id, label: `${cliente.nombre}${cliente.cuil ? ` · ${cliente.cuil}` : ''}` }))} />
        <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
        <TextInput accessibilityLabel="Fecha del pedido" style={styles.input} value={fecha} onChangeText={setFecha} editable={!saving} placeholder="2026-11-02" />

        <Text style={styles.section}>Agregar producto</Text>
        <Card>
          <SearchSelect label="Producto" value={draft.producto_id} disabled={saving || loading} onChange={selectProducto}
            options={productos.map(producto => ({ id: producto.id, label: `${producto.nombre} · ${producto.unidad}` }))} />
          <SearchSelect label="Proveedor de esta línea" value={draft.proveedor_id} disabled={saving || loading} onChange={id => changeDraft('proveedor_id', id)}
            options={proveedores.map(proveedor => ({ id: proveedor.id, label: proveedor.nombre }))} />
          <Text style={styles.label}>Cantidad{productoSeleccionado ? ` (${productoSeleccionado.unidad})` : ''}</Text>
          <TextInput accessibilityLabel="Cantidad" style={styles.input} keyboardType="decimal-pad" editable={!saving} value={draft.cantidad} onChangeText={value => changeDraft('cantidad', value)} />
          <Text style={styles.label}>Precio unitario de costo ($)</Text>
          <TextInput accessibilityLabel="Precio unitario de costo" style={styles.input} keyboardType="decimal-pad" editable={!saving} value={draft.costo} onChangeText={value => changeDraft('costo', value)} />
          <Text style={styles.label}>Precio unitario de venta ($)</Text>
          <TextInput accessibilityLabel="Precio unitario de venta" style={styles.input} keyboardType="decimal-pad" editable={!saving} value={draft.venta} onChangeText={value => changeDraft('venta', value)} />
          {perdida && <FieldError message="Esta línea tiene pérdida: el precio de venta es menor al costo." />}
          <FieldError message={lineError} />
          <TouchableOpacity accessibilityRole="button" disabled={saving || loading} onPress={addLine} style={styles.secondary}><Text style={styles.link}>Agregar al pedido</Text></TouchableOpacity>
          {!!draft.producto_id && <TouchableOpacity disabled={saving} onPress={() => { setDraft(emptyLine()); setLineError(''); setSaveError(''); }}><Text style={styles.link}>Descartar esta línea</Text></TouchableOpacity>}
        </Card>

        <Text style={styles.section}>Productos del pedido ({lineas.length})</Text>
        {!lineas.length && <Text style={styles.body}>Todavía no agregaste productos.</Text>}
        {lineas.map(linea => (
          <Card key={linea.key} style={{ marginBottom: 10 }}>
            <Text style={styles.itemTitle}>{linea.producto}</Text>
            <Text style={styles.body}>{linea.data.cantidad} {linea.unidad} · {linea.proveedor}</Text>
            <Text style={styles.body}>Costo unitario: {formatCentavos(linea.data.precio_unit_costo_centavos)} · Venta unitaria: {formatCentavos(linea.data.precio_unit_venta_centavos)}</Text>
            <Text style={styles.itemTitle}>Subtotal: {formatCentavos(totalesPedido([linea.data]).venta)}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Quitar ${linea.producto}`} disabled={saving} onPress={() => setLineas(current => current.filter(item => item.key !== linea.key))}><Text style={styles.remove}>Quitar</Text></TouchableOpacity>
          </Card>
        ))}
        <Card>
          <Text style={styles.body}>Costo total: {formatCentavos(totales.costo)}</Text>
          <Text style={styles.title}>Total: {formatCentavos(totales.venta)}</Text>
          <Text style={[styles.itemTitle, { color: totales.ganancia < 0 ? colors.danger : colors.primary }]}>Ganancia: {formatCentavos(totales.ganancia)}</Text>
        </Card>
        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput accessibilityLabel="Notas del pedido" style={[styles.input, { minHeight: 80 }]} multiline editable={!saving} value={notas} onChangeText={setNotas} />
        <FieldError message={saveError} />
        {!clienteId && <Text style={styles.body}>Seleccioná un cliente para guardar.</Text>}
        {!!draft.producto_id && <Text style={styles.body}>Agregá o descartá el producto en preparación antes de guardar.</Text>}
        <TouchableOpacity accessibilityRole="button" disabled={saving || loading || !!catalogError || !clienteId || !lineas.length || !!draft.producto_id}
          onPress={save} style={[styles.primary, { opacity: saving || loading || !!catalogError || !clienteId || !lineas.length || !!draft.producto_id ? 0.5 : 1 }]}>
          <Text style={styles.primaryText}>{saving ? 'Guardando…' : 'Guardar pedido'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48, maxWidth: 850, width: '100%', alignSelf: 'center' },
  title: { fontSize: 23, fontWeight: '700', color: colors.text, marginVertical: 8 },
  section: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 },
  label: { fontWeight: '600', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: colors.white, color: colors.text, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12 },
  body: { color: colors.subtext, lineHeight: 22, marginVertical: 4 },
  itemTitle: { color: colors.text, fontWeight: '700', marginVertical: 4 },
  link: { color: colors.primary, fontWeight: '700', paddingVertical: 10 },
  remove: { color: colors.danger, fontWeight: '700', paddingVertical: 10 },
  secondary: { marginTop: 16, alignItems: 'center', borderColor: colors.primary, borderWidth: 1, borderRadius: 10 },
  primary: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
