import { supabase } from '../../lib/supabase';
import { Cliente, ClienteInsert, ClienteUpdate } from '../../types/database.types';
import { IClienteRepository } from '../interfaces/IClienteRepository';
import { centavosToPesos } from '../../utils/money';

function mapCliente(row: any): Cliente {
  return {
    ...row,
    saldo_centavos: Number(row.saldo_centavos ?? 0),
    saldo: centavosToPesos(Number(row.saldo_centavos ?? 0)),
  };
}

export class SupabaseClienteRepository implements IClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error al obtener clientes: ${error.message}`);
    return (data || []).map(mapCliente);
  }

  async getById(id: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener cliente ${id}: ${error.message}`);
    return data ? mapCliente(data) : null;
  }

  async search(query: string): Promise<Cliente[]> {
    const q = query.trim();
    if (!q) return this.getAll();

    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${q}%,cuil.ilike.%${q}%`)
      .order('nombre', { ascending: true });

    if (error) throw new Error(`Error buscando clientes: ${error.message}`);
    return (data || []).map(mapCliente);
  }

  async create(data: ClienteInsert): Promise<Cliente> {
    const { data: created, error } = await supabase
      .from('clientes')
      .insert({
        nombre: data.nombre.trim(),
        cuil: data.cuil?.trim() || null,
        direccion: data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        mail: data.mail?.trim() || null,
        tipo: data.tipo,
        notas: data.notas?.trim() || null,
        saldo_centavos: data.saldo_centavos ?? 0,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al crear cliente: ${error.message}`);
    return mapCliente(created);
  }

  async update(id: string, data: ClienteUpdate): Promise<Cliente> {
    const updatePayload: any = { ...data };
    if (updatePayload.nombre) updatePayload.nombre = updatePayload.nombre.trim();
    if (updatePayload.cuil !== undefined) updatePayload.cuil = updatePayload.cuil?.trim() || null;
    if (updatePayload.direccion !== undefined) updatePayload.direccion = updatePayload.direccion?.trim() || null;
    if (updatePayload.telefono !== undefined) updatePayload.telefono = updatePayload.telefono?.trim() || null;
    if (updatePayload.mail !== undefined) updatePayload.mail = updatePayload.mail?.trim() || null;

    const { data: updated, error } = await supabase
      .from('clientes')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error al actualizar cliente ${id}: ${error.message}`);
    return mapCliente(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar cliente ${id}: ${error.message}`);
  }

  async updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ saldo_centavos: nuevoSaldoCentavos })
      .eq('id', id);

    if (error) throw new Error(`Error actualizando saldo de cliente ${id}: ${error.message}`);
  }
}
