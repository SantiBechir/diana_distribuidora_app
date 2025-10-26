import { supabase } from './lib/supabase';

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('clientes').select('count');
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Conexión exitosa a Supabase!');
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}