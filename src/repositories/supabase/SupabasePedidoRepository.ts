import { supabase } from '../../lib/supabase';
import {
  Pedido,
  PedidoCompleto,
  PedidoConCliente,
  EstadoPedido,
} from '../../types/database.types';
import {
  IPedidoRepository,
  CreatePedidoInput,
  UpdatePedidoInput,
} from '../interfaces/IPedidoRepository';
import { centavosToPesos } from '../../utils/money';

function mapPedido(row: any): Pedido {
  return {
    ...row,
    total_centavos: Number(row.total_centavos ?? 0),
    total_costo_centavos: Number(row.total_costo_centavos ?? 0),
    total: centavosToPesos(Number(row.total_centavos ?? 0)),
  };
}

export class SupabasePedidoRepository implements IPedidoRepository {
  async getAll(): Promise<PedidoConCliente[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:clientes(*)')
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pedidos: ${error.message}`);
    return (data || []).map((row: any) => ({
      ...mapPedido(row),
      cliente: row.cliente,
    }));
  }

  async getById(id: string): Promise<PedidoCompleto | null> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        cliente:clientes(*),
        pedido_lineas:pedido_lineas(*, producto:productos(*), proveedor:proveedores(*)),
        pagos_clientes:pagos_clientes(*),
        credito_aplicaciones:credito_aplicaciones(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener pedido ${id}: ${error.message}`);
    if (!data) return null;

