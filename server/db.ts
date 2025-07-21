import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// SQLite database file path
const dbPath = path.join(dataDir, 'fm-tracker.db');

// Create SQLite connection
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Export sqlite instance for raw queries if needed
export const sqliteDb = sqlite;

console.log(`Database connected at: ${dbPath}`);