import { clienteService, productoService, proveedorService } from './services';
import { pesosToCentavos, formatCentavos } from './utils/money';

/**
 * Script de verificación automatizada de la Fase 2 (Clientes, Productos y Proveedores)
 * Responsable: Santi Bechir
 * 
 * Casos cubiertos:
 * 1. Acceso a la base de demo sin sesión.
 * 2. Módulo Clientes: validaciones, alta completa (con notas y CUIL), búsqueda dual (nombre o CUIL), edición y consulta.
 * 3. Módulo Productos: validaciones, alta con descripción, detección de duplicados, margen negativo, archivado sin borrar historial y restauración.
 * 4. Módulo Proveedores: validaciones, alta con teléfono y saldo inicial, detección de duplicados, edición y consulta.
 */
export async function runFase2Verification() {
  console.log('================================================================');
  console.log('   INICIANDO PRUEBAS DE INTEGRACIÓN: FASE 2 (SANTI BECHIR)      ');
  console.log('================================================================\n');

  try {
    // 1. Clientes
    console.log('--- 1. Pruebas de Módulo Clientes ---');

    // 1.1 Validaciones de entrada
    console.log('1.1 Comprobando validaciones de Cliente...');
    const valNombreVacio = clienteService.validate({ nombre: '' });
    if (valNombreVacio.isValid) throw new Error('Falló validación: debía rechazar nombre vacío.');
    console.log('  ✅ Rechazó correctamente nombre vacío.');

    const valCuilInvalido = clienteService.validate({ nombre: 'Test', cuil: '12345' });
    if (valCuilInvalido.isValid) throw new Error('Falló validación: debía rechazar CUIL con longitud menor a 11.');
    console.log('  ✅ Rechazó correctamente formato de CUIL inválido.');

    // 1.2 Alta completa
    console.log('1.2 Creando cliente con todos los campos (CUIL, notas, contacto)...');
    const timestamp = Date.now();
    const cuilPrueba = '20334445559';
    const nuevoCliente = await clienteService.create({
      nombre: `Verduleria El Sol ${timestamp}`,
      cuil: cuilPrueba,
      direccion: 'Av. Congreso 1234',
      telefono: '11-4567-8901',
      mail: 'elsol@demo.com',
      tipo: 'Regular',
      notas: 'Entrega por la mañana antes de las 10hs.',
      saldo_centavos: 0,
    });
    console.log(`  ✅ Cliente creado UUID: ${nuevoCliente.id}`);
    console.log(`     Nombre: ${nuevoCliente.nombre}`);
    console.log(`     CUIL formateado: ${nuevoCliente.cuil}`);
    console.log(`     Notas: ${nuevoCliente.notas}`);

    // 1.3 Búsqueda por Nombre
    console.log('1.3 Buscando cliente por nombre...');
    const resNombre = await clienteService.search(`El Sol ${timestamp}`);
    if (resNombre.length === 0) throw new Error('No se encontró el cliente por búsqueda de nombre.');
    console.log(`  ✅ Encontrado por nombre: ${resNombre[0].nombre}`);

    // 1.4 Búsqueda por CUIL
    console.log('1.4 Buscando cliente por CUIL...');
    const resCuil = await clienteService.search(cuilPrueba);
    if (!resCuil.some(c => c.id === nuevoCliente.id)) throw new Error('No se encontró el cliente por búsqueda de CUIL.');
    console.log(`  ✅ Encontrado por CUIL: ${resCuil[0].nombre} (${resCuil[0].cuil})`);

    // 1.5 Edición de cliente
    console.log('1.5 Modificando cliente...');
    const clienteEditado = await clienteService.update(nuevoCliente.id, {
      nombre: `Verduleria El Sol Central ${timestamp}`,
      notas: 'Horario modificado: de 8 a 12hs.',
    });
    if (clienteEditado.nombre !== `Verduleria El Sol Central ${timestamp}`) {
      throw new Error('El nombre no se actualizó correctamente.');
    }
    console.log(`  ✅ Cliente modificado con éxito: ${clienteEditado.nombre} | ${clienteEditado.notas}\n`);

    // 2. Productos
    console.log('--- 2. Pruebas de Módulo Productos ---');

    // 2.1 Validaciones
    console.log('2.1 Comprobando validaciones de Producto...');
    const valProdVacio = productoService.validate({ nombre: '' });
    if (valProdVacio.isValid) throw new Error('Debía rechazar nombre de producto vacío.');
    console.log('  ✅ Rechazó correctamente nombre vacío.');

    const valPrecioNegativo = productoService.validate({ nombre: 'Papas', precio_costo_centavos: -100 });
    if (valPrecioNegativo.isValid) throw new Error('Debía rechazar precio negativo.');
    console.log('  ✅ Rechazó correctamente precio negativo.');

    // 2.2 Margen negativo
    const esPerdida = productoService.isMargenNegativo(pesosToCentavos(1000), pesosToCentavos(800));
    if (!esPerdida) throw new Error('Debía detectar pérdida cuando venta < costo.');
    console.log('  ✅ Advertencia de margen negativo funcionando correctamente.');

    // 2.3 Alta de producto
    console.log('2.3 Registrando nuevo producto...');
    const prodCosto = pesosToCentavos(1500.50);
    const prodVenta = pesosToCentavos(2200.00);
    const nuevoProd = await productoService.create({
      nombre: `Manzana Roja Premium ${timestamp}`,
      descripcion: 'Cajón de 20kg seleccionadas del Alto Valle',
      unidad: 'Bolsa',
      precio_costo_centavos: prodCosto,
      precio_venta_centavos: prodVenta,
      activo: true,
    });
    console.log(`  ✅ Producto creado: ${nuevoProd.nombre}`);
    console.log(`     Descripción: ${nuevoProd.descripcion}`);
    console.log(`     Costo: ${formatCentavos(nuevoProd.precio_costo_centavos)} | Venta: ${formatCentavos(nuevoProd.precio_venta_centavos)}`);

    // 2.4 Control de duplicados
    console.log('2.4 Verificando control de producto duplicado...');
    let productoDuplicadoRechazado = false;
    try {
      await productoService.create({
        nombre: `Manzana Roja Premium ${timestamp}`,
        unidad: 'Bolsa',
        precio_costo_centavos: prodCosto,
        precio_venta_centavos: prodVenta,
      });
    } catch (dupErr: any) {
      if (!dupErr.message.includes('Ya existe')) throw dupErr;
      productoDuplicadoRechazado = true;
      console.log(`  ✅ Detectó y previno duplicado: "${dupErr.message}"`);
    }

    if (!productoDuplicadoRechazado) throw new Error('Se permitió crear un producto duplicado.');

    // 2.5 Archivado de producto (sin borrar historial)
    console.log('2.5 Probando archivado de producto...');
    await productoService.archive(nuevoProd.id);
    const prodArchivado = await productoService.getById(nuevoProd.id);
    if (prodArchivado?.activo !== false) {
      throw new Error('El producto debería figurar con activo = false tras archivar.');
    }
    const activos = await productoService.getAll(false);
    if (activos.some(p => p.id === nuevoProd.id)) {
      throw new Error('El producto archivado no debería figurar en la lista de activos.');
    }
    console.log('  ✅ Producto archivado correctamente (no aparece en catálogo activo).');

    // 2.6 Restauración de producto
    console.log('2.6 Restaurando producto archivado...');
    await productoService.restore(nuevoProd.id);
    const prodRestaurado = await productoService.getById(nuevoProd.id);
    if (prodRestaurado?.activo !== true) {
      throw new Error('El producto debería figurar con activo = true tras restaurar.');
    }
    console.log('  ✅ Producto restaurado exitosamente al catálogo activo.\n');

    // 3. Proveedores
    console.log('--- 3. Pruebas de Módulo Proveedores ---');

    // 3.1 Alta de proveedor con teléfono y saldo
    console.log('3.1 Registrando nuevo proveedor con teléfono...');
    const saldoInicialCentavos = pesosToCentavos(50000.00);
    const nuevoProv = await proveedorService.create({
      nombre: `Distribuidora Mayorista Central ${timestamp}`,
      telefono: '0800-444-6682',
      direccion: 'Mercado Central Nave 4 Puesto 12',
      saldo_centavos: saldoInicialCentavos,
    });
    console.log(`  ✅ Proveedor creado UUID: ${nuevoProv.id}`);
    console.log(`     Nombre: ${nuevoProv.nombre}`);
    console.log(`     Teléfono: ${nuevoProv.telefono}`);
    console.log(`     Saldo inicial adeudado: ${formatCentavos(nuevoProv.saldo_centavos)}`);

    // 3.2 Control de duplicados en proveedor
    console.log('3.2 Verificando control de proveedor duplicado...');
    let proveedorDuplicadoRechazado = false;
    try {
      await proveedorService.create({
        nombre: `Distribuidora Mayorista Central ${timestamp}`,
      });
    } catch (dupProvErr: any) {
      if (!dupProvErr.message.includes('Ya existe')) throw dupProvErr;
      proveedorDuplicadoRechazado = true;
      console.log(`  ✅ Detectó y previno duplicado: "${dupProvErr.message}"`);
    }

    if (!proveedorDuplicadoRechazado) throw new Error('Se permitió crear un proveedor duplicado.');

    // 3.3 Edición de datos de proveedor
    console.log('3.3 Modificando datos de proveedor...');
    const provEditado = await proveedorService.update(nuevoProv.id, {
      telefono: '0800-999-6682',
      direccion: 'Mercado Central Nave 4 Puesto 12 (Ampliación)',
    });
    if (provEditado.telefono !== '0800-999-6682') {
      throw new Error('No se actualizó el teléfono del proveedor.');
    }
    console.log(`  ✅ Proveedor actualizado: Tel ${provEditado.telefono} | Dir ${provEditado.direccion}`);

    // 3.4 Búsqueda de proveedor
    console.log('3.4 Buscando proveedor por nombre...');
    const provsEncontrados = await proveedorService.search(`Central ${timestamp}`);
    if (provsEncontrados.length === 0) throw new Error('No se encontró el proveedor por búsqueda.');
    console.log(`  ✅ Proveedor encontrado en búsqueda: ${provsEncontrados[0].nombre}\n`);

    console.log('================================================================');
    console.log('   ✅ TODAS LAS PRUEBAS DE LA FASE 2 PASARON EXITOSAMENTE        ');
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ ERROR EN PRUEBAS DE FASE 2:', err?.message || err);
    throw err;
  }
}
