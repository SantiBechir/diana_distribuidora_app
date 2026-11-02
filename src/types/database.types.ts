/**
 * Tipos de datos alineados con el esquema de base de datos Supabase (Fase 1).
 * 7 Entidades Oficiales según Diagrama de Diseño:
 * 1. clientes
 * 2. productos
 * 3. proveedores
 * 4. pedidos
 * 5. pedido_lineas
 * 6. pagos_clientes (obligatoriamente vinculado a pedido_id)
 * 7. pagos_proveedores (obligatoriamente vinculado a proveedor_id)
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
  nombre: string;
  cuil: string | null;
  direccion: string | null;
  telefono: string | null;
  mail: string | null;
  tipo: TipoCliente;
  notas?: string | null;
  saldo_centavos: number; // Saldo deudor en centavos (>0 debe, <0 a favor / crédito)
  saldo: number; // Compatibilidad con vistas previas (en pesos)
  created_at: string;
  updated_at?: string;
}

export interface Producto {
  id: string; // UUID
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
  proveedor_id: string; // UUID OBLIGATORIO: cada pago a proveedor pertenece a un proveedor
  monto_centavos: number; // Importe en centavos
  monto: number; // Compatibilidad
  fecha: string;
  metodo_pago?: string | null;
  notas?: string | null;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Tipos para Inserción (Insert) y Actualización (Update)
// ------------------------------------------------------------------------------

export interface ClienteInsert {
  id?: string;
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
  proveedor_id: string;
  monto_centavos: number;
  monto?: number;
  fecha?: string;
  metodo_pago?: string | null;
  notas?: string | null;
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
}

// ------------------------------------------------------------------------------
// Definición del esquema Supabase Database para el cliente supabase-js
// ------------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: Omit<Cliente, 'saldo'>;
        Insert: Omit<ClienteInsert, 'saldo'>;
        Update: Omit<ClienteUpdate, 'saldo'>;
        Relationships: [];
      };
      productos: {
        Row: Omit<Producto, 'precio_costo' | 'precio_venta'>;
        Insert: Omit<ProductoInsert, 'precio_costo' | 'precio_venta'>;
        Update: Omit<ProductoUpdate, 'precio_costo' | 'precio_venta'>;
        Relationships: [];
      };
      proveedores: {
        Row: Omit<Proveedor, 'saldo'>;
        Insert: Omit<ProveedorInsert, 'saldo'>;
        Update: Omit<ProveedorUpdate, 'saldo'>;
        Relationships: [];
      };
      pedidos: {
        Row: Omit<Pedido, 'total'>;
        Insert: Omit<PedidoInsert, 'total'>;
        Update: Omit<PedidoUpdate, 'total'>;
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
        Row: Omit<PedidoLinea, 'precio_unit_costo' | 'precio_unit_venta'>;
        Insert: Omit<PedidoLineaInsert, 'precio_unit_costo' | 'precio_unit_venta'>;
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
        Row: Omit<PagoCliente, 'monto'>;
        Insert: Omit<PagoClienteInsert, 'monto'>;
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
            columns: ['pedido_id', 'cliente_id'];
            isOneToOne: false;
            referencedRelation: 'pedidos';
            referencedColumns: ['id', 'cliente_id'];
          }
        ];
      };
      pagos_proveedores: {
        Row: Omit<PagoProveedor, 'monto'>;
        Insert: Omit<PagoProveedorInsert, 'monto'>;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      guardar_pedido: {
        Args: {
          p_pedido: PedidoInsert | PedidoUpdate;
          p_lineas?: Omit<PedidoLineaInsert, 'pedido_id'>[] | null;
          p_id?: string;
        };
        Returns: string;
      };
      cancelar_pedido: {
        Args: { p_id: string };
        Returns: undefined;
      };
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
