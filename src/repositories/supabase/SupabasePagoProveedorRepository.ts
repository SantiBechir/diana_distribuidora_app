import { supabase } from '../../lib/supabase';
import { PagoProveedor, PagoProveedorInsert } from '../../types/database.types';
import { IPagoProveedorRepository } from '../interfaces/IPagoProveedorRepository';
import { centavosToPesos } from '../../utils/money';

function mapPagoProveedor(row: any): PagoProveedor {
  return {
    ...row,
    monto_centavos: Number(row.monto_centavos ?? 0),
    monto: centavosToPesos(Number(row.monto_centavos ?? 0)),
  };
}

export class SupabasePagoProveedorRepository implements IPagoProveedorRepository {
  async getAll(): Promise<PagoProveedor[]> {
    const { data, error } = await supabase
      .from('pagos_proveedores')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pagos a proveedores: ${error.message}`);
    return (data || []).map(mapPagoProveedor);
  }

  async getById(id: string): Promise<PagoProveedor | null> {
    const { data, error } = await supabase
      .from('pagos_proveedores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener pago ${id}: ${error.message}`);
    return data ? mapPagoProveedor(data) : null;
  }

  async getByProveedor(proveedorId: string): Promise<PagoProveedor[]> {
    const { data, error } = await supabase
      .from('pagos_proveedores')
      .select('*')
      .eq('proveedor_id', proveedorId)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pagos del proveedor: ${error.message}`);
    return (data || []).map(mapPagoProveedor);
  }

  async create(data: PagoProveedorInsert): Promise<PagoProveedor> {
    if (!data.proveedor_id) {
      throw new Error('Todo pago a proveedor debe estar obligatoriamente vinculado a un proveedor.');
    }

    const { data: created, error } = await supabase
      .from('pagos_proveedores')
      .insert({
        proveedor_id: data.proveedor_id,
        monto_centavos: data.monto_centavos,
        fecha: data.fecha || new Date().toISOString(),
        metodo_pago: data.metodo_pago || 'Efectivo',
        notas: data.notas?.trim() || null,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al registrar pago a proveedor: ${error.message}`);
    return mapPagoProveedor(created);
  }

  async update(id: string, data: Partial<PagoProveedorInsert>): Promise<PagoProveedor> {
    const { data: updated, error } = await supabase
      .from('pagos_proveedores')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error al actualizar pago a proveedor ${id}: ${error.message}`);
    return mapPagoProveedor(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagos_proveedores')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar pago a proveedor ${id}: ${error.message}`);
  }
}
