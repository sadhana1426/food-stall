import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('tastybites.db');
  
  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pricePaise INTEGER NOT NULL,
      category TEXT NOT NULL,
      isAvailable INTEGER NOT NULL,
      sortOrder INTEGER NOT NULL,
      imageUri TEXT,
      updatedAt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS pending_orders (
      clientOrderId TEXT PRIMARY KEY,
      localOrderId TEXT NOT NULL,
      orderData TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  
  return db;
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};
