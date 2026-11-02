-- ==============================================================================
-- FASE 1 & 2: DATOS SEMILLA PARA DEMO (Seed Data)
-- 7 Entidades Oficiales según Diagrama de Diseño
-- Una única base compartida, sin usuarios. Ejecutar después de todas las migraciones.
-- ==============================================================================

DO $$
DECLARE
  v_prov_notari UUID;
  v_prov_sanjorge UUID;
  v_prod_papa UUID;
  v_prod_tomate UUID;
  v_prod_cebolla UUID;
  v_cli_pepe UUID;
  v_cli_hospital UUID;
  v_cli_central UUID;
  v_ped_1 UUID;
BEGIN

    -- 1. Proveedores iniciales
    IF NOT EXISTS (SELECT 1 FROM public.proveedores) THEN
      v_prov_notari := gen_random_uuid();
      v_prov_sanjorge := gen_random_uuid();

      INSERT INTO public.proveedores (id, nombre, direccion, telefono, saldo_centavos)
      VALUES
        (v_prov_notari, 'Distribuidora Notari', 'Mercado Central Nave 2', '11-4444-5555', 0),
        (v_prov_sanjorge, 'Quinta San Jorge', 'Ruta 14 Km 120', '3442-555566', 0);
    ELSE
      SELECT id INTO v_prov_notari FROM public.proveedores WHERE nombre = 'Distribuidora Notari' LIMIT 1;
    END IF;

    -- 2. Productos iniciales (precios en centavos)
    IF NOT EXISTS (SELECT 1 FROM public.productos) THEN
      v_prod_papa := gen_random_uuid();
      v_prod_tomate := gen_random_uuid();
      v_prod_cebolla := gen_random_uuid();

      INSERT INTO public.productos (id, nombre, descripcion, unidad, precio_costo_centavos, precio_venta_centavos, activo)
      VALUES
        (v_prod_papa, 'Papa Negra', 'Bolsa de papa seleccionada x 20kg', 'Bolsa', 850000, 1200000, true),
        (v_prod_tomate, 'Tomate Redondo', 'Cajón de tomate de primera', 'Kg', 180000, 260000, true),
        (v_prod_cebolla, 'Cebolla Valcárcel', 'Bolsa de cebolla comercial', 'Bolsa', 600000, 950000, true);
    ELSE
      SELECT id INTO v_prod_papa FROM public.productos WHERE nombre = 'Papa Negra' LIMIT 1;
    END IF;

    -- 3. Clientes iniciales (saldo_centavos: >0 debe, <0 a favor / crédito)
    IF NOT EXISTS (SELECT 1 FROM public.clientes) THEN
      v_cli_pepe := gen_random_uuid();
      v_cli_hospital := gen_random_uuid();
      v_cli_central := gen_random_uuid();

      INSERT INTO public.clientes (id, nombre, cuil, direccion, telefono, mail, tipo, saldo_centavos, notas)
      VALUES
        (v_cli_pepe, 'Verdulería Don Pepe', '20-12345678-9', 'Av. San Martín 450', '3442-111111', 'pepe@gmail.com', 'Regular', 0, 'Cliente habitual de mañana'),
        (v_cli_hospital, 'Hospital Justo José de Urquiza', '30-98765432-1', 'Galarza y Leguizamón', '3442-222222', 'compras@hospitalurquiza.gob.ar', 'Licitación', 0, 'Entrega en depósito de cocina'),
        (v_cli_central, 'Supermercado Central', '30-45678901-2', '9 de Julio 1200', '3442-333333', 'central@super.com', 'Regular', 0, 'Pago contra entrega');
    ELSE
      SELECT id INTO v_cli_pepe FROM public.clientes WHERE nombre = 'Verdulería Don Pepe' LIMIT 1;
    END IF;

    -- 4. Pedido inicial de prueba (con líneas y pago)
    IF NOT EXISTS (SELECT 1 FROM public.pedidos) AND v_cli_pepe IS NOT NULL AND v_prod_papa IS NOT NULL AND v_prov_notari IS NOT NULL THEN
      v_ped_1 := gen_random_uuid();

      INSERT INTO public.pedidos (id, cliente_id, total_centavos, total_costo_centavos, estado, notas)
      VALUES
        (v_ped_1, v_cli_pepe, 2400000, 1700000, 'Impago', 'Primer pedido de prueba demo');

      INSERT INTO public.pedido_lineas (pedido_id, producto_id, proveedor_id, cantidad, precio_unit_costo_centavos, precio_unit_venta_centavos, subtotal_costo_centavos, subtotal_venta_centavos)
      VALUES
        (v_ped_1, v_prod_papa, v_prov_notari, 2, 850000, 1200000, 1700000, 2400000);

      INSERT INTO public.pagos_clientes (cliente_id, pedido_id, monto_centavos, metodo_pago, notas)
      VALUES
        (v_cli_pepe, v_ped_1, 1000000, 'Efectivo', 'Seña del pedido');

      UPDATE public.pedidos SET estado = 'Pagado Parcialmente' WHERE id = v_ped_1;
      UPDATE public.clientes SET saldo_centavos = 1400000 WHERE id = v_cli_pepe;
      UPDATE public.proveedores SET saldo_centavos = 1700000 WHERE id = v_prov_notari;
    END IF;

END $$;
