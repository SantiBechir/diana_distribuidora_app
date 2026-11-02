import { pedidoRepository, IPedidoRepository, CreatePedidoInput } from '../repositories';
import { PedidoLineaInsert } from '../types/database.types';
import { parseMoneyInput, pesosToCentavos } from '../utils/money';

export type NuevaLineaPedido = Omit<PedidoLineaInsert, 'pedido_id'>;
export interface LineaPedidoForm {
  producto_id: string;
  proveedor_id: string;
  cantidad: string;
  costo: string;
  venta: string;
}

export function lineaDesdeFormulario(form: LineaPedidoForm): NuevaLineaPedido {
  if (!form.producto_id) throw new Error('Seleccioná un producto.');
  if (!form.proveedor_id) throw new Error('Seleccioná un proveedor para esta línea.');
  const cantidad = parseMoneyInput(form.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 9999999999.99) {
    throw new Error('La cantidad debe ser mayor a cero y tener hasta dos decimales.');
  }
  const costo = parseMoneyInput(form.costo);
  const venta = parseMoneyInput(form.venta);
  if (!Number.isFinite(costo) || costo < 0 || !Number.isFinite(venta) || venta < 0) {
    throw new Error('Ingresá precios no negativos con hasta dos decimales.');
  }
  return { producto_id: form.producto_id, proveedor_id: form.proveedor_id, cantidad,
    precio_unit_costo_centavos: pesosToCentavos(costo), precio_unit_venta_centavos: pesosToCentavos(venta) };
}

export function totalesPedido(lineas: NuevaLineaPedido[]) {
  let costo = 0;
  let venta = 0;
  for (const linea of lineas) {
    const cantidad = linea.cantidad;
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 9999999999.99 ||
        Number(cantidad.toFixed(2)) !== cantidad) {
      throw new Error('Cantidad inválida: usá valores positivos con hasta dos decimales.');
    }
    if (!linea.producto_id || !linea.proveedor_id) throw new Error('Cada línea requiere producto y proveedor.');
    for (const precio of [linea.precio_unit_costo_centavos, linea.precio_unit_venta_centavos]) {
      if (!Number.isSafeInteger(precio) || precio < 0) throw new Error('Los precios deben ser centavos enteros no negativos.');
    }
    const unidades = Math.round(cantidad * 100);
    costo += Math.round(unidades * linea.precio_unit_costo_centavos / 100);
    venta += Math.round(unidades * linea.precio_unit_venta_centavos / 100);
    if (!Number.isSafeInteger(costo) || !Number.isSafeInteger(venta)) throw new Error('El total excede el importe permitido.');
  }
  return { costo, venta, ganancia: venta - costo };
}

export function fechaPedidoISO(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error('Ingresá la fecha como AAAA-MM-DD.');
  const [year, month, day] = match.slice(1).map(Number);
  const fecha = new Date(year, month - 1, day, 12);
  if (fecha.getFullYear() !== year || fecha.getMonth() !== month - 1 || fecha.getDate() !== day) {
    throw new Error('La fecha no es válida.');
  }
  return fecha.toISOString();
}

export class PedidoService {
  constructor(private repo: IPedidoRepository = pedidoRepository) {}

  getById(id: string) { return this.repo.getById(id); }

  async create(input: CreatePedidoInput) {
    if (!input.pedido.cliente_id) throw new Error('Seleccioná un cliente.');
    if (!input.lineas.length) throw new Error('Agregá al menos un producto al pedido.');
    if (input.pedido.fecha && !Number.isFinite(Date.parse(input.pedido.fecha))) throw new Error('Fecha inválida.');
    totalesPedido(input.lineas);
    return this.repo.create({ pedido: { cliente_id: input.pedido.cliente_id, fecha: input.pedido.fecha,
      notas: input.pedido.notas?.trim() || null, estado: 'Impago' }, lineas: input.lineas });
  }
}
