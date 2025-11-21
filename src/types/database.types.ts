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
  proveedor_id: string | null;
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

// Tipos con relaciones
export type PedidoCompleto = Pedido & {
  cliente: Cliente;
  pedido_lineas: (PedidoLinea & {
    producto: Producto;
    proveedor: Proveedor | null;
  })[];
  pagos_clientes: PagoCliente[];
};