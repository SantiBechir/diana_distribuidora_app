import { supabase } from '../../lib/supabase';
import { PagoCliente, PagoClienteInsert } from '../../types/database.types';
import { IPagoClienteRepository } from '../interfaces/IPagoClienteRepository';
import { centavosToPesos } from '../../utils/money';

function mapPagoCliente(row: any): PagoCliente {
  return {
    ...row,
    monto_centavos: Number(row.monto_centavos ?? 0),
    monto: centavosToPesos(Number(row.monto_centavos ?? 0)),
  };
}

export class SupabasePagoClienteRepository implements IPagoClienteRepository {
  async getAll(): Promise<PagoCliente[]> {
    const { data, error } = await supabase
      .from('pagos_clientes')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pagos de clientes: ${error.message}`);
    return (data || []).map(mapPagoCliente);
  }

  async getById(id: string): Promise<PagoCliente | null> {
    const { data, error } = await supabase
      .from('pagos_clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener pago ${id}: ${error.message}`);
    return data ? mapPagoCliente(data) : null;
  }

  async getByCliente(clienteId: string): Promise<PagoCliente[]> {
    const { data, error } = await supabase
      .from('pagos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pagos del cliente: ${error.message}`);
    return (data || []).map(mapPagoCliente);
  }

  async getByPedido(pedidoId: string): Promise<PagoCliente[]> {
    const { data, error } = await supabase
      .from('pagos_clientes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pagos del pedido: ${error.message}`);
    return (data || []).map(mapPagoCliente);
  }

  async create(data: PagoClienteInsert): Promise<PagoCliente> {
    if (!data.pedido_id) {
      throw new Error('Todo pago de cliente debe estar obligatoriamente vinculado a un pedido.');
    }

    const { data: created, error } = await supabase
      .from('pagos_clientes')
      .insert({
        cliente_id: data.cliente_id,
        pedido_id: data.pedido_id,
        monto_centavos: data.monto_centavos,
        fecha: data.fecha || new Date().toISOString(),
        metodo_pago: data.metodo_pago || 'Efectivo',
        notas: data.notas?.trim() || null,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al registrar pago de cliente: ${error.message}`);
    return mapPagoCliente(created);
  }

  async update(id: string, data: Partial<PagoClienteInsert>): Promise<PagoCliente> {
    const { data: updated, error } = await supabase
      .from('pagos_clientes')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(`Error al actualizar pago ${id}: ${error.message}`);
    return mapPagoCliente(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagos_clientes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error al eliminar pago ${id}: ${error.message}`);
  }
}
