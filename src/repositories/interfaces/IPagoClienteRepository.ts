import { PagoCliente, PagoClienteInsert } from '../../types/database.types';

export interface IPagoClienteRepository {
  /**
   * Obtiene todos los pagos de clientes registrados.
   */
  getAll(): Promise<PagoCliente[]>;

  /**
   * Obtiene un pago de cliente por su ID UUID.
   */
  getById(id: string): Promise<PagoCliente | null>;

  /**
   * Obtiene todos los pagos realizados por un cliente específico.
   */
  getByCliente(clienteId: string): Promise<PagoCliente[]>;

  /**
   * Obtiene los pagos imputados a un pedido específico (relación obligatoria).
   */
  getByPedido(pedidoId: string): Promise<PagoCliente[]>;

  /**
   * Registra un nuevo pago de cliente asociado obligatoriamente a un pedido.
   */
  create(data: PagoClienteInsert): Promise<PagoCliente>;

  /**
   * Modifica el monto o notas de un pago registrado.
   */
  update(id: string, data: Partial<PagoClienteInsert>): Promise<PagoCliente>;

  /**
   * Elimina un pago.
   */
  delete(id: string): Promise<void>;
}
