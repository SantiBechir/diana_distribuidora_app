import { Producto, ProductoInsert, ProductoUpdate } from '../../types/database.types';

export interface IProductoRepository {
  /**
   * Obtiene todos los productos. Por defecto solo los activos, salvo que se solicite incluir archivados.
   */
  getAll(includeArchived?: boolean): Promise<Producto[]>;

  /**
   * Obtiene un producto por su ID UUID.
   */
  getById(id: string): Promise<Producto | null>;

  /**
   * Busca productos por coincidencia parcial en nombre.
   */
  search(query: string, includeArchived?: boolean): Promise<Producto[]>;

  /**
   * Registra un nuevo producto. Precios en centavos.
   */
  create(data: ProductoInsert): Promise<Producto>;

  /**
   * Actualiza los datos de un producto.
   */
  update(id: string, data: ProductoUpdate): Promise<Producto>;

  /**
   * Da de baja / archiva un producto (soft delete) para no borrar el historial de pedidos anteriores.
   */
  archive(id: string): Promise<void>;

  /**
   * Restaura un producto previamente archivado.
   */
  restore(id: string): Promise<void>;

  /**
   * Actualiza los precios sugeridos de costo y venta a partir del último pedido realizado.
   */
  updatePreciosSugeridos(id: string, precioCostoCentavos: number, precioVentaCentavos: number): Promise<void>;
}
