import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClientsListScreen from '../screens/ClientsListScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import { colors } from '../theme/colors';
import { Cliente } from '../types/database.types';

export type RootStackParamList = {
  ClientsList: undefined;
  ClientDetail: { cliente: Cliente };
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
        screenOptions={{
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clientes' }} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: 'Cliente' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}