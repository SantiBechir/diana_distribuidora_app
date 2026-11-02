# Alta y consulta de pedidos

El botón `+` de Inicio abre `NewPedidoScreen`; antes solo intentaba mostrar un aviso de próxima implementación.

## Cómo probar

1. Tener al menos un cliente, un producto activo y un proveedor. El alta ofrece accesos para crearlos si las listas están vacías, y recarga los catálogos al volver.
2. En Inicio, presionar `+`, elegir cliente y completar la fecha como `AAAA-MM-DD`.
3. Elegir producto y proveedor de la línea, ingresar cantidad y revisar costo/venta unitarios. Los precios sugeridos del producto se precargan y pueden modificarse para el pedido.
4. Presionar **Agregar al pedido**. Repetir con otros productos; cada línea conserva su proveedor y sus precios. Las cantidades admiten hasta dos decimales. Una línea en preparación debe agregarse o descartarse antes de guardar.
5. Revisar costo, venta y ganancia; completar notas opcionales y guardar.
6. Se abre el detalle del pedido creado. Al volver a Inicio se recarga la lista; tocar un pedido permite abrir su detalle.

Los errores de carga y guardado se muestran en pantalla, también en web. Un error conserva el formulario. No se usa `Alert.alert` para confirmar el guardado o navegar. Se protege la salida con cambios sin guardar y se bloquean pulsaciones repetidas durante el guardado.

## Verificación

- `npm run typecheck`.
- `npm test`: once pruebas, incluyendo validación de pedidos, cálculos/redondeo, fecha, campos obligatorios y propagación de errores del repositorio.
- Exportación web con Expo.
- Navegador: comprobados el acceso desde `+`, la carga y selección de cliente, el estado sin productos/proveedores y el rechazo de una línea incompleta. No se crearon registros en la base remota durante esta comprobación.
- El guardado usa la RPC transaccional de la migración `20261102000000_single_user_and_atomic_pedidos.sql`, previamente verificada con las pruebas de base de datos. Esa migración debe estar aplicada en Supabase.

Esto incorpora el alta y el detalle de pedidos. La edición, cancelación desde pantallas, listado completo con filtros, actualización de precios desde el último pedido, integración sin conexión y reglas de pagos/saldos siguen pendientes de sus fases respectivas. No se declara completa la fase 4.
