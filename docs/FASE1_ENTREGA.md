# Fase 1: modelo para una única usuaria

Actualizado el 2 de noviembre de 2026. Esta entrega reemplaza el diseño anterior de sesiones anónimas y separación por usuario.

## Modelo vigente

- Una única base de demo compartida, sin usuarios, login, identidad anónima ni almacenamiento de sesiones.
- Siete entidades, UUID, importes enteros en centavos y archivado de productos.
- Pagos de clientes asociados obligatoriamente a un pedido del mismo cliente. Pagos a proveedores asociados obligatoriamente a un proveedor.
- RLS habilitado con acceso a las tablas de demo para el rol `anon`, sin autenticación. Quien tenga la URL y clave pública del proyecto puede acceder a los mismos datos de demo. No usar `service_role` en la app.
- Contratos de repositorios en `src/repositories/interfaces/`.
- Creación y edición de pedidos mediante `guardar_pedido`; cancelación mediante `cancelar_pedido`. Las funciones SQL son transaccionales y usan los permisos del llamador (`SECURITY INVOKER`).
- Edición y cancelación permitidas solo para pedidos impagos sin cobros. La protección incluye cambios directos en cabecera y líneas. Registrar un cobro bloquea el mismo pedido para coordinarlo con una edición concurrente.

## Aplicación de migraciones

**Base existente con fase 1 aplicada:** ejecutar solamente `supabase/migrations/20261102000000_single_user_and_atomic_pedidos.sql` en el SQL Editor de Supabase. Conserva filas, UUID, importes y relaciones, y elimina `user_id` y las políticas anteriores. No elimina usuarios históricos de `auth.users`; la app deja de usarlos.

**Base nueva:** ejecutar primero `20261004000000_fase1_initial_schema.sql`, luego `20261102000000_single_user_and_atomic_pedidos.sql`, y opcionalmente `supabase/seed.sql`.

La migración inicial es histórica y contiene `DROP TABLE`: no volver a ejecutarla sobre una base con datos. La migración nueva no elimina registros. Si detecta pagos cuyo cliente no corresponde al pedido, aborta entera; revisar esas filas antes de reintentar. Todos los registros anteriores quedan en la misma base compartida, sin fusionar posibles duplicados creados por identidades distintas.

Para localizar inconsistencias antes de migrar:

```sql
SELECT pc.id, pc.cliente_id AS cliente_pago, p.cliente_id AS cliente_pedido
FROM public.pagos_clientes pc
JOIN public.pedidos p ON p.id = pc.pedido_id
WHERE pc.cliente_id <> p.cliente_id;
```

La app necesita `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env`. Ya no necesita activar inicios de sesión anónimos en Supabase Auth.

## Verificación ejecutada localmente

```powershell
npm run typecheck
npm test
# Preparación aislada del verificador PostgreSQL; no es dependencia de la app:
npm install --prefix .tmp/db-verification @electric-sql/pglite@0.5.14 --no-save --no-package-lock --ignore-scripts
npm run test:db
```

La verificación PostgreSQL ejecuta las migraciones y la semilla, y comprueba conservación de datos, rollback ante inconsistencias anteriores, CRUD sin sesión, referencia de pagos al mismo cliente, rollback de altas y ediciones fallidas, cálculos en centavos y bloqueo de modificaciones/cancelaciones con cobros. PGlite usa PostgreSQL embebido; solo se omiten las declaraciones de extensiones de la migración histórica, dado que `gen_random_uuid()` ya está incluido en el motor.

Pendiente de verificación externa: aplicar la migración en el proyecto Supabase real y recorrer la app en iOS. Las pruebas locales no certifican configuración ni despliegue remoto. El modo sin conexión y las reglas completas de pagos, crédito y saldos siguen correspondiendo a las fases 3 y 5.
