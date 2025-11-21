import { getDB } from '../lib/sqlite';
import { Cliente } from '../types/database.types';
import * as Crypto from 'expo-crypto';

export const ClienteRepository = {
    getAll: async (): Promise<Cliente[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Cliente>('SELECT * FROM clientes ORDER BY nombre ASC');
        return result;
    },

    getById: async (id: string): Promise<Cliente | null> => {
        const db = getDB();
        const result = await db.getFirstAsync<Cliente>('SELECT * FROM clientes WHERE id = ?', [id]);
        return result || null;
    },

    create: async (cliente: Omit<Cliente, 'id' | 'created_at' | 'saldo'>) => {
        const db = getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO clientes (id, nombre, cuil, direccion, telefono, mail, tipo, saldo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, cliente.nombre, cliente.cuil, cliente.direccion, cliente.telefono, cliente.mail, cliente.tipo, 0]
        );
        return id;
    },

    update: async (id: string, cliente: Partial<Cliente>) => {
        const db = getDB();
        // Construct query dynamically based on fields
        const fields = Object.keys(cliente).filter(k => k !== 'id' && k !== 'created_at' && k !== 'saldo');
        if (fields.length === 0) return;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => (cliente as any)[f]);

        await db.runAsync(`UPDATE clientes SET ${setClause} WHERE id = ?`, [...values, id]);
    },

    delete: async (id: string) => {
        const db = getDB();
        await db.runAsync('DELETE FROM clientes WHERE id = ?', [id]);
    },

    search: async (query: string): Promise<Cliente[]> => {
        const db = getDB();
        const result = await db.getAllAsync<Cliente>(
            'SELECT * FROM clientes WHERE nombre LIKE ? OR cuil LIKE ? ORDER BY nombre ASC',
            [`%${query}%`, `%${query}%`]
        );
        return result;
    }
};
