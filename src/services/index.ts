import { ClienteService } from './clienteService';
import { ProductoService } from './productoService';
import { ProveedorService } from './proveedorService';
import { PedidoService } from './pedidoService';

export * from './clienteService';
export * from './productoService';
export * from './proveedorService';
export * from './pedidoService';

export const clienteService = new ClienteService();
export const productoService = new ProductoService();
export const proveedorService = new ProveedorService();
export const pedidoService = new PedidoService();
