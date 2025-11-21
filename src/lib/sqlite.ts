import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('diana.db');

export const initDatabase = async () => {
    try {
        await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        cuil TEXT,
        direccion TEXT,
        telefono TEXT,
        mail TEXT,
        tipo TEXT NOT NULL,
        saldo NUMERIC DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        unidad TEXT NOT NULL,
        precio_costo NUMERIC NOT NULL,
        precio_venta NUMERIC NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS proveedores (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        saldo NUMERIC DEFAULT 0,
        direccion TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS pedidos (
        id TEXT PRIMARY KEY NOT NULL,
        cliente_id TEXT NOT NULL,
        total NUMERIC NOT NULL,
        fecha TEXT NOT NULL,
        estado TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
      );
      CREATE TABLE IF NOT EXISTS pedido_lineas (
        id TEXT PRIMARY KEY NOT NULL,
        pedido_id TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        cantidad NUMERIC NOT NULL,
        precio_unit_costo NUMERIC NOT NULL,
        precio_unit_venta NUMERIC NOT NULL,
        proveedor_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY(producto_id) REFERENCES productos(id),
        FOREIGN KEY(proveedor_id) REFERENCES proveedores(id)
      );
      CREATE TABLE IF NOT EXISTS pagos_clientes (
        id TEXT PRIMARY KEY NOT NULL,
        pedido_id TEXT,
        cliente_id TEXT NOT NULL,
        fecha TEXT NOT NULL,
        monto NUMERIC NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(pedido_id) REFERENCES pedidos(id),
        FOREIGN KEY(cliente_id) REFERENCES clientes(id)
      );
      CREATE TABLE IF NOT EXISTS pagos_proveedores (
        id TEXT PRIMARY KEY NOT NULL,
        proveedor_id TEXT NOT NULL,
        fecha TEXT NOT NULL,
        monto NUMERIC NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(proveedor_id) REFERENCES proveedores(id)
      );
    `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export const getDB = () => db;
