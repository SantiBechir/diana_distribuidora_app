import {
  CreditoCliente,
  CreditoClienteInsert,
  CreditoAplicacion,
  CreditoAplicacionInsert,
} from '../../types/database.types';

export interface ICreditoRepository {
  /**
   * Obtiene los registros de créditos/excedentes de un cliente.
   */
  getByCliente(clienteId: string): Promise<CreditoCliente[]>;

  /**
   * Obtiene el saldo total disponible a favor de un cliente en centavos.
   */
  getSaldoDisponible(clienteId: string): Promise<number>;

  /**
   * Registra un excedente como crédito a favor del cliente.
   */
  registrarExcedente(data: CreditoClienteInsert): Promise<CreditoCliente>;

  /**
   * Aplica un crédito disponible a un pedido (movimiento que no registra nuevo ingreso de dinero).
   */
  aplicarCreditoAPedido(data: CreditoAplicacionInsert): Promise<CreditoAplicacion>;

  /**
   * Obtiene las aplicaciones de crédito vinculadas a un pedido determinado.
   */
  getAplicacionesByPedido(pedidoId: string): Promise<CreditoAplicacion[]>;
}
