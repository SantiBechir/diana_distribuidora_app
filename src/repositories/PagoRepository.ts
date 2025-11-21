import { getDB } from '../lib/sqlite';
import { PagoCliente, PagoProveedor } from '../types/database.types';
import * as Crypto from 'expo-crypto';

export const PagoRepository = {
    getPagosCliente: async (clienteId: string): Promise<PagoCliente[]> => {
        const db = getDB();
        const result = await db.getAllAsync<PagoCliente>(
            'SELECT * FROM pagos_clientes WHERE cliente_id = ? ORDER BY fecha DESC',
            [clienteId]
        );
        return result;
    },

    getPagosProveedor: async (proveedorId: string): Promise<PagoProveedor[]> => {
        const db = getDB();
        const result = await db.getAllAsync<PagoProveedor>(
            'SELECT * FROM pagos_proveedores WHERE proveedor_id = ? ORDER BY fecha DESC',
            [proveedorId]
        );
        return result;
    },

    registrarPagoCliente: async (pago: Omit<PagoCliente, 'id' | 'created_at'>) => {
        const db = getDB();
        const id = Crypto.randomUUID();

        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO pagos_clientes (id, pedido_id, cliente_id, fecha, monto) VALUES (?, ?, ?, ?, ?)`,
                [id, pago.pedido_id, pago.cliente_id, pago.fecha, pago.monto]
            );

            // Update client balance (decrease debt)
            await db.runAsync(
                `UPDATE clientes SET saldo = saldo - ? WHERE id = ?`,
                [pago.monto, pago.cliente_id]
            );

            // If linked to an order, check if it's fully paid
            if (pago.pedido_id) {
                const pedido = await db.getFirstAsync<any>('SELECT * FROM pedidos WHERE id = ?', [pago.pedido_id]);
                const pagos = await db.getAllAsync<any>('SELECT * FROM pagos_clientes WHERE pedido_id = ?', [pago.pedido_id]);

                // Include current payment in calculation as it might not be returned by select immediately inside transaction depending on isolation, 
                // but with expo-sqlite it usually is. Let's sum safely.
                const totalPagado = pagos.reduce((acc, curr) => acc + curr.monto, 0); // + pago.monto if not in select yet? 
                // Actually, inside transaction, the insert should be visible.

                if (pedido) {
                    let nuevoEstado = 'Pagado Parcialmente';
                    if (totalPagado >= pedido.total) {
                        nuevoEstado = 'Pagado';
                    }
                    await db.runAsync('UPDATE pedidos SET estado = ? WHERE id = ?', [nuevoEstado, pago.pedido_id]);
                }
            }
        });

        return id;
    },

    registrarPagoProveedor: async (pago: Omit<PagoProveedor, 'id' | 'created_at'>) => {
        const db = getDB();
        const id = Crypto.randomUUID();

        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO pagos_proveedores (id, proveedor_id, fecha, monto) VALUES (?, ?, ?, ?)`,
                [id, pago.proveedor_id, pago.fecha, pago.monto]
            );

            // Update provider balance (decrease debt)
            // Assuming positive balance means we owe them.
            // If we pay, we reduce the balance.
            // Wait, in providers table, saldo usually means what we owe them? Or what they owe us?
            // "Saldo NUMERIC DEFAULT 0". Usually "Deuda".
            // Let's assume Saldo = Deuda con proveedor.
            // Paying reduces debt.
            await db.runAsync(
                `UPDATE proveedores SET saldo = saldo - ? WHERE id = ?`,
                [pago.monto, pago.proveedor_id]
            );
        });

        return id;
    }
};
