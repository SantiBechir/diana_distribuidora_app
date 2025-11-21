import { supabase } from '../lib/supabase';
import { getDB } from '../lib/sqlite';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// This service handles synchronization between local SQLite and Supabase.
// It assumes a "last write wins" or simple "push local to remote" strategy for this MVP.
// In a real app, we'd need more complex conflict resolution.

export const SyncService = {
    checkConnection: async () => {
        const state = await NetInfo.fetch();
        return state.isConnected;
    },

    syncTable: async (tableName: string) => {
        const db = getDB();
        const isConnected = await SyncService.checkConnection();
        if (!isConnected) return;

        try {
            // 1. Push unsynced local changes to Supabase
            const unsynced = await db.getAllAsync(`SELECT * FROM ${tableName} WHERE synced = 0`);

            for (const item of unsynced) {
                const { synced, ...data } = item as any;

                // Check if exists remotely to decide upsert vs insert, or just use upsert
                const { error } = await supabase.from(tableName).upsert(data);

                if (!error) {
                    await db.runAsync(`UPDATE ${tableName} SET synced = 1 WHERE id = ?`, [data.id]);
                } else {
                    console.error(`Error syncing ${tableName} item ${data.id}:`, error);
                }
            }

            // 2. Pull remote changes (optional for this MVP, but good for multi-device)
            // For now, we focus on pushing local data as it's an offline-first app for a single user mostly.

        } catch (error) {
            console.error(`Sync error for ${tableName}:`, error);
        }
    },

    syncAll: async () => {
        const tables = [
            'clientes',
            'productos',
            'proveedores',
            'pedidos',
            'pedido_lineas',
            'pagos_clientes',
            'pagos_proveedores'
        ];

        for (const table of tables) {
            await SyncService.syncTable(table);
        }
    }
};
