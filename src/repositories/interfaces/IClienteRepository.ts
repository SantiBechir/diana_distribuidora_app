import { Cliente, ClienteInsert, ClienteUpdate } from '../../types/database.types';

export interface IClienteRepository {
  /**
   * Obtiene todos los clientes del usuario demo ordenados por nombre.
   */
  getAll(): Promise<Cliente[]>;

  /**
   * Obtiene un cliente por su ID UUID.
   */
  getById(id: string): Promise<Cliente | null>;

  /**
   * Busca clientes por coincidencia parcial en nombre o coincidencia en CUIL.
   */
  search(query: string): Promise<Cliente[]>;

  /**
   * Registra un nuevo cliente.
   */
  create(data: ClienteInsert): Promise<Cliente>;

  /**
   * Actualiza los datos de un cliente existente.
   */
  update(id: string, data: ClienteUpdate): Promise<Cliente>;

  /**
   * Elimina un cliente.
   */
  delete(id: string): Promise<void>;

  /**
   * Actualiza el saldo deudor del cliente en centavos.
   */
  updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void>;
}
