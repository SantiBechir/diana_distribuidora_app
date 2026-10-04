-- ==============================================================================
-- FASE 1: MODELO Y SEGURIDAD (Supabase Migration)
-- Responsable: Ale
-- 
-- Características implementadas:
-- 1. Todas las entidades con IDs UUID generados automáticamente (gen_random_uuid()).
-- 2. Importes monetarios representados en CENTAVOS (BIGINT) para evitar errores de redondeo.
-- 3. user_id vinculado a auth.users(id) con DEFAULT auth.uid() en todas las tablas.
-- 4. Row Level Security (RLS) habilitado en el 100% de las tablas con políticas
--    que aíslan los datos de la demo por usuario anónimo.
-- 5. Relaciones obligatorias:
--    - Cada pago de cliente pertenece obligatoriamente a un pedido (pedido_id NOT NULL).
--    - Cada pago a proveedor pertenece obligatoriamente a un proveedor (proveedor_id NOT NULL).
-- 6. Modelado de Crédito y Excedentes (creditos_clientes y credito_aplicaciones)
--    para aplicar saldos a favor sin duplicar dinero recibido.
-- 7. Soporte para archivado de productos (activo BOOLEAN DEFAULT true) sin perder historial.
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpieza de tablas previas (permite recrear la base desde el repositorio sin conflictos)
DROP TABLE IF EXISTS public.credito_aplicaciones CASCADE;
DROP TABLE IF EXISTS public.creditos_clientes CASCADE;
DROP TABLE IF EXISTS public.pagos_clientes CASCADE;
DROP TABLE IF EXISTS public.pagos_proveedores CASCADE;
DROP TABLE IF EXISTS public.pedido_lineas CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- 3. Función trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Tabla: CLIENTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nombre TEXT NOT NULL,
  cuil TEXT,
  direccion TEXT,
  telefono TEXT,
  mail TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('Regular', 'Licitación')) DEFAULT 'Regular',
  notas TEXT,
  saldo_centavos BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_user_nombre ON public.clientes (user_id, nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_user_cuil ON public.clientes (user_id, cuil);

DROP TRIGGER IF EXISTS tr_clientes_updated_at ON public.clientes;
CREATE TRIGGER tr_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Tabla: PRODUCTOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  unidad TEXT NOT NULL CHECK (unidad IN ('Kg', 'Bolsa', 'Unidad')) DEFAULT 'Kg',
  precio_costo_centavos BIGINT NOT NULL DEFAULT 0 CHECK (precio_costo_centavos >= 0),
  precio_venta_centavos BIGINT NOT NULL DEFAULT 0 CHECK (precio_venta_centavos >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_user_nombre ON public.productos (user_id, nombre);
CREATE INDEX IF NOT EXISTS idx_productos_user_activo ON public.productos (user_id, activo);

DROP TRIGGER IF EXISTS tr_productos_updated_at ON public.productos;
CREATE TRIGGER tr_productos_updated_at
BEFORE UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Tabla: PROVEEDORES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  saldo_centavos BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_user_nombre ON public.proveedores (user_id, nombre);

DROP TRIGGER IF EXISTS tr_proveedores_updated_at ON public.proveedores;
CREATE TRIGGER tr_proveedores_updated_at
BEFORE UPDATE ON public.proveedores
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Tabla: PEDIDOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  numero_pedido BIGINT GENERATED BY DEFAULT AS IDENTITY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_centavos BIGINT NOT NULL DEFAULT 0 CHECK (total_centavos >= 0),
  total_costo_centavos BIGINT NOT NULL DEFAULT 0 CHECK (total_costo_centavos >= 0),
  estado TEXT NOT NULL CHECK (estado IN ('Impago', 'Pagado Parcialmente', 'Pagado', 'Cancelado')) DEFAULT 'Impago',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_user_cliente ON public.pedidos (user_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_fecha ON public.pedidos (user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_estado ON public.pedidos (user_id, estado);

DROP TRIGGER IF EXISTS tr_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER tr_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Tabla: PEDIDO_LINEAS (Líneas de Pedido)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedido_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
  precio_unit_costo_centavos BIGINT NOT NULL CHECK (precio_unit_costo_centavos >= 0),
  precio_unit_venta_centavos BIGINT NOT NULL CHECK (precio_unit_venta_centavos >= 0),
  subtotal_costo_centavos BIGINT NOT NULL CHECK (subtotal_costo_centavos >= 0),
  subtotal_venta_centavos BIGINT NOT NULL CHECK (subtotal_venta_centavos >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedido_lineas_pedido ON public.pedido_lineas (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_producto ON public.pedido_lineas (producto_id);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_proveedor ON public.pedido_lineas (proveedor_id);

-- ------------------------------------------------------------------------------
-- 8. Tabla: PAGOS_CLIENTES (Relación obligatoria con pedido_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  metodo_pago TEXT DEFAULT 'Efectivo',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_clientes_user_cliente ON public.pagos_clientes (user_id, cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_clientes_user_pedido ON public.pagos_clientes (user_id, pedido_id);

-- ------------------------------------------------------------------------------
-- 9. Tabla: PAGOS_PROVEEDORES (Relación obligatoria con proveedor_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
  monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  metodo_pago TEXT DEFAULT 'Efectivo',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_proveedores_user_proveedor ON public.pagos_proveedores (user_id, proveedor_id);

-- ------------------------------------------------------------------------------
-- 10. Tabla: CREDITOS_CLIENTES (Excedentes / Saldo a favor por cliente)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creditos_clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  pago_origen_id UUID REFERENCES public.pagos_clientes(id) ON DELETE SET NULL,
  monto_total_centavos BIGINT NOT NULL CHECK (monto_total_centavos > 0),
  saldo_disponible_centavos BIGINT NOT NULL CHECK (saldo_disponible_centavos >= 0),
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creditos_clientes_user_cliente ON public.creditos_clientes (user_id, cliente_id);

-- ------------------------------------------------------------------------------
-- 11. Tabla: CREDITO_APLICACIONES (Aplicaciones de crédito a pedidos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credito_aplicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  credito_id UUID NOT NULL REFERENCES public.creditos_clientes(id) ON DELETE RESTRICT,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  monto_aplicado_centavos BIGINT NOT NULL CHECK (monto_aplicado_centavos > 0),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credito_aplicaciones_pedido ON public.credito_aplicaciones (pedido_id);
CREATE INDEX IF NOT EXISTS idx_credito_aplicaciones_credito ON public.credito_aplicaciones (credito_id);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) - AISLAMIENTO TOTAL POR DEMO USER
-- Cada usuario anónimo solo puede leer, insertar, modificar y borrar sus propios datos.
-- ==============================================================================

-- A. Clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select_policy" ON public.clientes
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "clientes_insert_policy" ON public.clientes
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clientes_update_policy" ON public.clientes
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clientes_delete_policy" ON public.clientes
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- B. Productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "productos_select_policy" ON public.productos
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "productos_insert_policy" ON public.productos
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "productos_update_policy" ON public.productos
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "productos_delete_policy" ON public.productos
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- C. Proveedores
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proveedores_select_policy" ON public.proveedores
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "proveedores_insert_policy" ON public.proveedores
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proveedores_update_policy" ON public.proveedores
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "proveedores_delete_policy" ON public.proveedores
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- D. Pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select_policy" ON public.pedidos
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "pedidos_insert_policy" ON public.pedidos
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedidos_update_policy" ON public.pedidos
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedidos_delete_policy" ON public.pedidos
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- E. Pedido Líneas
ALTER TABLE public.pedido_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedido_lineas_select_policy" ON public.pedido_lineas
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "pedido_lineas_insert_policy" ON public.pedido_lineas
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedido_lineas_update_policy" ON public.pedido_lineas
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pedido_lineas_delete_policy" ON public.pedido_lineas
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- F. Pagos Clientes
ALTER TABLE public.pagos_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_clientes_select_policy" ON public.pagos_clientes
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "pagos_clientes_insert_policy" ON public.pagos_clientes
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagos_clientes_update_policy" ON public.pagos_clientes
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagos_clientes_delete_policy" ON public.pagos_clientes
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- G. Pagos Proveedores
ALTER TABLE public.pagos_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_proveedores_select_policy" ON public.pagos_proveedores
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "pagos_proveedores_insert_policy" ON public.pagos_proveedores
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagos_proveedores_update_policy" ON public.pagos_proveedores
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pagos_proveedores_delete_policy" ON public.pagos_proveedores
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- H. Créditos Clientes
ALTER TABLE public.creditos_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creditos_clientes_select_policy" ON public.creditos_clientes
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "creditos_clientes_insert_policy" ON public.creditos_clientes
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creditos_clientes_update_policy" ON public.creditos_clientes
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creditos_clientes_delete_policy" ON public.creditos_clientes
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);

-- I. Crédito Aplicaciones
ALTER TABLE public.credito_aplicaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credito_aplicaciones_select_policy" ON public.credito_aplicaciones
  FOR SELECT TO authenticated, anon USING (auth.uid() = user_id);

CREATE POLICY "credito_aplicaciones_insert_policy" ON public.credito_aplicaciones
  FOR INSERT TO authenticated, anon WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credito_aplicaciones_update_policy" ON public.credito_aplicaciones
  FOR UPDATE TO authenticated, anon USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "credito_aplicaciones_delete_policy" ON public.credito_aplicaciones
  FOR DELETE TO authenticated, anon USING (auth.uid() = user_id);
