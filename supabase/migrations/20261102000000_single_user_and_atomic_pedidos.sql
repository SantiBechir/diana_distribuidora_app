-- Una única base de demo, sin identidades ni sesiones de Supabase Auth.
-- Aplicar DESPUÉS de la migración inicial. No vuelve a crear ni vacía tablas.
BEGIN;

DO $$
DECLARE
  tabla text;
  politica record;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['clientes', 'productos', 'proveedores', 'pedidos',
                               'pedido_lineas', 'pagos_clientes', 'pagos_proveedores'] LOOP
    FOR politica IN SELECT policyname FROM pg_policies
                    WHERE schemaname = 'public' AND tablename = tabla LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', politica.policyname, tabla);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I DROP COLUMN user_id', tabla);
    EXECUTE format('CREATE POLICY demo_single_user ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tabla);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', tabla);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.pedidos_numero_pedido_seq TO anon, authenticated;

-- Un pago debe referirse al mismo cliente que su pedido.
-- Si existen datos inconsistentes, falla toda la migración sin modificarlos.
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_id_cliente_unique UNIQUE (id, cliente_id);
ALTER TABLE public.pagos_clientes DROP CONSTRAINT pagos_clientes_pedido_id_fkey;
ALTER TABLE public.pagos_clientes ADD CONSTRAINT pagos_clientes_pedido_id_fkey
  FOREIGN KEY (pedido_id, cliente_id) REFERENCES public.pedidos(id, cliente_id) ON DELETE RESTRICT;

-- Serializar cobros y ediciones sobre el mismo pedido.
CREATE FUNCTION public.lock_pedido_for_payment() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido_estado text;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.pedido_id, NEW.cliente_id) IS DISTINCT FROM (OLD.pedido_id, OLD.cliente_id) THEN
    RAISE EXCEPTION 'No se puede cambiar el pedido o cliente de un pago existente';
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM 1 FROM public.pedidos WHERE id = OLD.pedido_id FOR UPDATE;
    RETURN OLD;
  END IF;
  SELECT estado INTO pedido_estado FROM public.pedidos WHERE id = NEW.pedido_id FOR UPDATE;
  IF pedido_estado = 'Cancelado' THEN
    RAISE EXCEPTION 'No se puede registrar un cobro en un pedido cancelado';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tr_pagos_lock_pedido BEFORE INSERT OR UPDATE OR DELETE ON public.pagos_clientes
FOR EACH ROW EXECUTE FUNCTION public.lock_pedido_for_payment();

CREATE FUNCTION public.guard_pedido_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado = 'Cancelado' AND NEW.estado <> OLD.estado THEN
    RAISE EXCEPTION 'No se puede reabrir un pedido cancelado';
  END IF;
  IF TG_OP = 'DELETE'
     OR (NEW.cliente_id, NEW.fecha, NEW.notas, NEW.total_centavos, NEW.total_costo_centavos)
        IS DISTINCT FROM (OLD.cliente_id, OLD.fecha, OLD.notas, OLD.total_centavos, OLD.total_costo_centavos)
     OR (NEW.estado = 'Cancelado' AND OLD.estado <> 'Cancelado') THEN
    IF OLD.estado <> 'Impago' OR EXISTS (SELECT 1 FROM public.pagos_clientes WHERE pedido_id = OLD.id) THEN
      RAISE EXCEPTION 'Solo se puede modificar o cancelar un pedido impago sin cobros';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tr_pedidos_guard BEFORE UPDATE OR DELETE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.guard_pedido_changes();

CREATE FUNCTION public.guard_pedido_line_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido_uuid uuid;
  pedido_estado text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.pedido_id <> OLD.pedido_id THEN
    RAISE EXCEPTION 'No se puede trasladar una línea a otro pedido';
  END IF;
  IF TG_OP = 'DELETE' THEN pedido_uuid := OLD.pedido_id; ELSE pedido_uuid := NEW.pedido_id; END IF;
  SELECT estado INTO pedido_estado FROM public.pedidos WHERE id = pedido_uuid FOR UPDATE;
  IF FOUND AND (pedido_estado <> 'Impago' OR EXISTS (SELECT 1 FROM public.pagos_clientes WHERE pedido_id = pedido_uuid)) THEN
    RAISE EXCEPTION 'Solo se pueden modificar líneas de pedidos impagos sin cobros';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER tr_pedido_lineas_guard BEFORE INSERT OR UPDATE OR DELETE ON public.pedido_lineas
FOR EACH ROW EXECUTE FUNCTION public.guard_pedido_line_changes();

