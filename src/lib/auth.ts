import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Inicializa o recupera la sesión anónima del usuario demo.
 * Cumple con el requisito:
 * "acceso anónimo sin pantalla de ingreso y políticas que aíslen los datos de la demo.
 * La primera apertura requiere internet para crear la identidad anónima;
 * después la app puede trabajar con los datos locales."
 */
export async function ensureAnonymousSession(): Promise<{
  user: User | null;
  session: Session | null;
  error: Error | null;
}> {
  try {
    // 1. Verificar si ya existe una sesión persistida en el almacenamiento local
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('Aviso al recuperar sesión persistida:', sessionError.message);
    }

    if (sessionData?.session?.user) {
      return {
        user: sessionData.session.user,
        session: sessionData.session,
        error: null,
      };
    }

    // 2. Si no hay sesión previa, iniciar sesión anónima automáticamente
    const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      console.error('Error al iniciar sesión anónima en Supabase:', signInError.message);
      return {
        user: null,
        session: null,
        error: signInError,
      };
    }

    return {
      user: signInData.user,
      session: signInData.session,
      error: null,
    };
  } catch (err: any) {
    console.error('Excepción no controlada en ensureAnonymousSession:', err);
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * Obtiene el ID del usuario anónimo actual autenticado (UUID),
 * o null si aún no se inicializó la sesión.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}
