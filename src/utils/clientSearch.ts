import { Cliente } from '../types/database.types';

/** Compara CUIL con o sin guiones/espacios, sin interpretar nombres como números. */
export function matchesCliente(cliente: Pick<Cliente, 'nombre' | 'cuil'>, query: string): boolean {
  const text = query.trim().toLocaleLowerCase('es-AR');
  if (!text) return true;
  if (cliente.nombre.toLocaleLowerCase('es-AR').includes(text)) return true;
  if (!/^[\d\s-]+$/.test(text)) return false;
  const digits = text.replace(/[\s-]/g, '');
  return digits.length > 0 && Boolean(cliente.cuil?.replace(/[\s-]/g, '').includes(digits));
}
