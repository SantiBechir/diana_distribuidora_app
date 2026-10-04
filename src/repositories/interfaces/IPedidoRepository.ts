import {
  Pedido,
  PedidoInsert,
  PedidoUpdate,
  PedidoLineaInsert,
  PedidoCompleto,
  PedidoConCliente,
  EstadoPedido,
} from '../../types/database.types';

export interface CreatePedidoInput {
  pedido: PedidoInsert;
  lineas: Omit<PedidoLineaInsert, 'pedido_id'>[];
}

export interface UpdatePedidoInput {
  pedido?: PedidoUpdate;
  lineas?: Omit<PedidoLineaInsert, 'pedido_id'>[];
}

export interface IPedidoRepository {
  /**
   * Obtiene todos los pedidos con sus datos de cliente asociados, ordenados por fecha descendente.
   */
  getAll(): Promise<PedidoConCliente[]>;

  /**
   * Obtiene un pedido completo por ID con cliente, líneas de productos y pagos asociados.
   */
  getById(id: string): Promise<PedidoCompleto | null>;

  /**
   * Obtiene todos los pedidos de un cliente específico.
   */
  getByCliente(clienteId: string): Promise<PedidoConCliente[]>;

  /**
   * Obtiene pedidos dentro de un rango de fechas.
   */
  getByDateRange(desde: Date, hasta: Date): Promise<PedidoConCliente[]>;

  /**
   * Obtiene pedidos filtrados por estado ('Impago', 'Pagado Parcialmente', 'Pagado', 'Cancelado').
   */
  getByEstado(estado: EstadoPedido): Promise<PedidoConCliente[]>;

  /**
   * Registra un pedido con sus respectivas líneas en una operación coordinada.
   */
  create(input: CreatePedidoInput): Promise<PedidoCompleto>;

  /**
   * Modifica un pedido y opcionalmente reemplaza sus líneas de detalle si no está totalmente pagado.
   */
  update(id: string, input: UpdatePedidoInput): Promise<PedidoCompleto>;

  /**
   * Cancela un pedido existente.
   */
  cancel(id: string): Promise<void>;

  /**
   * Calcula la ganancia bruta total entre fechas (suma de venta - costo de las líneas) en centavos.
   */
  getGananciaTotal(desde?: Date, hasta?: Date): Promise<number>;
}
