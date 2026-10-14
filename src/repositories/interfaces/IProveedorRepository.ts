import { Proveedor, ProveedorInsert, ProveedorUpdate } from '../../types/database.types';

export interface IProveedorRepository {
  /**
   * Obtiene todos los proveedores ordenados por nombre.
   */
  getAll(): Promise<Proveedor[]>;

  /**
   * Obtiene un proveedor por su ID UUID.
   */
  getById(id: string): Promise<Proveedor | null>;

  /**
   * Busca proveedores por nombre.
   */
  search(query: string): Promise<Proveedor[]>;

  /**
   * Registra un nuevo proveedor.
   */
  create(data: ProveedorInsert): Promise<Proveedor>;

  /**
   * Actualiza los datos de un proveedor existente.
   */
  update(id: string, data: ProveedorUpdate): Promise<Proveedor>;

  /**
   * Elimina un proveedor.
   */
  delete(id: string): Promise<void>;

  /**
   * Actualiza el saldo adeudado al proveedor en centavos.
   */
  updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void>;
}
