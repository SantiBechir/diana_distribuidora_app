# Fase 2: clientes, productos y proveedores

- Responsable: Santi Bechir.
- Implementación presente en la rama `feature/fase-2-clientes-productos-proveedores`.
- Actualización del 2 de noviembre de 2026: sin sesiones; verificaciones locales incorporadas. Validación manual en dispositivo pendiente.

## Implementación

Las pantallas consumen `ClienteService`, `ProductoService` y `ProveedorService`, con repositorios intercambiables. Incluyen alta, edición, listado y detalle, notas de cliente, descripción y unidad de producto, teléfono de proveedor y saldo inicial. Las listas y los detalles se recargan al recuperar el foco.

El catálogo permite archivar y restaurar productos sin eliminar el historial. La búsqueda por nombre y CUIL usa el mismo comparador en la lista y el repositorio de clientes: acepta CUIL completo o parcial, con o sin guiones/espacios. El texto no se interpola en expresiones de filtros PostgREST.

Los seis formularios muestran errores por campo y deshabilitan Guardar mientras haya datos inválidos. Los importes rechazan texto parcial, valores no finitos, fracciones de centavo y valores fuera del rango seguro. Se conserva la advertencia de margen negativo. Volver, el gesto de iOS y el botón Inicio piden confirmación si existen cambios sin guardar; después de guardar correctamente se permite salir. Durante un guardado no se permite abandonar el formulario.

## Verificación

```powershell
npm run typecheck
npm test
```

Las pruebas locales cubren formatos de CUIL, importes y teléfonos, el recorrido automatizado de fase 2 con servicios reales y repositorios en memoria, propagación de errores y detección de falsos positivos del verificador de duplicados. Se comprueba además que el repositorio de pedidos use RPC y propague fallos.

`src/test-fase2.ts` expone `runFase2Verification()`, también exportada desde `src/test-supabase.ts`. Puede ejecutarse temporalmente desde la app para probar la integración real con Supabase una vez aplicada la migración nueva. Crea datos de prueba: no es una consulta de solo lectura. Sus teléfonos son compatibles con el validador y las comprobaciones de duplicados ya no capturan su propio error de aserción ni confunden errores de red con rechazos de negocio.

## Recorridos manuales pendientes

1. Crear, buscar por nombre/CUIL, consultar y editar un cliente; verificar actualización de detalle y lista.
2. Crear y editar un producto; comprobar advertencia de pérdida, archivado y restauración.
3. Crear y editar un proveedor con teléfono y saldo inicial válidos.
4. Intentar salir de cada formulario con cambios: probar Volver, Inicio y el gesto de iOS. Cancelar la salida debe conservar los valores; después de guardar no debe aparecer la advertencia.
5. Comprobar mensajes por campo y bloqueo de Guardar con datos inválidos.

No se registran estos recorridos como comprobados en dispositivo. La compilación web y las pruebas automatizadas no reemplazan esa validación.

## Siguientes fases

Fase 3 debe incorporar almacenamiento local y sincronización a través de los repositorios. Las pantallas completas de pedidos y pagos, la gestión de crédito, los informes y las boletas corresponden a las fases 4 a 6. Estas correcciones no declaran terminadas esas fases.
