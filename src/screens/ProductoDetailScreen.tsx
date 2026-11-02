import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Producto } from '../types/database.types';
import { productoService } from '../services';
import { formatCentavos } from '../utils/money';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductoDetail'>;

export default function ProductoDetailScreen({ route, navigation }: Props) {
  const initialProducto = route.params.producto;
  const [producto, setProducto] = useState<Producto>(initialProducto);
  const [loadingAction, setLoadingAction] = useState(false);

  // Recargar producto cada vez que recibe foco (ej. tras editar)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const load = async () => {
        try {
          const updated = await productoService.getById(initialProducto.id);
          if (isMounted && updated) {
            setProducto(updated);
            navigation.setOptions({ title: updated.nombre });
          }
        } catch (err: any) {
          console.log('Error recargando producto:', err?.message || err);
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [initialProducto.id, navigation])
  );

  const onEditar = () => {
    navigation.navigate('EditProducto', { producto });
  };

  const onArchivar = () => {
    Alert.alert(
      'Confirmar archivado',
      `¿Deseas archivar "${producto.nombre}"?\n\nEl producto ya no estará disponible para nuevos pedidos, pero se conservará en el historial de pedidos existentes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingAction(true);
              await productoService.archive(producto.id);
              const updated = await productoService.getById(producto.id);
              if (updated) setProducto(updated);
              Alert.alert('Éxito', 'El producto ha sido archivado.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo archivar el producto.');
            } finally {
              setLoadingAction(false);
            }
          },
        },
      ]
    );
  };

  const onRestaurar = () => {
    Alert.alert(
      'Restaurar producto',
      `¿Deseas reactivar "${producto.nombre}" para volver a incluirlo en pedidos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          onPress: async () => {
            try {
              setLoadingAction(true);
              await productoService.restore(producto.id);
              const updated = await productoService.getById(producto.id);
              if (updated) setProducto(updated);
              Alert.alert('Éxito', 'El producto ha sido restaurado a estado activo.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo restaurar el producto.');
            } finally {
              setLoadingAction(false);
            }
          },
        },
      ]
    );
  };

  const gananciaCentavos = producto.precio_venta_centavos - producto.precio_costo_centavos;

  return (
    <ScrollView style={styles.container}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{producto.nombre}</Text>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={styles.badgeText}>{producto.unidad}</Text>
          </View>
        </View>

        {/* Estado: Activo o Archivado */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: producto.activo ? '#DCFCE7' : '#FEE2E2' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: producto.activo ? colors.primaryDark : colors.danger },
              ]}
            >
              {producto.activo ? '● Activo en catálogo' : '○ Archivado'}
            </Text>
          </View>
        </View>

        {producto.descripcion ? (
          <View style={styles.descBox}>
            <Text style={styles.descLabel}>Descripción:</Text>
            <Text style={styles.descText}>{producto.descripcion}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Precio Costo sugerido:</Text>
          <Text style={styles.value}>
            {formatCentavos(producto.precio_costo_centavos)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Precio Venta sugerido:</Text>
          <Text style={[styles.value, { color: colors.primaryDark, fontSize: 18 }]}>
            {formatCentavos(producto.precio_venta_centavos)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Margen estimado por unidad:</Text>
          <Text
            style={[
              styles.value,
              { color: gananciaCentavos >= 0 ? colors.primary : colors.danger },
            ]}
          >
            {formatCentavos(gananciaCentavos)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onEditar}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Editar</Text>
          </TouchableOpacity>

          {producto.activo ? (
            <TouchableOpacity
              onPress={onArchivar}
              disabled={loadingAction}
              style={[styles.button, { backgroundColor: colors.danger, opacity: loadingAction ? 0.6 : 1 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Archivar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onRestaurar}
              disabled={loadingAction}
              style={[styles.button, { backgroundColor: '#10B981', opacity: loadingAction ? 0.6 : 1 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Restaurar</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </ScrollView>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
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
    fontSize: 13,
  },
  descBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtext,
    marginBottom: 2,
  },
  descText: {
    fontSize: 14,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 15,
    color: colors.subtext,
  },
  value: {
    fontSize: 17,
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
    fontSize: 15,
  },
});
