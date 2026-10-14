import { PagoProveedor, PagoProveedorInsert } from '../../types/database.types';

export interface IPagoProveedorRepository {
  /**
   * Obtiene todos los pagos realizados a proveedores.
   */
  getAll(): Promise<PagoProveedor[]>;

  /**
   * Obtiene un pago a proveedor por su ID UUID.
   */
  getById(id: string): Promise<PagoProveedor | null>;

  /**
   * Obtiene todos los pagos realizados a un proveedor específico (relación obligatoria).
   */
  getByProveedor(proveedorId: string): Promise<PagoProveedor[]>;

  /**
   * Registra un pago a proveedor.
   */
  create(data: PagoProveedorInsert): Promise<PagoProveedor>;

  /**
   * Modifica un pago registrado a proveedor.
   */
  update(id: string, data: Partial<PagoProveedorInsert>): Promise<PagoProveedor>;

  /**
   * Elimina un pago a proveedor.
   */
  delete(id: string): Promise<void>;
}