-- Una RPC equivale a una transacción: cualquier error revierte cabecera y líneas.
CREATE FUNCTION public.guardar_pedido(p_pedido jsonb, p_lineas jsonb DEFAULT NULL, p_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido_uuid uuid;
  pedido_actual public.pedidos%ROWTYPE;
  linea jsonb;
  cantidad numeric;
  costo bigint;
  venta bigint;
  total_costo bigint := 0;
  total_venta bigint := 0;
BEGIN
  IF p_pedido IS NULL OR jsonb_typeof(p_pedido) <> 'object' THEN
    RAISE EXCEPTION 'Datos de pedido inválidos';
  END IF;
  IF p_pedido ? 'estado' AND p_pedido->>'estado' IS DISTINCT FROM 'Impago' THEN
    RAISE EXCEPTION 'El estado de pago no se modifica al guardar un pedido';
  END IF;
  IF p_id IS NULL THEN
    pedido_uuid := COALESCE((p_pedido->>'id')::uuid, gen_random_uuid());
    IF p_lineas IS NULL THEN RAISE EXCEPTION 'El pedido debe tener al menos una línea'; END IF;
  ELSE
    pedido_uuid := p_id;
    SELECT * INTO pedido_actual FROM public.pedidos WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente'; END IF;
    IF pedido_actual.estado <> 'Impago' OR EXISTS (SELECT 1 FROM public.pagos_clientes WHERE pedido_id = p_id) THEN
      RAISE EXCEPTION 'Solo se puede modificar un pedido impago sin cobros';
    END IF;
  END IF;

  IF p_lineas IS NOT NULL THEN
    IF jsonb_typeof(p_lineas) <> 'array' THEN RAISE EXCEPTION 'Líneas inválidas'; END IF;
    IF jsonb_array_length(p_lineas) = 0 THEN RAISE EXCEPTION 'El pedido debe tener al menos una línea'; END IF;
    FOR linea IN SELECT value FROM jsonb_array_elements(p_lineas) LOOP
      cantidad := (linea->>'cantidad')::numeric;
      costo := (linea->>'precio_unit_costo_centavos')::bigint;
      venta := (linea->>'precio_unit_venta_centavos')::bigint;
      IF cantidad IS NULL OR cantidad <= 0 OR cantidad <> round(cantidad, 2)
         OR costo IS NULL OR costo < 0 OR venta IS NULL OR venta < 0 THEN
        RAISE EXCEPTION 'Cantidad o precios de línea inválidos';
      END IF;
      total_costo := total_costo + round(cantidad * costo)::bigint;
      total_venta := total_venta + round(cantidad * venta)::bigint;
    END LOOP;
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.pedidos (id, cliente_id, fecha, notas, total_centavos, total_costo_centavos)
    VALUES (pedido_uuid, (p_pedido->>'cliente_id')::uuid,
            COALESCE((p_pedido->>'fecha')::timestamptz, now()),
            NULLIF(trim(p_pedido->>'notas'), ''), total_venta, total_costo);
  ELSE
    UPDATE public.pedidos SET
      cliente_id = CASE WHEN p_pedido ? 'cliente_id' THEN (p_pedido->>'cliente_id')::uuid ELSE cliente_id END,
      fecha = CASE WHEN p_pedido ? 'fecha' THEN (p_pedido->>'fecha')::timestamptz ELSE fecha END,
      notas = CASE WHEN p_pedido ? 'notas' THEN NULLIF(trim(p_pedido->>'notas'), '') ELSE notas END,
      total_centavos = CASE WHEN p_lineas IS NULL THEN total_centavos ELSE total_venta END,
      total_costo_centavos = CASE WHEN p_lineas IS NULL THEN total_costo_centavos ELSE total_costo END
    WHERE id = pedido_uuid;
    IF p_lineas IS NOT NULL THEN DELETE FROM public.pedido_lineas WHERE pedido_id = pedido_uuid; END IF;
  END IF;

  IF p_lineas IS NOT NULL THEN
    FOR linea IN SELECT value FROM jsonb_array_elements(p_lineas) LOOP
      INSERT INTO public.pedido_lineas (id, pedido_id, producto_id, proveedor_id, cantidad,
        precio_unit_costo_centavos, precio_unit_venta_centavos, subtotal_costo_centavos, subtotal_venta_centavos)
      VALUES (COALESCE((linea->>'id')::uuid, gen_random_uuid()), pedido_uuid,
        (linea->>'producto_id')::uuid, (linea->>'proveedor_id')::uuid, (linea->>'cantidad')::numeric,
        (linea->>'precio_unit_costo_centavos')::bigint, (linea->>'precio_unit_venta_centavos')::bigint,
        round((linea->>'cantidad')::numeric * (linea->>'precio_unit_costo_centavos')::bigint)::bigint,
        round((linea->>'cantidad')::numeric * (linea->>'precio_unit_venta_centavos')::bigint)::bigint);
    END LOOP;
  END IF;
  RETURN pedido_uuid;
END $$;

CREATE FUNCTION public.cancelar_pedido(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido_estado text;
BEGIN
  SELECT estado INTO pedido_estado FROM public.pedidos WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido inexistente'; END IF;
  IF pedido_estado = 'Cancelado' THEN RETURN; END IF;
  IF pedido_estado <> 'Impago' OR EXISTS (SELECT 1 FROM public.pagos_clientes WHERE pedido_id = p_id) THEN
    RAISE EXCEPTION 'Solo se puede cancelar un pedido impago sin cobros';
  END IF;
  UPDATE public.pedidos SET estado = 'Cancelado' WHERE id = p_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.guardar_pedido(jsonb, jsonb, uuid), public.cancelar_pedido(uuid),
  public.lock_pedido_for_payment(), public.guard_pedido_changes(), public.guard_pedido_line_changes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_pedido(jsonb, jsonb, uuid), public.cancelar_pedido(uuid)
  TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
