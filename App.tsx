import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { ensureAnonymousSession } from './src/lib/auth';
import { colors } from './src/theme/colors';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Inicialización automática de sesión anónima demo sin pantalla de ingreso
    ensureAnonymousSession()
      .then(result => {
        if (result.error) {
          console.warn('Aviso al inicializar sesión anónima:', result.error.message);
        } else {
          console.log('Identidad anónima demo activa:', result.user?.id);
        }
      })
      .catch(err => {
        console.warn('Error no controlado al inicializar auth:', err);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});