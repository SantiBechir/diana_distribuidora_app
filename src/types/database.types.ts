// Tipos base de las tablas
export type Cliente = {
  id: string;
  nombre: string;
  cuil: string | null;
  direccion: string | null;
  telefono: string | null;
  mail: string | null;
  tipo: 'Regular' | 'Licitación';
  saldo: number;
  created_at: string;
};

export type Producto = {
  id: string;
  nombre: string;
  unidad: 'Kg' | 'Bolsa' | 'Unidad';
  precio_costo: number;
  precio_venta: number;
  created_at: string;
};

export type Proveedor = {
  id: string;
  nombre: string;
  saldo: number;
  direccion: string | null;
  created_at: string;
};

export type Pedido = {
  id: string;
  cliente_id: string;
  total: number;
  fecha: string;
  estado: 'Pagado' | 'Impago' | 'Pagado Parcialmente';
  created_at: string;
};

export type PedidoLinea = {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unit_costo: number;
  precio_unit_venta: number;
  created_at: string;
};

export type PagoCliente = {
  id: string;
  pedido_id: string | null;
  cliente_id: string;
  fecha: string;
  monto: number;
  created_at: string;
};

export type PagoProveedor = {
  id: string;
  proveedor_id: string;
  fecha: string;
  monto: number;
  created_at: string;
};

// Tipos para crear (sin id, saldo, created_at)
export type ClienteInsert = Omit<Cliente, 'id' | 'saldo' | 'created_at'>;
export type ProductoInsert = Omit<Producto, 'id' | 'created_at'>;
export type ProveedorInsert = Omit<Proveedor, 'id' | 'saldo' | 'created_at'>;
export type PedidoInsert = Omit<Pedido, 'id' | 'total' | 'estado' | 'created_at'>;
export type PedidoLineaInsert = Omit<PedidoLinea, 'id' | 'created_at'>;
export type PagoClienteInsert = Omit<PagoCliente, 'id' | 'created_at'>;
export type PagoProveedorInsert = Omit<PagoProveedor, 'id' | 'created_at'>;

// Tipos para actualizar (todos opcionales excepto id)
export type ClienteUpdate = Partial<Omit<Cliente, 'id' | 'created_at'>>;
export type ProductoUpdate = Partial<Omit<Producto, 'id' | 'created_at'>>;
export type ProveedorUpdate = Partial<Omit<Proveedor, 'id' | 'created_at'>>;
export type PedidoUpdate = Partial<Omit<Pedido, 'id' | 'created_at'>>;

// Tipos con relaciones (para queries con joins)
export type PedidoConCliente = Pedido & {
  cliente: Cliente;
};

export type PedidoConLineas = Pedido & {
  pedido_lineas: (PedidoLinea & {
    producto: Producto;
  })[];
};

export type PedidoCompleto = Pedido & {
  cliente: Cliente;
  pedido_lineas: (PedidoLinea & {
    producto: Producto;
  })[];
  pagos_clientes: PagoCliente[];
};