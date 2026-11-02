import { supabase } from '../../lib/supabase';
import {
  Pedido,
  PedidoCompleto,
  PedidoConCliente,
  EstadoPedido,
  Cliente,
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

function mapCliente(row: Omit<Cliente, 'saldo'>): Cliente {
  return { ...row, saldo_centavos: Number(row.saldo_centavos), saldo: centavosToPesos(Number(row.saldo_centavos)) };
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
      cliente: mapCliente(row.cliente),
    }));
  }

  async getById(id: string): Promise<PedidoCompleto | null> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        cliente:clientes(*),
        pedido_lineas:pedido_lineas(*, producto:productos(*), proveedor:proveedores(*)),
        pagos_clientes:pagos_clientes(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener pedido ${id}: ${error.message}`);
    if (!data) return null;

    return {
      ...mapPedido(data),
      cliente: mapCliente(data.cliente),
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
      cliente: mapCliente(row.cliente),
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
      cliente: mapCliente(row.cliente),
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
      cliente: mapCliente(row.cliente),
    }));
  }

  async create(input: CreatePedidoInput): Promise<PedidoCompleto> {
    const { data: id, error } = await supabase.rpc('guardar_pedido', {
      p_pedido: input.pedido,
      p_lineas: input.lineas,
    });
    if (error) throw new Error(`Error al crear pedido: ${error.message}`);
    const resultado = await this.getById(id);
    if (!resultado) throw new Error('El pedido se guardó pero no se pudo recuperar. Recargá la lista antes de reintentar.');
    return resultado;
  }

  async update(id: string, input: UpdatePedidoInput): Promise<PedidoCompleto> {
    const { error } = await supabase.rpc('guardar_pedido', {
      p_id: id,
      p_pedido: input.pedido ?? {},
      p_lineas: input.lineas ?? null,
    });
    if (error) throw new Error(`Error al actualizar pedido: ${error.message}`);
    const resultado = await this.getById(id);
    if (!resultado) throw new Error('El pedido se guardó pero no se pudo recuperar. Recargá la lista antes de reintentar.');
    return resultado;
  }

  async cancel(id: string): Promise<void> {
    const { error } = await supabase.rpc('cancelar_pedido', { p_id: id });
    if (error) throw new Error(`Error al cancelar pedido: ${error.message}`);
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
