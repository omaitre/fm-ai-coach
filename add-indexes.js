import Database from 'better-sqlite3';
import path from 'path';

async function addIndexes() {
  try {
    console.log("Adding database indexes...");

    // Connect directly to the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'fm-tracker.db');
    const sqlite = new Database(dbPath);

    // Add performance indexes for SQLite
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_snapshots_player_date ON snapshots(player_id, snapshot_date DESC)`);
    console.log("✓ Added snapshots index");

    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_attributes_snapshot ON attributes(snapshot_id)`);
    console.log("✓ Added attributes index");

    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_position_scores_ranking ON player_position_scores(position_id, fitness_percentage DESC)`);
    console.log("✓ Added position scores index");

    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_players_name ON players(name)`);
    console.log("✓ Added players name index");

    console.log("All indexes added successfully!");
    sqlite.close();

  } catch (error) {
    console.error("Error adding indexes:", error);
    process.exit(1);
  }
}

addIndexes();