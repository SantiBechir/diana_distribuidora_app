import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ClientsListScreen from '../screens/ClientsListScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import NewClientScreen from '../screens/NewClientScreen';
import EditClientScreen from '../screens/EditClientScreen';
import ProductosListScreen from '../screens/ProductosListScreen';
import ProductoDetailScreen from '../screens/ProductoDetailScreen';
import NewProductoScreen from '../screens/NewProductoScreen';
import EditProductoScreen from '../screens/EditProductoScreen';
import ProveedoresListScreen from '../screens/ProveedoresListScreen';
import ProveedorDetailScreen from '../screens/ProveedorDetailScreen';
import NewProveedorScreen from '../screens/NewProveedorScreen';
import EditProveedorScreen from '../screens/EditProveedorScreen';
import { colors } from '../theme/colors';
import { Cliente, Producto, Proveedor } from '../types/database.types';

export type RootStackParamList = {
  Home: undefined;
  ClientsList: undefined;
  ClientDetail: { cliente: Cliente };
  NewClient: undefined;
  EditClient: { cliente: Cliente };
  ProductosList: undefined;
  ProductoDetail: { producto: Producto };
  NewProducto: undefined;
  EditProducto: { producto: Producto };
  ProveedoresList: undefined;
  ProveedorDetail: { proveedor: Proveedor };
  NewProveedor: undefined;
  EditProveedor: { proveedor: Proveedor };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={({ navigation }) => ({
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={styles.homeButton}
            >
              <Text style={styles.homeButtonText}>🏠</Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Diana Distribuidora', headerRight: () => null }} 
        />

        {/* Clientes */}
        <Stack.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clientes' }} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Cliente' }} />
        <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: 'Nuevo cliente' }} />
        <Stack.Screen name="EditClient" component={EditClientScreen} options={{ title: 'Editar cliente' }} />

        {/* Productos */}
        <Stack.Screen name="ProductosList" component={ProductosListScreen} options={{ title: 'Productos' }} />
        <Stack.Screen name="ProductoDetail" component={ProductoDetailScreen} options={{ title: 'Producto' }} />
        <Stack.Screen name="NewProducto" component={NewProductoScreen} options={{ title: 'Nuevo producto' }} />
        <Stack.Screen name="EditProducto" component={EditProductoScreen} options={{ title: 'Editar producto' }} />

        {/* Proveedores */}
        <Stack.Screen name="ProveedoresList" component={ProveedoresListScreen} options={{ title: 'Proveedores' }} />
        <Stack.Screen name="ProveedorDetail" component={ProveedorDetailScreen} options={{ title: 'Proveedor' }} />
        <Stack.Screen name="NewProveedor" component={NewProveedorScreen} options={{ title: 'Nuevo proveedor' }} />
        <Stack.Screen name="EditProveedor" component={EditProveedorScreen} options={{ title: 'Editar proveedor' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    marginRight: 8,
    padding: 8,
  },
  homeButtonText: {
    fontSize: 24,
  },
});