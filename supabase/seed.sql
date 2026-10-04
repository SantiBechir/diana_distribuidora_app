-- ==============================================================================
-- FASE 1: DATOS SEMILLA PARA DEMO (Seed Data)
-- Permite cargar datos iniciales de prueba en la base de datos de Supabase.
-- 
-- NOTA: Si se ejecuta desde el SQL Editor de Supabase vinculado a un usuario autenticado,
-- auth.uid() asignará automáticamente las entidades a dicho usuario.
-- Si se ejecuta como servicio o admin, se puede sustituir '00000000-0000-0000-0000-000000000000'
-- por el UID del usuario de prueba.
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID := coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  v_cliente_1 UUID := 'a1111111-1111-1111-1111-111111111111';
  v_cliente_2 UUID := 'a2222222-2222-2222-2222-222222222222';
  v_cliente_3 UUID := 'a3333333-3333-3333-3333-333333333333';
  v_proveedor_1 UUID := 'b1111111-1111-1111-1111-111111111111';
  v_proveedor_2 UUID := 'b2222222-2222-2222-2222-222222222222';
  v_prod_papa UUID := 'c1111111-1111-1111-1111-111111111111';
  v_prod_tomate UUID := 'c2222222-2222-2222-2222-222222222222';
  v_prod_cebolla UUID := 'c3333333-3333-3333-3333-333333333333';
  v_pedido_1 UUID := 'd1111111-1111-1111-1111-111111111111';
BEGIN
  -- Si el usuario no existe en auth.users (caso admin/script puro), asegurarse de que exista un usuario dummy
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    -- En entornos donde auth.uid() no está seteado, se usa el primer usuario existente o no se inserta
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    -- 1. Proveedores iniciales
    INSERT INTO public.proveedores (id, user_id, nombre, direccion, telefono, saldo_centavos)
    VALUES
      (v_proveedor_1, v_user_id, 'Distribuidora Notari', 'Mercado Central Nave 2', '11-4444-5555', 0),
      (v_proveedor_2, v_user_id, 'Quinta San Jorge', 'Ruta 14 Km 120', '3442-555566', 0)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Productos iniciales (precios en centavos: $800 = 80000, $1200 = 120000)
    INSERT INTO public.productos (id, user_id, nombre, descripcion, unidad, precio_costo_centavos, precio_venta_centavos, activo)
    VALUES
      (v_prod_papa, v_user_id, 'Papa Negra', 'Bolsa de papa seleccionada', 'Bolsa', 850000, 1200000, true),
      (v_prod_tomate, v_user_id, 'Tomate Redondo', 'Cajón de tomate de primera', 'Kg', 180000, 260000, true),
      (v_prod_cebolla, v_user_id, 'Cebolla Valcárcel', 'Bolsa de cebolla comercial', 'Bolsa', 600000, 950000, true)
    ON CONFLICT (id) DO NOTHING;

    -- 3. Clientes iniciales
    INSERT INTO public.clientes (id, user_id, nombre, cuil, direccion, telefono, mail, tipo, saldo_centavos)
    VALUES
      (v_cliente_1, v_user_id, 'Verdulería Don Pepe', '20-12345678-9', 'Av. San Martín 450', '3442-111111', 'pepe@gmail.com', 'Regular', 0),
      (v_cliente_2, v_user_id, 'Hospital Justo José de Urquiza', '30-98765432-1', 'Galarza y Leguizamón', '3442-222222', 'compras@hospitalurquiza.gob.ar', 'Licitación', 0),
      (v_cliente_3, v_user_id, 'Supermercado Central', '30-45678901-2', '9 de Julio 1200', '3442-333333', 'central@super.com', 'Regular', 0)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Pedido inicial de prueba (con líneas y pago asociado)
    INSERT INTO public.pedidos (id, user_id, cliente_id, total_centavos, total_costo_centavos, estado, notas)
    VALUES
      (v_pedido_1, v_user_id, v_cliente_1, 2400000, 1700000, 'Pagado Parcialmente', 'Primer pedido de prueba demo')
    ON CONFLICT (id) DO NOTHING;

    -- Línea 1: 2 bolsas de papa (costo $8.500 c/u, venta $12.000 c/u)
    INSERT INTO public.pedido_lineas (user_id, pedido_id, producto_id, proveedor_id, cantidad, precio_unit_costo_centavos, precio_unit_venta_centavos, subtotal_costo_centavos, subtotal_venta_centavos)
    VALUES
      (v_user_id, v_pedido_1, v_prod_papa, v_proveedor_1, 2, 850000, 1200000, 1700000, 2400000)
    ON CONFLICT DO NOTHING;

    -- Pago parcial de cliente obligatoriamente vinculado al pedido
    INSERT INTO public.pagos_clientes (user_id, cliente_id, pedido_id, monto_centavos, metodo_pago, notas)
    VALUES
      (v_user_id, v_cliente_1, v_pedido_1, 1000000, 'Efectivo', 'Seña del pedido')
    ON CONFLICT DO NOTHING;

  END IF;
END $$;
