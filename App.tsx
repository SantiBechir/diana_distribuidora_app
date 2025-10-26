import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Conexión exitosa! Clientes:', data);
      }
    } catch (err) {
      console.log('❌ Error:', err);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Mirá la consola (F12) para ver el resultado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});