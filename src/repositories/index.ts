// ==============================================================================
// CONTRATO DE REPOSITORIOS (FASE 1: ALE)
// ==============================================================================
// Expone las interfaces y las instancias activas de los repositorios.
// Las capas superiores (pantallas, servicios y controladores) consumen
// estas instancias sin interactuar directamente con Supabase o SQLite.
// ==============================================================================

// Interfaces
export * from './interfaces/IClienteRepository';
export * from './interfaces/IProductoRepository';
export * from './interfaces/IProveedorRepository';
export * from './interfaces/IPedidoRepository';
export * from './interfaces/IPagoClienteRepository';
export * from './interfaces/IPagoProveedorRepository';
export * from './interfaces/ICreditoRepository';

// Implementaciones Supabase
import { SupabaseClienteRepository } from './supabase/SupabaseClienteRepository';
import { SupabaseProductoRepository } from './supabase/SupabaseProductoRepository';
import { SupabaseProveedorRepository } from './supabase/SupabaseProveedorRepository';
import { SupabasePedidoRepository } from './supabase/SupabasePedidoRepository';
import { SupabasePagoClienteRepository } from './supabase/SupabasePagoClienteRepository';
import { SupabasePagoProveedorRepository } from './supabase/SupabasePagoProveedorRepository';
import { SupabaseCreditoRepository } from './supabase/SupabaseCreditoRepository';

import { IClienteRepository } from './interfaces/IClienteRepository';
import { IProductoRepository } from './interfaces/IProductoRepository';
import { IProveedorRepository } from './interfaces/IProveedorRepository';
import { IPedidoRepository } from './interfaces/IPedidoRepository';
import { IPagoClienteRepository } from './interfaces/IPagoClienteRepository';
import { IPagoProveedorRepository } from './interfaces/IPagoProveedorRepository';
import { ICreditoRepository } from './interfaces/ICreditoRepository';

// Instancias singleton exportadas para la aplicación
export const clienteRepository: IClienteRepository = new SupabaseClienteRepository();
export const productoRepository: IProductoRepository = new SupabaseProductoRepository();
export const proveedorRepository: IProveedorRepository = new SupabaseProveedorRepository();
export const pedidoRepository: IPedidoRepository = new SupabasePedidoRepository();
export const pagoClienteRepository: IPagoClienteRepository = new SupabasePagoClienteRepository();
export const pagoProveedorRepository: IPagoProveedorRepository = new SupabasePagoProveedorRepository();
export const creditoRepository: ICreditoRepository = new SupabaseCreditoRepository();
