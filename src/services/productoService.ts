import { productoRepository, IProductoRepository } from '../repositories';
import { Producto, ProductoInsert, ProductoUpdate } from '../types/database.types';

export interface ProductoValidationErrors {
  nombre?: string;
  precio_costo?: string;
  precio_venta?: string;
}

export class ProductoService {
  private repo: IProductoRepository;

  constructor(repo: IProductoRepository = productoRepository) {
    this.repo = repo;
  }

  /**
   * Valida los datos del producto.
   */
  validate(data: Partial<ProductoInsert | ProductoUpdate>): {
    isValid: boolean;
    errors: ProductoValidationErrors;
  } {
    const errors: ProductoValidationErrors = {};

    if (data.nombre !== undefined) {
      if (!data.nombre || !data.nombre.trim()) {
        errors.nombre = 'El nombre del producto es obligatorio.';
      } else if (data.nombre.trim().length < 2) {
        errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
      }
    }

    if (data.precio_costo_centavos !== undefined) {
      if (!Number.isSafeInteger(data.precio_costo_centavos) || data.precio_costo_centavos < 0) {
        errors.precio_costo = 'Ingrese un precio de costo válido, no negativo y con hasta dos decimales.';
      }
    }

    if (data.precio_venta_centavos !== undefined) {
      if (!Number.isSafeInteger(data.precio_venta_centavos) || data.precio_venta_centavos < 0) {
        errors.precio_venta = 'Ingrese un precio de venta válido, no negativo y con hasta dos decimales.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Determina si el precio de venta es inferior al de costo (margen negativo / advertencia de pérdida).
   */
  isMargenNegativo(precioCostoCentavos: number, precioVentaCentavos: number): boolean {
    return precioVentaCentavos < precioCostoCentavos;
  }

  /**
   * Obtiene todos los productos (por defecto sólo activos).
   */
  async getAll(includeArchived: boolean = false): Promise<Producto[]> {
    return this.repo.getAll(includeArchived);
  }

  /**
   * Obtiene un producto por su UUID.
   */
  async getById(id: string): Promise<Producto | null> {
    if (!id) throw new Error('ID de producto no proporcionado.');
    return this.repo.getById(id);
  }

  /**
   * Busca productos por coincidencia parcial en nombre.
   */
  async search(query: string, includeArchived: boolean = false): Promise<Producto[]> {
    return this.repo.search(query, includeArchived);
  }

  /**
   * Da de alta un nuevo producto.
   */
  async create(data: ProductoInsert): Promise<Producto> {
    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    // Verificar si ya existe un producto con el mismo nombre exacto (case-insensitive)
    const existentes = await this.repo.search(data.nombre.trim(), true);
    const duplicado = existentes.find(
      p => p.nombre.trim().toLowerCase() === data.nombre.trim().toLowerCase()
    );
    if (duplicado) {
      throw new Error(`Ya existe un producto con el nombre "${data.nombre.trim()}".`);
    }

    return this.repo.create({
      ...data,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      unidad: data.unidad || 'Unidad',
      precio_costo_centavos: Math.round(data.precio_costo_centavos ?? 0),
      precio_venta_centavos: Math.round(data.precio_venta_centavos ?? 0),
      activo: data.activo !== undefined ? data.activo : true,
    });
  }

  /**
   * Modifica un producto existente.
   */
  async update(id: string, data: ProductoUpdate): Promise<Producto> {
    if (!id) throw new Error('ID de producto requerido para actualizar.');

    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    if (data.nombre) {
      const existentes = await this.repo.search(data.nombre.trim(), true);
      const duplicado = existentes.find(
        p => p.id !== id && p.nombre.trim().toLowerCase() === data.nombre!.trim().toLowerCase()
      );
      if (duplicado) {
        throw new Error(`Ya existe otro producto con el nombre "${data.nombre.trim()}".`);
      }
    }

    return this.repo.update(id, {
      ...data,
      nombre: data.nombre ? data.nombre.trim() : undefined,
      descripcion: data.descripcion !== undefined ? data.descripcion?.trim() || null : undefined,
      precio_costo_centavos:
        data.precio_costo_centavos !== undefined
          ? Math.round(data.precio_costo_centavos)
          : undefined,
      precio_venta_centavos:
        data.precio_venta_centavos !== undefined
          ? Math.round(data.precio_venta_centavos)
          : undefined,
    });
  }

  /**
   * Da de baja / archiva un producto sin borrar el historial de pedidos.
   */
  async archive(id: string): Promise<void> {
    if (!id) throw new Error('ID de producto requerido para archivar.');
    return this.repo.archive(id);
  }

  /**
   * Restaura un producto archivado al estado activo.
   */
  async restore(id: string): Promise<void> {
    if (!id) throw new Error('ID de producto requerido para restaurar.');
    return this.repo.restore(id);
  }
}
