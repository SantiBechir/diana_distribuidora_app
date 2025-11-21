import { getDB } from '../lib/sqlite';
import { Proveedor } from '../types/database.types';
import * as Crypto from 'expo-crypto';

export const ProveedorRepository = {
    getAll: async (): Promise<Proveedor[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Proveedor>('SELECT * FROM proveedores ORDER BY nombre ASC');
        return result;
    },

    getById: async (id: string): Promise<Proveedor | null> => {
        const db = getDB();
        const result = await db.getFirstAsync<Proveedor>('SELECT * FROM proveedores WHERE id = ?', [id]);
        return result || null;
    },

    create: async (proveedor: Omit<Proveedor, 'id' | 'created_at' | 'saldo'>) => {
        const db = getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO proveedores (id, nombre, direccion, saldo) VALUES (?, ?, ?, ?)`,
            [id, proveedor.nombre, proveedor.direccion, 0]
        );
        return id;
    },

    update: async (id: string, proveedor: Partial<Proveedor>) => {
        const db = getDB();
        const fields = Object.keys(proveedor).filter(k => k !== 'id' && k !== 'created_at' && k !== 'saldo');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => (proveedor as any)[f]);

        await db.runAsync(`UPDATE proveedores SET ${setClause} WHERE id = ?`, [...values, id]);
    },

    delete: async (id: string) => {
        const db = getDB();
        await db.runAsync('DELETE FROM proveedores WHERE id = ?', [id]);
    },

    search: async (query: string): Promise<Proveedor[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Proveedor>(
            'SELECT * FROM proveedores WHERE nombre LIKE ? ORDER BY nombre ASC',
            [`%${query}%`]
        );
        return result;
    }
};
