import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen';
import { NewClientScreen } from '../screens/clients/NewClientScreen';
import { EditClientScreen } from '../screens/clients/EditClientScreen';
import { ProductsListScreen } from '../screens/products/ProductsListScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { NewProductScreen } from '../screens/products/NewProductScreen';
import { EditProductScreen } from '../screens/products/EditProductScreen';
import { ProveedoresListScreen } from '../screens/proveedores/ProveedoresListScreen';
import { ProveedorDetailScreen } from '../screens/proveedores/ProveedorDetailScreen';
import { NewProveedorScreen } from '../screens/proveedores/NewProveedorScreen';
import { EditProveedorScreen } from '../screens/proveedores/EditProveedorScreen';
import { PedidosListScreen } from '../screens/pedidos/PedidosListScreen';
import { PedidoDetailScreen } from '../screens/pedidos/PedidoDetailScreen';
import { NewPedidoScreen } from '../screens/pedidos/NewPedidoScreen';
import { EditPedidoScreen } from '../screens/pedidos/EditPedidoScreen';
import { PagosClientesScreen } from '../screens/pagos/PagosClientesScreen';
import { PagosProveedoresScreen } from '../screens/pagos/PagosProveedoresScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.primary,
                    },
                    headerTintColor: colors.white,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Diana Distribuidora' }} />

                {/* Clientes */}
                <Stack.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clientes' }} />
                <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Detalle Cliente' }} />
                <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: 'Nuevo Cliente' }} />
                <Stack.Screen name="EditClient" component={EditClientScreen} options={{ title: 'Editar Cliente' }} />

                {/* Productos */}
                <Stack.Screen name="ProductsList" component={ProductsListScreen} options={{ title: 'Productos' }} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle Producto' }} />
                <Stack.Screen name="NewProduct" component={NewProductScreen} options={{ title: 'Nuevo Producto' }} />
                <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Editar Producto' }} />

                {/* Proveedores */}
                <Stack.Screen name="ProveedoresList" component={ProveedoresListScreen} options={{ title: 'Proveedores' }} />
                <Stack.Screen name="ProveedorDetail" component={ProveedorDetailScreen} options={{ title: 'Detalle Proveedor' }} />
                <Stack.Screen name="NewProveedor" component={NewProveedorScreen} options={{ title: 'Nuevo Proveedor' }} />
                <Stack.Screen name="EditProveedor" component={EditProveedorScreen} options={{ title: 'Editar Proveedor' }} />

                {/* Pedidos */}
                <Stack.Screen name="PedidosList" component={PedidosListScreen} options={{ title: 'Pedidos' }} />
                <Stack.Screen name="PedidoDetail" component={PedidoDetailScreen} options={{ title: 'Detalle Pedido' }} />
                <Stack.Screen name="NewPedido" component={NewPedidoScreen} options={{ title: 'Nuevo Pedido' }} />
                <Stack.Screen name="EditPedido" component={EditPedidoScreen} options={{ title: 'Editar Pedido' }} />

                {/* Pagos */}
                <Stack.Screen name="PagosClientes" component={PagosClientesScreen} options={{ title: 'Pagos Clientes' }} />
                <Stack.Screen name="PagosProveedores" component={PagosProveedoresScreen} options={{ title: 'Pagos Proveedores' }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
