import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../shared/sqlite-schema.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create data directory if it doesn't exist
const dataDir = join(__dirname, "..", "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "fm-tactical-analyzer.db");

// Create SQLite database connection
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = on");

// Create Drizzle instance
export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  // Create players table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      created_at INTEGER
    )
  `);

  // Create snapshots table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      current_ability INTEGER,
      potential_ability INTEGER,
      import_date INTEGER,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);

  // Create attributes table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
    )
  `);

  // Create tactics table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tactics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      formation TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `);

  // Create positions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tactic_id INTEGER NOT NULL,
      position_code TEXT NOT NULL,
      role TEXT NOT NULL,
      duty TEXT NOT NULL,
      FOREIGN KEY (tactic_id) REFERENCES tactics(id) ON DELETE CASCADE
    )
  `);

  // Create position_scores table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS position_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      snapshot_id INTEGER NOT NULL,
      score REAL NOT NULL,
      calculated_at INTEGER,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
      FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_players_name_age ON players(name, age);
    CREATE INDEX IF NOT EXISTS idx_snapshots_player_id ON snapshots(player_id);
    CREATE INDEX IF NOT EXISTS idx_attributes_snapshot_id ON attributes(snapshot_id);
    CREATE INDEX IF NOT EXISTS idx_position_scores_player_position ON position_scores(player_id, position_id);
  `);

  console.log("Database initialized successfully");
}

export { sqlite };