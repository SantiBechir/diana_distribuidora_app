import { supabase } from '../../lib/supabase';
import { Proveedor, ProveedorInsert, ProveedorUpdate } from '../../types/database.types';
import { IProveedorRepository } from '../interfaces/IProveedorRepository';
import { centavosToPesos } from '../../utils/money';

function mapProveedor(row: any): Proveedor {
  return {
    ...row,
    saldo_centavos: Number(row.saldo_centavos ?? 0),
    saldo: centavosToPesos(Number(row.saldo_centavos ?? 0)),
  };
}

export class SupabaseProveedorRepository implements IProveedorRepository {
  async getAll(): Promise<Proveedor[]> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error al obtener proveedores: ${error.message}`);
    return (data || []).map(mapProveedor);
  }

  async getById(id: string): Promise<Proveedor | null> {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener proveedor ${id}: ${error.message}`);
    return data ? mapProveedor(data) : null;
  }

  async search(query: string): Promise<Proveedor[]> {
    const q = query.trim();
    if (!q) return this.getAll();

    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .ilike('nombre', `%${q}%`)
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error buscando proveedores: ${error.message}`);
    return (data || []).map(mapProveedor);
  }

  async create(data: ProveedorInsert): Promise<Proveedor> {
    const { data: created, error } = await supabase
      .from('proveedores')
      .insert({
        nombre: data.nombre.trim(),
        direccion: data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        saldo_centavos: data.saldo_centavos ?? 0,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al crear proveedor: ${error.message}`);
    return mapProveedor(created);
  }

  async update(id: string, data: ProveedorUpdate): Promise<Proveedor> {
    const updatePayload: any = { ...data };
    if (updatePayload.nombre) updatePayload.nombre = updatePayload.nombre.trim();
    if (updatePayload.direccion !== undefined) updatePayload.direccion = updatePayload.direccion?.trim() || null;
    if (updatePayload.telefono !== undefined) updatePayload.telefono = updatePayload.telefono?.trim() || null;

    const { data: updated, error } = await supabase
      .from('proveedores')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error al actualizar proveedor ${id}: ${error.message}`);
    return mapProveedor(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar proveedor ${id}: ${error.message}`);
  }

  async updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void> {
    const { error } = await supabase
      .from('proveedores')
      .update({ saldo_centavos: nuevoSaldoCentavos })
      .eq('id', id);

    if (error) throw new Error(`Error actualizando saldo de proveedor ${id}: ${error.message}`);
  }
}