    return {
      ...mapPedido(data),
      cliente: data.cliente,
      pedido_lineas: (data.pedido_lineas || []).map((linea: any) => ({
        ...linea,
        precio_unit_costo_centavos: Number(linea.precio_unit_costo_centavos),
        precio_unit_venta_centavos: Number(linea.precio_unit_venta_centavos),
        subtotal_costo_centavos: Number(linea.subtotal_costo_centavos),
        subtotal_venta_centavos: Number(linea.subtotal_venta_centavos),
        precio_unit_costo: centavosToPesos(Number(linea.precio_unit_costo_centavos)),
        precio_unit_venta: centavosToPesos(Number(linea.precio_unit_venta_centavos)),
        producto: linea.producto,
        proveedor: linea.proveedor,
      })),
      pagos_clientes: (data.pagos_clientes || []).map((pago: any) => ({
        ...pago,
        monto_centavos: Number(pago.monto_centavos),
        monto: centavosToPesos(Number(pago.monto_centavos)),
      })),
      credito_aplicaciones: data.credito_aplicaciones || [],
    };
  }

  async getByCliente(clienteId: string): Promise<PedidoConCliente[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:clientes(*)')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pedidos del cliente: ${error.message}`);
    return (data || []).map((row: any) => ({
      ...mapPedido(row),
      cliente: row.cliente,
    }));
  }

  async getByDateRange(desde: Date, hasta: Date): Promise<PedidoConCliente[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:clientes(*)')
      .gte('fecha', desde.toISOString())
      .lte('fecha', hasta.toISOString())
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pedidos por fecha: ${error.message}`);
    return (data || []).map((row: any) => ({
      ...mapPedido(row),
      cliente: row.cliente,
    }));
  }

  async getByEstado(estado: EstadoPedido): Promise<PedidoConCliente[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, cliente:clientes(*)')
      .eq('estado', estado)
      .order('fecha', { ascending: false });

    if (error) throw new Error(`Error al obtener pedidos por estado: ${error.message}`);
    return (data || []).map((row: any) => ({
      ...mapPedido(row),
      cliente: row.cliente,
    }));
  }

  async create(input: CreatePedidoInput): Promise<PedidoCompleto> {
    let totalCentavos = 0;
    let totalCostoCentavos = 0;

    const lineasCalculadas = input.lineas.map(linea => {
      const subtotalVenta = Math.round(Number(linea.cantidad) * Number(linea.precio_unit_venta_centavos));
      const subtotalCosto = Math.round(Number(linea.cantidad) * Number(linea.precio_unit_costo_centavos));
      totalCentavos += subtotalVenta;
      totalCostoCentavos += subtotalCosto;
      return {
        ...linea,
        subtotal_venta_centavos: subtotalVenta,
        subtotal_costo_centavos: subtotalCosto,
      };
    });

    const { data: pedidoCreado, error: errorPedido } = await supabase
      .from('pedidos')
      .insert({
        cliente_id: input.pedido.cliente_id,
        fecha: input.pedido.fecha || new Date().toISOString(),
        total_centavos: totalCentavos,
        total_costo_centavos: totalCostoCentavos,
        estado: input.pedido.estado || 'Impago',
        notas: input.pedido.notas?.trim() || null,
      })
      .select('*')
      .single();

    if (errorPedido) throw new Error(`Error al crear pedido: ${errorPedido.message}`);

    if (lineasCalculadas.length > 0) {
      const lineasAInsertar = lineasCalculadas.map(l => ({
        ...l,
        pedido_id: pedidoCreado.id,
      }));

      const { error: errorLineas } = await supabase
        .from('pedido_lineas')
        .insert(lineasAInsertar);

      if (errorLineas) {
        throw new Error(`Error al insertar líneas de pedido: ${errorLineas.message}`);
      }
    }

    const resultado = await this.getById(pedidoCreado.id);
    if (!resultado) throw new Error('No se pudo recuperar el pedido creado');
    return resultado;
  }

  async update(id: string, input: UpdatePedidoInput): Promise<PedidoCompleto> {
    if (input.pedido) {
      const { error } = await supabase
        .from('pedidos')
        .update(input.pedido)
        .eq('id', id);

      if (error) throw new Error(`Error actualizando pedido ${id}: ${error.message}`);
    }

    if (input.lineas) {
      // Reemplazo de líneas (cuando se modifica un pedido impago/parcial)
      await supabase.from('pedido_lineas').delete().eq('pedido_id', id);

      let totalCentavos = 0;
      let totalCostoCentavos = 0;

      const lineasCalculadas = input.lineas.map(linea => {
        const subtotalVenta = Math.round(Number(linea.cantidad) * Number(linea.precio_unit_venta_centavos));
        const subtotalCosto = Math.round(Number(linea.cantidad) * Number(linea.precio_unit_costo_centavos));
        totalCentavos += subtotalVenta;
        totalCostoCentavos += subtotalCosto;
        return {
          ...linea,
          pedido_id: id,
          subtotal_venta_centavos: subtotalVenta,
          subtotal_costo_centavos: subtotalCosto,
        };
      });

      if (lineasCalculadas.length > 0) {
        const { error: errorLineas } = await supabase
          .from('pedido_lineas')
          .insert(lineasCalculadas);

        if (errorLineas) throw new Error(`Error al actualizar líneas: ${errorLineas.message}`);
      }

      await supabase
        .from('pedidos')
        .update({
          total_centavos: totalCentavos,
          total_costo_centavos: totalCostoCentavos,
        })
        .eq('id', id);
    }

    const resultado = await this.getById(id);
    if (!resultado) throw new Error(`No se pudo recuperar el pedido actualizado ${id}`);
    return resultado;
  }

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'Cancelado' })
      .eq('id', id);

    if (error) throw new Error(`Error al cancelar pedido ${id}: ${error.message}`);
  }

  async getGananciaTotal(desde?: Date, hasta?: Date): Promise<number> {
    let query = supabase.from('pedidos').select('total_centavos, total_costo_centavos, estado');

    if (desde) query = query.gte('fecha', desde.toISOString());
    if (hasta) query = query.lte('fecha', hasta.toISOString());

    const { data, error } = await query;
    if (error) throw new Error(`Error al calcular ganancia: ${error.message}`);

    // No contar pedidos cancelados
    return (data || [])
      .filter((p: any) => p.estado !== 'Cancelado')
      .reduce((acc: number, p: any) => acc + (Number(p.total_centavos) - Number(p.total_costo_centavos)), 0);
  }
}
