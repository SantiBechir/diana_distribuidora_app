import { getDB } from '../lib/sqlite';
import { Pedido, PedidoLinea, PedidoCompleto } from '../types/database.types';
import * as Crypto from 'expo-crypto';

export const PedidoRepository = {
    getAll: async (): Promise<PedidoCompleto[]> => {
        const db = getDB();
        const pedidos = await db.getAllAsync<Pedido>('SELECT * FROM pedidos ORDER BY created_at DESC');

        const pedidosCompletos = await Promise.all(pedidos.map(async (p) => {
            const cliente = await db.getFirstAsync('SELECT * FROM clientes WHERE id = ?', [p.cliente_id]);
            const lineas = await db.getAllAsync(`
        SELECT pl.*, p.nombre as producto_nombre, p.unidad as producto_unidad, pr.nombre as proveedor_nombre 
        FROM pedido_lineas pl 
        JOIN productos p ON pl.producto_id = p.id 
        LEFT JOIN proveedores pr ON pl.proveedor_id = pr.id
        WHERE pl.pedido_id = ?
      `, [p.id]);

            const pagos = await db.getAllAsync('SELECT * FROM pagos_clientes WHERE pedido_id = ?', [p.id]);

            return {
                ...p,
                cliente,
                pedido_lineas: lineas.map((l: any) => ({
                    ...l,
                    producto: { id: l.producto_id, nombre: l.producto_nombre, unidad: l.producto_unidad },
                    proveedor: l.proveedor_id ? { id: l.proveedor_id, nombre: l.proveedor_nombre } : null
                })),
                pagos_clientes: pagos
            } as PedidoCompleto;
        }));

        return pedidosCompletos;
    },

    getById: async (id: string): Promise<PedidoCompleto | null> => {
        const db = getDB();
        const pedido = await db.getFirstAsync<Pedido>('SELECT * FROM pedidos WHERE id = ?', [id]);
        if (!pedido) return null;

        const cliente = await db.getFirstAsync('SELECT * FROM clientes WHERE id = ?', [pedido.cliente_id]);
        const lineas = await db.getAllAsync(`
      SELECT pl.*, p.nombre as producto_nombre, p.unidad as producto_unidad, pr.nombre as proveedor_nombre 
      FROM pedido_lineas pl 
      JOIN productos p ON pl.producto_id = p.id 
      LEFT JOIN proveedores pr ON pl.proveedor_id = pr.id
      WHERE pl.pedido_id = ?
    `, [pedido.id]);

        const pagos = await db.getAllAsync('SELECT * FROM pagos_clientes WHERE pedido_id = ?', [pedido.id]);

        return {
            ...pedido,
            cliente,
            pedido_lineas: lineas.map((l: any) => ({
                ...l,
                producto: { id: l.producto_id, nombre: l.producto_nombre, unidad: l.producto_unidad },
                proveedor: l.proveedor_id ? { id: l.proveedor_id, nombre: l.proveedor_nombre } : null
            })),
            pagos_clientes: pagos
        } as PedidoCompleto;
    },

    create: async (pedido: Omit<Pedido, 'id' | 'created_at'>, lineas: Omit<PedidoLinea, 'id' | 'created_at' | 'pedido_id'>[]) => {
        const db = getDB();
        const pedidoId = Crypto.randomUUID();

        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO pedidos (id, cliente_id, total, fecha, estado) VALUES (?, ?, ?, ?, ?)`,
                [pedidoId, pedido.cliente_id, pedido.total, pedido.fecha, pedido.estado]
            );

            for (const linea of lineas) {
                const lineaId = Crypto.randomUUID();
                await db.runAsync(
                    `INSERT INTO pedido_lineas (id, pedido_id, producto_id, cantidad, precio_unit_costo, precio_unit_venta, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [lineaId, pedidoId, linea.producto_id, linea.cantidad, linea.precio_unit_costo, linea.precio_unit_venta, linea.proveedor_id]
                );
            }

            // Update client balance
            if (pedido.estado !== 'Pagado') {
                await db.runAsync(
                    `UPDATE clientes SET saldo = saldo + ? WHERE id = ?`,
                    [pedido.total, pedido.cliente_id]
                );
            }
        });

        return pedidoId;
    },

    updateEstado: async (id: string, estado: 'Pagado' | 'Impago' | 'Pagado Parcialmente') => {
        const db = getDB();
        await db.runAsync('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
    },

    search: async (query: string): Promise<PedidoCompleto[]> => {
        // Simple search implementation, filtering in memory for now as complex joins + like is tricky
        const all = await PedidoRepository.getAll();
        const lowerQuery = query.toLowerCase();
        return all.filter(p => p.cliente.nombre.toLowerCase().includes(lowerQuery));
    }
};
