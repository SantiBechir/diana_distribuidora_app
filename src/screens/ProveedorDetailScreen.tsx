import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Proveedor, PagoProveedor } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProveedorDetail'>;

export default function ProveedorDetailScreen({ route, navigation }: Props) {
    const { proveedor } = route.params;
    const [pagos, setPagos] = useState<PagoProveedor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        navigation.setOptions({ title: proveedor.nombre });
    }, [proveedor.nombre, navigation]);

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from('pagos_proveedores')
                .select('*')
                .eq('proveedor_id', proveedor.id)
                .order('fecha', { ascending: false })
                .limit(20);
            if (error) console.log(error.message);
            setPagos((data ?? []) as unknown as PagoProveedor[]);
            setLoading(false);
        })();
    }, [proveedor.id]);

    const onRegistrarPago = () => {
        Alert.alert('Acción', 'Registrar pago (demo)');
    };

    return (
        <View style={styles.container}>
            <Card style={{ marginBottom: 12 }}>
                <Text style={styles.heading}>Información</Text>
                <Text style={styles.label}>Dirección: <Text style={styles.value}>{proveedor.direccion ?? '-'}</Text></Text>

                <View style={[styles.pill, { backgroundColor: proveedor.saldo > 0 ? '#FEE2E2' : '#DCFCE7', alignSelf: 'flex-start', marginTop: 12 }]}>
                    <Text style={[styles.pillText, { color: proveedor.saldo > 0 ? colors.danger : colors.primaryDark }]}>
                        Saldo: {proveedor.saldo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditProveedor', { proveedor })} style={[styles.button, { backgroundColor: colors.info }]}>
                        <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onRegistrarPago} style={[styles.button, { backgroundColor: colors.primary }]}>
                        <Text style={styles.buttonText}>Registrar Pago</Text>
                    </TouchableOpacity>
                </View>
            </Card>

            <Text style={styles.sectionTitle}>Pagos recientes</Text>
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
                                {item.monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                            </Text>
                        </View>
                    </Card>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 8 }}>
                        {loading ? 'Cargando...' : 'Este proveedor no tiene pagos registrados.'}
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
    pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    pillText: { fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    button: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: colors.white, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    itemAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
});
