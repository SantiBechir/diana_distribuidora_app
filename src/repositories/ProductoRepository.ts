import { getDB } from '../lib/sqlite';
import { Producto } from '../types/database.types';
import * as Crypto from 'expo-crypto';

export const ProductoRepository = {
    getAll: async (): Promise<Producto[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Producto>('SELECT * FROM productos ORDER BY nombre ASC');
        return result;
    },

    getById: async (id: string): Promise<Producto | null> => {
        const db = getDB();
        const result = await db.getFirstAsync<Producto>('SELECT * FROM productos WHERE id = ?', [id]);
        return result || null;
    },

    create: async (producto: Omit<Producto, 'id' | 'created_at'>) => {
        const db = getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO productos (id, nombre, unidad, precio_costo, precio_venta) VALUES (?, ?, ?, ?, ?)`,
            [id, producto.nombre, producto.unidad, producto.precio_costo, producto.precio_venta]
        );
        return id;
    },

    update: async (id: string, producto: Partial<Producto>) => {
        const db = getDB();
        const fields = Object.keys(producto).filter(k => k !== 'id' && k !== 'created_at');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => (producto as any)[f]);

        await db.runAsync(`UPDATE productos SET ${setClause} WHERE id = ?`, [...values, id]);
    },

    delete: async (id: string) => {
        const db = getDB();
        await db.runAsync('DELETE FROM productos WHERE id = ?', [id]);
    },

    search: async (query: string): Promise<Producto[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Producto>(
            'SELECT * FROM productos WHERE nombre LIKE ? ORDER BY nombre ASC',
            [`%${query}%`]
        );
        return result;
    }
};
