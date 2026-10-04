/**
 * Tipos de datos alineados con el esquema de base de datos Supabase (Fase 1).
 * Todos los importes monetarios canónicos se manejan en CENTAVOS (números enteros)
 * para evitar problemas de precisión en operaciones financieras.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ------------------------------------------------------------------------------
// Enums del Dominio
// ------------------------------------------------------------------------------
export type TipoCliente = 'Regular' | 'Licitación';
export type UnidadProducto = 'Kg' | 'Bolsa' | 'Unidad';
export type EstadoPedido = 'Impago' | 'Pagado Parcialmente' | 'Pagado' | 'Cancelado';

// ------------------------------------------------------------------------------
// Entidades de Dominio
// ------------------------------------------------------------------------------

export interface Cliente {
  id: string; // UUID
  user_id?: string; // UUID del usuario autenticado anónimo (RLS)
  nombre: string;
  cuil: string | null;
  direccion: string | null;
  telefono: string | null;
  mail: string | null;
  tipo: TipoCliente;
  notas?: string | null;
  saldo_centavos: number; // Saldo deudor en centavos (>0 debe, <0 a favor)
  saldo: number; // Compatibilidad con vistas previas (en pesos o centavos)
  created_at: string;
  updated_at?: string;
}

export interface Producto {
  id: string; // UUID
  user_id?: string;
  nombre: string;
  descripcion?: string | null;
  unidad: UnidadProducto;
  precio_costo_centavos: number; // En centavos
  precio_venta_centavos: number; // En centavos
  precio_costo: number; // Compatibilidad con vistas previas
  precio_venta: number; // Compatibilidad con vistas previas
  activo: boolean; // Permite archivar producto sin borrar historial de pedidos
  created_at: string;
  updated_at?: string;
}

export interface Proveedor {
  id: string; // UUID
  user_id?: string;
  nombre: string;
  direccion: string | null;
  telefono?: string | null;
  saldo_centavos: number; // Deuda con el proveedor en centavos
  saldo: number; // Compatibilidad con vistas previas
  created_at: string;
  updated_at?: string;
}

export interface Pedido {
  id: string; // UUID
  user_id?: string;
  numero_pedido?: number; // Contador secuencial para visualización (#1, #2...)
  cliente_id: string; // UUID
  fecha: string;
  total_centavos: number; // Total venta en centavos
  total_costo_centavos: number; // Total costo en centavos
  total: number; // Compatibilidad con vistas previas
  estado: EstadoPedido;
  notas?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PedidoLinea {
  id: string; // UUID
  user_id?: string;
  pedido_id: string; // UUID
  producto_id: string; // UUID
  proveedor_id: string; // UUID (Cada línea conserva proveedor)
  cantidad: number;
  precio_unit_costo_centavos: number;
  precio_unit_venta_centavos: number;
  subtotal_costo_centavos: number;
  subtotal_venta_centavos: number;
  precio_unit_costo: number; // Compatibilidad
  precio_unit_venta: number; // Compatibilidad
  created_at: string;
}

export interface PagoCliente {
  id: string; // UUID
  user_id?: string;
  cliente_id: string; // UUID
  pedido_id: string; // UUID OBLIGATORIO: cada pago pertenece a un pedido
  monto_centavos: number; // Importe en centavos
  monto: number; // Compatibilidad
  fecha: string;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at: string;
}

export interface PagoProveedor {
  id: string; // UUID
  user_id?: string;
  proveedor_id: string; // UUID OBLIGATORIO: cada pago a proveedor pertenece a un proveedor
  monto_centavos: number; // Importe en centavos
  monto: number; // Compatibilidad
  fecha: string;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at: string;
}

export interface CreditoCliente {
  id: string; // UUID
  user_id?: string;
  cliente_id: string; // UUID
  pago_origen_id?: string | null; // UUID del pago de donde provino el excedente
  monto_total_centavos: number;
  saldo_disponible_centavos: number; // Crédito disponible restante
  notas?: string | null;
  created_at: string;
}

export interface CreditoAplicacion {
  id: string; // UUID
  user_id?: string;
  credito_id: string; // UUID
  pedido_id: string; // UUID
  cliente_id: string; // UUID
  monto_aplicado_centavos: number;
  fecha: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Tipos para Inserción (Insert) y Actualización (Update)
// ------------------------------------------------------------------------------

export interface ClienteInsert {
  id?: string;
  user_id?: string;
  nombre: string;
  cuil?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  mail?: string | null;
  tipo?: TipoCliente;
  notas?: string | null;
  saldo_centavos?: number;
  saldo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteUpdate {
  nombre?: string;
  cuil?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  mail?: string | null;
  tipo?: TipoCliente;
  notas?: string | null;
  saldo_centavos?: number;
  saldo?: number;
  updated_at?: string;
}

export interface ProductoInsert {
  id?: string;
  user_id?: string;
  nombre: string;
  descripcion?: string | null;
  unidad?: UnidadProducto;
  precio_costo_centavos?: number;
  precio_venta_centavos?: number;
  precio_costo?: number;
  precio_venta?: number;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string | null;
  unidad?: UnidadProducto;
  precio_costo_centavos?: number;
  precio_venta_centavos?: number;
  precio_costo?: number;
  precio_venta?: number;
  activo?: boolean;
  updated_at?: string;
}

export interface ProveedorInsert {
  id?: string;
  user_id?: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  saldo_centavos?: number;
  saldo?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProveedorUpdate {
  nombre?: string;
  direccion?: string | null;
  telefono?: string | null;
  saldo_centavos?: number;
  saldo?: number;
  updated_at?: string;
}

export interface PedidoInsert {
  id?: string;
  user_id?: string;
  cliente_id: string;
  fecha?: string;
  total_centavos?: number;
  total_costo_centavos?: number;
  total?: number;
  estado?: EstadoPedido;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PedidoUpdate {
  cliente_id?: string;
  fecha?: string;
  total_centavos?: number;
  total_costo_centavos?: number;
  total?: number;
  estado?: EstadoPedido;
  notas?: string | null;
  updated_at?: string;
}

export interface PedidoLineaInsert {
  id?: string;
  user_id?: string;
  pedido_id?: string;
  producto_id: string;
  proveedor_id: string;
  cantidad: number;
  precio_unit_costo_centavos: number;
  precio_unit_venta_centavos: number;
  subtotal_costo_centavos?: number;
  subtotal_venta_centavos?: number;
  precio_unit_costo?: number;
  precio_unit_venta?: number;
  created_at?: string;
}

export interface PagoClienteInsert {
  id?: string;
  user_id?: string;
  cliente_id: string;
  pedido_id: string;
  monto_centavos: number;
  monto?: number;
  fecha?: string;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at?: string;
}

export interface PagoProveedorInsert {
  id?: string;
  user_id?: string;
  proveedor_id: string;
  monto_centavos: number;
  monto?: number;
  fecha?: string;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at?: string;
}

export interface CreditoClienteInsert {
  id?: string;
  user_id?: string;
  cliente_id: string;
  pago_origen_id?: string | null;
  monto_total_centavos: number;
  saldo_disponible_centavos?: number;
  notas?: string | null;
  created_at?: string;
}

export interface CreditoAplicacionInsert {
  id?: string;
  user_id?: string;
  credito_id: string;
  pedido_id: string;
  cliente_id: string;
  monto_aplicado_centavos: number;
  fecha?: string;
  created_at?: string;
}

// ------------------------------------------------------------------------------
// Tipos con Relaciones (Joins / Vistas Enriquecidas)
// ------------------------------------------------------------------------------

export interface PedidoLineaConProducto extends PedidoLinea {
  producto: Producto;
  proveedor?: Proveedor;
}

export interface PedidoConCliente extends Pedido {
  cliente: Cliente;
}

export interface PedidoConLineas extends Pedido {
  pedido_lineas: PedidoLineaConProducto[];
}

export interface PedidoCompleto extends Pedido {
  cliente: Cliente;
  pedido_lineas: PedidoLineaConProducto[];
  pagos_clientes: PagoCliente[];
  credito_aplicaciones?: CreditoAplicacion[];
}

export interface CreditoConAplicaciones extends CreditoCliente {
  aplicaciones: CreditoAplicacion[];
}

// ------------------------------------------------------------------------------
// Definición del esquema Supabase Database para el cliente supabase-js
// ------------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: Cliente;
        Insert: ClienteInsert;
        Update: ClienteUpdate;
        Relationships: [];
      };
      productos: {
        Row: Producto;
        Insert: ProductoInsert;
        Update: ProductoUpdate;
        Relationships: [];
      };
      proveedores: {
        Row: Proveedor;
        Insert: ProveedorInsert;
        Update: ProveedorUpdate;
        Relationships: [];
      };
      pedidos: {
        Row: Pedido;
        Insert: PedidoInsert;
        Update: PedidoUpdate;
        Relationships: [
          {
            foreignKeyName: 'pedidos_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          }
        ];
      };
      pedido_lineas: {
        Row: PedidoLinea;
        Insert: PedidoLineaInsert;
        Update: Partial<PedidoLineaInsert>;
        Relationships: [
          {
            foreignKeyName: 'pedido_lineas_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedido_lineas_producto_id_fkey';
            columns: ['producto_id'];
            isOneToOne: false;
            referencedRelation: 'productos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pedido_lineas_proveedor_id_fkey';
            columns: ['proveedor_id'];
            isOneToOne: false;
            referencedRelation: 'proveedores';
            referencedColumns: ['id'];
          }
        ];
      };
      pagos_clientes: {
        Row: PagoCliente;
        Insert: PagoClienteInsert;
        Update: Partial<PagoClienteInsert>;
        Relationships: [
          {
            foreignKeyName: 'pagos_clientes_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pagos_clientes_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          }
        ];
      };
      pagos_proveedores: {
        Row: PagoProveedor;
        Insert: PagoProveedorInsert;
        Update: Partial<PagoProveedorInsert>;
        Relationships: [
          {
            foreignKeyName: 'pagos_proveedores_proveedor_id_fkey';
            columns: ['proveedor_id'];
            isOneToOne: false;
            referencedRelation: 'proveedores';
            referencedColumns: ['id'];
          }
        ];
      };
      creditos_clientes: {
        Row: CreditoCliente;
        Insert: CreditoClienteInsert;
        Update: Partial<CreditoClienteInsert>;
        Relationships: [
          {
            foreignKeyName: 'creditos_clientes_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          }
        ];
      };
      credito_aplicaciones: {
        Row: CreditoAplicacion;
        Insert: CreditoAplicacionInsert;
        Update: Partial<CreditoAplicacionInsert>;
        Relationships: [
          {
            foreignKeyName: 'credito_aplicaciones_credito_id_fkey';
            columns: ['credito_id'];
            isOneToOne: false;
            referencedRelation: 'creditos_clientes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credito_aplicaciones_pedido_id_fkey';
            columns: ['pedido_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      tipo_cliente: TipoCliente;
      unidad_producto: UnidadProducto;
      estado_pedido: EstadoPedido;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}