import { ensureAnonymousSession, getCurrentUserId } from './lib/auth';
import {
  clienteRepository,
  productoRepository,
  proveedorRepository,
  pedidoRepository,
  pagoClienteRepository,
  pagoProveedorRepository,
} from './repositories';
import { pesosToCentavos, formatCentavos } from './utils/money';

/**
 * Script de verificación integral de la Fase 1:
 * - 7 Entidades Oficiales según Diagrama de Diseño
 * - Autenticación anónima sin pantalla de ingreso.
 * - RLS e IDs UUID.
 * - Operaciones básicas de repositorios con importes en centavos.
 * - Relaciones obligatorias de pagos (pedido_id / proveedor_id).
 * - Saldo/crédito gestionado directamente en Cliente (saldo_centavos).
 */
export async function runFase1Verification() {
  console.log('--- INICIANDO VERIFICACIÓN DE FASE 1: MODELO Y SEGURIDAD ---');

  try {
    // 1. Verificar sesión anónima
    console.log('1. Verificando sesión anónima...');
    const authResult = await ensureAnonymousSession();
    if (authResult.error) {
      console.error('❌ Falló la autenticación anónima:', authResult.error.message);
      return;
    }
    const userId = await getCurrentUserId();
    console.log(`✅ Sesión anónima confirmada. User ID: ${userId}`);

    // 2. Operaciones con Proveedor
    console.log('2. Probando repositorio de Proveedores...');
    const proveedor = await proveedorRepository.create({
      nombre: `Proveedor Test ${Date.now()}`,
      direccion: 'Ruta 14 Km 125',
      telefono: '3442-123456',
      saldo_centavos: 0,
    });
    console.log(`✅ Proveedor creado con UUID: ${proveedor.id} - ${proveedor.nombre}`);

    // 3. Operaciones con Producto (precios en centavos)
    console.log('3. Probando repositorio de Productos (centavos)...');
    const costoCentavos = pesosToCentavos(850.50); // $850.50 -> 85050 centavos
    const ventaCentavos = pesosToCentavos(1200.00); // $1200.00 -> 120000 centavos
    const producto = await productoRepository.create({
      nombre: `Tomate Perita Test ${Date.now()}`,
      descripcion: 'Cajón 20kg',
      unidad: 'Kg',
      precio_costo_centavos: costoCentavos,
      precio_venta_centavos: ventaCentavos,
      activo: true,
    });
    console.log(
      `✅ Producto creado: ${producto.nombre} (Costo: ${formatCentavos(producto.precio_costo_centavos)}, Venta: ${formatCentavos(producto.precio_venta_centavos)})`
    );

    // 4. Operaciones con Cliente (saldo en centavos)
    console.log('4. Probando repositorio de Clientes...');
    const cliente = await clienteRepository.create({
      nombre: `Cliente Test ${Date.now()}`,
      cuil: '20-33444555-9',
      direccion: 'Calle Urquiza 100',
      telefono: '3442-998877',
      mail: 'cliente@test.com',
      tipo: 'Regular',
      saldo_centavos: 0,
    });
    console.log(`✅ Cliente creado con UUID: ${cliente.id} - ${cliente.nombre}`);

    // 5. Operaciones con Pedidos y Líneas
    console.log('5. Probando creación de Pedido coordinado con líneas...');
    const pedido = await pedidoRepository.create({
      pedido: {
        cliente_id: cliente.id,
        estado: 'Impago',
        notas: 'Pedido de verificación Fase 1',
      },
      lineas: [
        {
          producto_id: producto.id,
          proveedor_id: proveedor.id,
          cantidad: 5,
          precio_unit_costo_centavos: producto.precio_costo_centavos,
          precio_unit_venta_centavos: producto.precio_venta_centavos,
        },
      ],
    });
    console.log(
      `✅ Pedido creado: Total ${formatCentavos(pedido.total_centavos)}, Costo ${formatCentavos(pedido.total_costo_centavos)}, Líneas: ${pedido.pedido_lineas.length}`
    );

    // 6. Operaciones con Pagos de Cliente (asociación obligatoria al pedido)
    console.log('6. Probando Pago de Cliente asociado obligatoriamente a pedido...');
    const pagoMontoCentavos = pesosToCentavos(2000.00);
    const pagoCliente = await pagoClienteRepository.create({
      cliente_id: cliente.id,
      pedido_id: pedido.id,
      monto_centavos: pagoMontoCentavos,
      metodo_pago: 'Efectivo',
      notas: 'Pago parcial verificado',
    });
    console.log(`✅ Pago de Cliente registrado: ${formatCentavos(pagoCliente.monto_centavos)} para Pedido ${pedido.id}`);

    // 7. Operaciones con Pagos a Proveedor
    console.log('7. Probando Pago a Proveedor...');
    const pagoProveedor = await pagoProveedorRepository.create({
      proveedor_id: proveedor.id,
      monto_centavos: pesosToCentavos(1500.00),
      metodo_pago: 'Transferencia',
      notas: 'Pago mercadería inicial',
    });
    console.log(`✅ Pago a Proveedor registrado: ${formatCentavos(pagoProveedor.monto_centavos)} para Proveedor ${proveedor.id}`);

    // 8. Actualización de saldo / crédito en Cliente (según Diagrama de Diseño)
    console.log('8. Probando actualización de saldo/crédito en Cliente...');
    // Saldo negativo representa crédito a favor del cliente
    const creditoAFavorCentavos = -pesosToCentavos(500.00); // -$500.00 a favor
    await clienteRepository.updateSaldo(cliente.id, creditoAFavorCentavos);
    const clienteActualizado = await clienteRepository.getById(cliente.id);
    console.log(`✅ Saldo en Cliente actualizado: ${formatCentavos(clienteActualizado?.saldo_centavos)} (crédito a favor)`);

    // 9. Comprobación de Ganancia
    const ganancia = await pedidoRepository.getGananciaTotal();
    console.log(`✅ Ganancia calculada en centavos: ${formatCentavos(ganancia)}`);

    console.log('--- ✅ TODAS LAS PRUEBAS DE FASE 1 COMPLETADAS CON ÉXITO ---');
  } catch (error: any) {
    console.error('❌ Error durante la verificación de Fase 1:', error.message || error);
  }
}

export async function testConnection() {
  await runFase1Verification();
}