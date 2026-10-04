import { supabase } from '../../lib/supabase';
import {
  CreditoCliente,
  CreditoClienteInsert,
  CreditoAplicacion,
  CreditoAplicacionInsert,
} from '../../types/database.types';
import { ICreditoRepository } from '../interfaces/ICreditoRepository';

function mapCredito(row: any): CreditoCliente {
  return {
    ...row,
    monto_total_centavos: Number(row.monto_total_centavos ?? 0),
    saldo_disponible_centavos: Number(row.saldo_disponible_centavos ?? 0),
  };
}

function mapAplicacion(row: any): CreditoAplicacion {
  return {
    ...row,
    monto_aplicado_centavos: Number(row.monto_aplicado_centavos ?? 0),
  };
}

export class SupabaseCreditoRepository implements ICreditoRepository {
  async getByCliente(clienteId: string): Promise<CreditoCliente[]> {
    const { data, error } = await supabase
      .from('creditos_clientes')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error al obtener créditos del cliente: ${error.message}`);
    return (data || []).map(mapCredito);
  }

  async getSaldoDisponible(clienteId: string): Promise<number> {
    const { data, error } = await supabase
      .from('creditos_clientes')
      .select('saldo_disponible_centavos')
      .eq('cliente_id', clienteId)
      .gt('saldo_disponible_centavos', 0);

    if (error) throw new Error(`Error al consultar saldo disponible: ${error.message}`);
    return (data || []).reduce((acc: number, c: any) => acc + Number(c.saldo_disponible_centavos), 0);
  }

  async registrarExcedente(data: CreditoClienteInsert): Promise<CreditoCliente> {
    const { data: created, error } = await supabase
      .from('creditos_clientes')
      .insert({
        cliente_id: data.cliente_id,
        pago_origen_id: data.pago_origen_id || null,
        monto_total_centavos: data.monto_total_centavos,
        saldo_disponible_centavos: data.saldo_disponible_centavos ?? data.monto_total_centavos,
        notas: data.notas?.trim() || null,
      })
      .select('*')
      .single();

    if (error) throw new Error(`Error al registrar crédito por excedente: ${error.message}`);
    return mapCredito(created);
  }

  async aplicarCreditoAPedido(data: CreditoAplicacionInsert): Promise<CreditoAplicacion> {
    // 1. Descontar del saldo disponible del crédito
    const { data: credito, error: errCredito } = await supabase
      .from('creditos_clientes')
      .select('*')
      .eq('id', data.credito_id)
      .single();

    if (errCredito || !credito) {
      throw new Error(`Crédito ${data.credito_id} no encontrado`);
    }

    if (credito.saldo_disponible_centavos < data.monto_aplicado_centavos) {
      throw new Error('El monto a aplicar supera el saldo disponible del crédito');
    }

    const nuevoSaldo = credito.saldo_disponible_centavos - data.monto_aplicado_centavos;

    const { error: errUpdateCredito } = await supabase
      .from('creditos_clientes')
      .update({ saldo_disponible_centavos: nuevoSaldo })
      .eq('id', data.credito_id);

    if (errUpdateCredito) {
      throw new Error(`Error actualizando saldo de crédito: ${errUpdateCredito.message}`);
    }

    // 2. Registrar la aplicación de crédito al pedido
    const { data: aplicacion, error: errAplicacion } = await supabase
      .from('credito_aplicaciones')
      .insert({
        credito_id: data.credito_id,
        pedido_id: data.pedido_id,
        cliente_id: data.cliente_id,
        monto_aplicado_centavos: data.monto_aplicado_centavos,
        fecha: data.fecha || new Date().toISOString(),
      })
      .select('*')
      .single();

    if (errAplicacion) {
      throw new Error(`Error al registrar aplicación de crédito: ${errAplicacion.message}`);
    }

    return mapAplicacion(aplicacion);
  }

  async getAplicacionesByPedido(pedidoId: string): Promise<CreditoAplicacion[]> {
    const { data, error } = await supabase
      .from('credito_aplicaciones')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener aplicaciones de crédito del pedido: ${error.message}`);
    return (data || []).map(mapAplicacion);
  }
}
