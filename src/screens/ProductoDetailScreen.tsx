import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Producto } from '../types/database.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductoDetail'>;

export default function ProductoDetailScreen({ route, navigation }: Props) {
    const { producto } = route.params;

    useEffect(() => {
        navigation.setOptions({ title: producto.nombre });
    }, [producto.nombre, navigation]);

    const onEditar = () => {
        navigation.navigate('EditProducto', { producto });
    };

    const onEliminar = () => {
        Alert.alert('Confirmar', '¿Estás seguro de eliminar este producto?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: () => Alert.alert('Info', 'Eliminar (demo)') },
        ]);
    };

    return (
        <View style={styles.container}>
            <Card>
                <View style={styles.header}>
                    <Text style={styles.title}>{producto.nombre}</Text>
                    <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={styles.badgeText}>{producto.unidad}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Precio Costo:</Text>
                    <Text style={styles.value}>
                        {producto.precio_costo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Precio Venta:</Text>
                    <Text style={[styles.value, { color: colors.primaryDark, fontSize: 20 }]}>
                        {producto.precio_venta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={onEditar} style={[styles.button, { backgroundColor: colors.info }]}>
                        <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onEliminar} style={[styles.button, { backgroundColor: colors.danger }]}>
                        <Text style={styles.buttonText}>Eliminar</Text>
                    </TouchableOpacity>
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    badge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: 8,
    },
    badgeText: {
        color: colors.primaryDark,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    label: {
        fontSize: 16,
        color: colors.subtext,
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
});
