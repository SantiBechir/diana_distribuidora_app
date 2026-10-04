# Entrega Fase 1: Modelo y Seguridad

- **Responsable:** Ale
- **Rama:** `fase-1-modelo-y-seguridad` (creada a partir de `development`)
- **Estado:** ✅ Completada y verificada

---

## 1. Resumen de Entregables

Se ha implementado la infraestructura completa de base de datos, seguridad, modelos de datos y capa de abstracción para la aplicación:

1. **Migraciones completas en Supabase (`supabase/migrations/20261004000000_fase1_initial_schema.sql`)**:
   - Todas las tablas del sistema con claves primarias UUID autogeneradas (`gen_random_uuid()`).
   - Aislamiento total de datos de demo mediante **Row Level Security (RLS)** y `auth.uid() = user_id`.
   - Importes monetarios almacenados en **centavos enteros (`BIGINT`)** para evitar errores de punto flotante.
   - Relaciones forzosas en pagos:
     - `pagos_clientes.pedido_id` obligatorio (`NOT NULL REFERENCES pedidos(id)`).
     - `pagos_proveedores.proveedor_id` obligatorio (`NOT NULL REFERENCES proveedores(id)`).
   - Soporte para **archivado de productos** (`activo BOOLEAN DEFAULT true`) sin perder historial en pedidos existentes.
   - Modelado de **créditos y excedentes** (`creditos_clientes` y `credito_aplicaciones`) para aplicar saldos a favor como movimientos independientes sin registrar dinero nuevo.
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
     - `ICreditoRepository`
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

### Opción B: Mediante Supabase CLI
```bash
supabase db push
# O para reiniciar completamente:
supabase db reset
```

---

## 3. Contrato de Repositorios para la Fase 2

Para la **Fase 2 (Santi Bechir)**, las pantallas deben importar directamente los repositorios desde `@repositories` o `../repositories`:

```typescript
import {
  clienteRepository,
  productoRepository,
  proveedorRepository,
  pedidoRepository,
  pagoClienteRepository,
  pagoProveedorRepository,
  creditoRepository,
} from '../repositories';

// Ejemplo: Búsqueda de clientes por nombre o CUIL
const clientes = await clienteRepository.search(terminoBusqueda);

// Ejemplo: Archivar producto sin borrar historial
await productoRepository.archive(productoId);

// Ejemplo: Guardar producto con precios en centavos
import { pesosToCentavos } from '../utils/money';

await productoRepository.create({
  nombre: 'Tomate Redondo',
  unidad: 'Kg',
  precio_costo_centavos: pesosToCentavos(800.50),
  precio_venta_centavos: pesosToCentavos(1200.00),
  activo: true,
});
```

---

## 4. Casos Comprobados

- [x] **Compilación estricta TypeScript:** Se ejecutó `yarn tsc --noEmit` resultando en `0` errores en todo el proyecto.
- [x] **Generación de IDs UUID:** Todas las tablas y tipos utilizan strings UUID.
- [x] **Relación forzada en Pagos:** Se confirmó que `pagos_clientes` requiere `pedido_id` y `pagos_proveedores` requiere `proveedor_id`.
- [x] **Aislamiento Demo / RLS:** Políticas RLS definidas con `auth.uid() = user_id` en las 9 tablas del sistema.
- [x] **Acceso anónimo transparente:** Configurada la inicialización en `App.tsx` y la persistencia de sesión en `AsyncStorage`.
- [x] **Compatibilidad retroactiva:** Las pantallas existentes continúan compilando sin errores gracias a las capas de compatibilidad en los tipos de dominio.
