# Entrega Fase 1: Modelo y Seguridad

- **Responsable:** Ale
- **Rama:** `fase-1-modelo-y-seguridad` (creada a partir de `development`)
- **Estado:** ✅ Completada y verificada

---

## 1. Resumen de Entregables

Se ha implementado la infraestructura completa de base de datos, seguridad, modelos de datos y capa de abstracción para la aplicación, alineada con las **7 entidades del Diagrama de Diseño oficial**:

1. **Migraciones completas en Supabase (`supabase/migrations/20261004000000_fase1_initial_schema.sql`)**:
   - Tablas oficiales: `clientes`, `productos`, `proveedores`, `pedidos`, `pedido_lineas`, `pagos_clientes`, `pagos_proveedores`.
   - Todas las tablas con claves primarias UUID autogeneradas (`gen_random_uuid()`).
   - Aislamiento total de datos de demo mediante **Row Level Security (RLS)** y `auth.uid() = user_id`.
   - Importes monetarios almacenados en **centavos enteros (`BIGINT`)** para evitar errores de punto flotante.
   - Relaciones forzosas en pagos:
     - `pagos_clientes.pedido_id` obligatorio (`NOT NULL REFERENCES pedidos(id)`).
     - `pagos_proveedores.proveedor_id` obligatorio (`NOT NULL REFERENCES proveedores(id)`).
   - **Gestión de Saldo y Crédito en Cliente:** Se gestiona mediante el atributo `saldo_centavos` de la entidad `clientes` (>0 deuda, <0 saldo a favor / crédito), tal como se modeló en el Diagrama de Diseño.
   - Soporte para **archivado de productos** (`activo BOOLEAN DEFAULT true`) sin perder historial en pedidos existentes.
   - Triggers automáticos para actualizar `updated_at`.

2. **Datos semilla de demostración (`supabase/seed.sql`)**:
   - Script para recrear y poblar la base de datos con clientes, proveedores, productos y pedidos de prueba.

3. **Acceso anónimo transparente (`src/lib/auth.ts` y `App.tsx`)**:
   - No requiere pantalla de ingreso ni credenciales.
   - La primera apertura genera la identidad anónima en Supabase y la persiste en `AsyncStorage`.
   - Las sesiones subsiguientes reutilizan la misma identidad anónima de la demo incluso si no hay conexión temporal.

4. **Tipos de datos alineados (`src/types/database.types.ts`)**:
   - Tipos de TypeScript que reflejan fielmente el esquema SQL.
   - Atributos monetarios canónicos en centavos (`saldo_centavos`, `precio_costo_centavos`, `total_centavos`, etc.) manteniendo campos de conveniencia para compatibilidad con código existente.

5. **Utilidades de conversión de moneda (`src/utils/money.ts`)**:
   - Funciones puras: `centavosToPesos()`, `pesosToCentavos()`, `formatCentavos()`, `formatPesos()`.

6. **Contrato de Repositorios (`src/repositories/`)**:
   - Interfaces desacopladas en `src/repositories/interfaces/`:
     - `IClienteRepository`
     - `IProductoRepository`
     - `IProveedorRepository`
     - `IPedidoRepository`
     - `IPagoClienteRepository`
     - `IPagoProveedorRepository`
   - Implementaciones Supabase en `src/repositories/supabase/`.
   - Exportación centralizada en `src/repositories/index.ts` lista para ser consumida por **Santi Bechir en la Fase 2** (pantallas y servicios) y por **Santi Gavino en la Fase 3** (integración offline/SQLite).

7. **Verificación y pruebas (`src/test-supabase.ts`)**:
   - Script de prueba que valida de principio a fin el flujo de operaciones de repositorios, cálculo de totales, ganancia y relaciones obligatorias.

---

## 2. Cómo recrear la base de datos en Supabase

### Opción A: Mediante el SQL Editor de Supabase (Recomendada)
1. Abrir el proyecto en el [Dashboard de Supabase](https://supabase.com/dashboard).
2. Ir a **SQL Editor**.
3. Copiar y pegar el contenido de `supabase/migrations/20261004000000_fase1_initial_schema.sql` y presionar **Run**.
4. (Opcional) Para cargar datos de prueba iniciales, ejecutar en el SQL Editor el contenido de `supabase/seed.sql`.

---

## 3. Contrato de Repositorios para la Fase 2

Para la **Fase 2 (Santi Bechir)**, las pantallas deben importar directamente los repositorios desde `../repositories`:

```typescript
import {
  clienteRepository,
  productoRepository,
  proveedorRepository,
  pedidoRepository,
  pagoClienteRepository,
  pagoProveedorRepository,
} from '../repositories';

// Búsqueda de clientes por nombre o CUIL
const clientes = await clienteRepository.search(terminoBusqueda);

// Actualizar saldo del cliente (saldo en centavos)
await clienteRepository.updateSaldo(clienteId, nuevoSaldoCentavos);

// Archivar producto sin borrar historial
await productoRepository.archive(productoId);
```
