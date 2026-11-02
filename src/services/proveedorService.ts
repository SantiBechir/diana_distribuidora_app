import { proveedorRepository, IProveedorRepository } from '../repositories';
import { Proveedor, ProveedorInsert, ProveedorUpdate } from '../types/database.types';

export interface ProveedorValidationErrors {
  nombre?: string;
  telefono?: string;
  saldo_centavos?: string;
}

export class ProveedorService {
  private repo: IProveedorRepository;

  constructor(repo: IProveedorRepository = proveedorRepository) {
    this.repo = repo;
  }

  /**
   * Valida los datos de un proveedor.
   */
  validate(data: Partial<ProveedorInsert | ProveedorUpdate>): {
    isValid: boolean;
    errors: ProveedorValidationErrors;
  } {
    const errors: ProveedorValidationErrors = {};

    if (data.nombre !== undefined) {
      if (!data.nombre || !data.nombre.trim()) {
        errors.nombre = 'El nombre del proveedor es obligatorio.';
      } else if (data.nombre.trim().length < 2) {
        errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
      }
    }

    if (data.telefono) {
      const cleanTel = data.telefono.trim();
      if (cleanTel.length > 0) {
        const phoneRegex = /^[0-9+\s\-()]{6,20}$/;
        if (!phoneRegex.test(cleanTel)) {
          errors.telefono = 'El formato del teléfono no es válido.';
        }
      }
    }

    if (data.saldo_centavos !== undefined &&
        (!Number.isSafeInteger(data.saldo_centavos) || data.saldo_centavos < 0)) {
      errors.saldo_centavos = 'El saldo inicial debe ser un importe válido mayor o igual a cero.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Obtiene todos los proveedores ordenados alfabéticamente.
   */
  async getAll(): Promise<Proveedor[]> {
    return this.repo.getAll();
  }

  /**
   * Obtiene un proveedor por su identificador UUID.
   */
  async getById(id: string): Promise<Proveedor | null> {
    if (!id) throw new Error('ID de proveedor no proporcionado.');
    return this.repo.getById(id);
  }

  /**
   * Busca proveedores por nombre.
   */
  async search(query: string): Promise<Proveedor[]> {
    return this.repo.search(query);
  }

  /**
   * Da de alta un nuevo proveedor.
   */
  async create(data: ProveedorInsert): Promise<Proveedor> {
    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    // Verificar si ya existe un proveedor con el mismo nombre (case-insensitive)
    const existentes = await this.repo.search(data.nombre.trim());
    const duplicado = existentes.find(
      p => p.nombre.trim().toLowerCase() === data.nombre.trim().toLowerCase()
    );
    if (duplicado) {
      throw new Error(`Ya existe un proveedor con el nombre "${data.nombre.trim()}".`);
    }

    return this.repo.create({
      ...data,
      nombre: data.nombre.trim(),
      direccion: data.direccion?.trim() || null,
      telefono: data.telefono?.trim() || null,
      saldo_centavos: Math.round(data.saldo_centavos ?? 0),
    });
  }

  /**
   * Modifica un proveedor existente.
   */
  async update(id: string, data: ProveedorUpdate): Promise<Proveedor> {
    if (!id) throw new Error('ID de proveedor requerido para actualizar.');

    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    if (data.nombre) {
      const existentes = await this.repo.search(data.nombre.trim());
      const duplicado = existentes.find(
        p => p.id !== id && p.nombre.trim().toLowerCase() === data.nombre!.trim().toLowerCase()
      );
      if (duplicado) {
        throw new Error(`Ya existe otro proveedor con el nombre "${data.nombre.trim()}".`);
      }
    }

    return this.repo.update(id, {
      ...data,
      nombre: data.nombre ? data.nombre.trim() : undefined,
      direccion: data.direccion !== undefined ? data.direccion?.trim() || null : undefined,
      telefono: data.telefono !== undefined ? data.telefono?.trim() || null : undefined,
    });
  }

  /**
   * Elimina un proveedor.
   */
  async delete(id: string): Promise<void> {
    if (!id) throw new Error('ID de proveedor requerido para eliminar.');
    return this.repo.delete(id);
  }

  /**
   * Actualiza el saldo en centavos adeudado al proveedor.
   */
  async updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void> {
    if (!id) throw new Error('ID de proveedor requerido para actualizar saldo.');
    return this.repo.updateSaldo(id, nuevoSaldoCentavos);
  }
}
