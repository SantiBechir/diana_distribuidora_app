import { clienteRepository, IClienteRepository } from '../repositories';
import { Cliente, ClienteInsert, ClienteUpdate } from '../types/database.types';

export interface ClienteValidationErrors {
  nombre?: string;
  cuil?: string;
  mail?: string;
  telefono?: string;
}

export class ClienteService {
  private repo: IClienteRepository;

  constructor(repo: IClienteRepository = clienteRepository) {
    this.repo = repo;
  }

  /**
   * Valida los datos de un cliente antes de persistir.
   */
  validate(data: Partial<ClienteInsert | ClienteUpdate>): {
    isValid: boolean;
    errors: ClienteValidationErrors;
  } {
    const errors: ClienteValidationErrors = {};

    if (data.nombre !== undefined) {
      if (!data.nombre || !data.nombre.trim()) {
        errors.nombre = 'El nombre es obligatorio.';
      } else if (data.nombre.trim().length < 2) {
        errors.nombre = 'El nombre debe tener al menos 2 caracteres.';
      }
    }

    if (data.cuil) {
      const cleanCuil = data.cuil.trim().replace(/[-\s]/g, '');
      if (cleanCuil.length > 0) {
        if (!/^\d{11}$/.test(cleanCuil)) {
          errors.cuil = 'El CUIL debe contener 11 dígitos numéricos (ej. 20-12345678-9).';
        }
      }
    }

    if (data.mail) {
      const cleanMail = data.mail.trim();
      if (cleanMail.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanMail)) {
          errors.mail = 'El formato del correo electrónico no es válido.';
        }
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

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Obtiene todos los clientes ordenados alfabéticamente.
   */
  async getAll(): Promise<Cliente[]> {
    return this.repo.getAll();
  }

  /**
   * Obtiene un cliente por su identificador UUID.
   */
  async getById(id: string): Promise<Cliente | null> {
    if (!id) throw new Error('ID de cliente no proporcionado.');
    return this.repo.getById(id);
  }

  /**
   * Busca clientes por nombre o por CUIL.
   */
  async search(query: string): Promise<Cliente[]> {
    return this.repo.search(query);
  }

  /**
   * Da de alta un nuevo cliente aplicando validaciones de negocio.
   */
  async create(data: ClienteInsert): Promise<Cliente> {
    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    // Normalizar formato de CUIL si viene informado
    let cuilFormateado = data.cuil?.trim() || null;
    if (cuilFormateado) {
      const clean = cuilFormateado.replace(/[-\s]/g, '');
      if (clean.length === 11) {
        cuilFormateado = `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
      }
    }

    return this.repo.create({
      ...data,
      nombre: data.nombre.trim(),
      cuil: cuilFormateado,
      mail: data.mail?.trim() || null,
      telefono: data.telefono?.trim() || null,
      direccion: data.direccion?.trim() || null,
      notas: data.notas?.trim() || null,
      tipo: data.tipo || 'Regular',
      saldo_centavos: data.saldo_centavos ?? 0,
    });
  }

  /**
   * Modifica un cliente existente aplicando validaciones.
   */
  async update(id: string, data: ClienteUpdate): Promise<Cliente> {
    if (!id) throw new Error('ID de cliente requerido para actualizar.');

    const { isValid, errors } = this.validate(data);
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }

    let cuilFormateado = data.cuil !== undefined ? data.cuil?.trim() || null : undefined;
    if (cuilFormateado) {
      const clean = cuilFormateado.replace(/[-\s]/g, '');
      if (clean.length === 11) {
        cuilFormateado = `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
      }
    }

    return this.repo.update(id, {
      ...data,
      nombre: data.nombre ? data.nombre.trim() : undefined,
      cuil: cuilFormateado,
      mail: data.mail !== undefined ? data.mail?.trim() || null : undefined,
      telefono: data.telefono !== undefined ? data.telefono?.trim() || null : undefined,
      direccion: data.direccion !== undefined ? data.direccion?.trim() || null : undefined,
      notas: data.notas !== undefined ? data.notas?.trim() || null : undefined,
    });
  }

  /**
   * Elimina un cliente.
   */
  async delete(id: string): Promise<void> {
    if (!id) throw new Error('ID de cliente requerido para eliminar.');
    return this.repo.delete(id);
  }

  /**
   * Actualiza el saldo en centavos del cliente.
   */
  async updateSaldo(id: string, nuevoSaldoCentavos: number): Promise<void> {
    if (!id) throw new Error('ID de cliente requerido para actualizar saldo.');
    return this.repo.updateSaldo(id, nuevoSaldoCentavos);
  }
}
