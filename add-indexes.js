import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function addIndexes() {
  try {
    console.log("Adding database indexes...");

    // Add performance indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_snapshots_player_date ON snapshots(player_id, snapshot_date DESC)`);
    console.log("✓ Added snapshots index");

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_attributes_snapshot ON attributes(snapshot_id)`);
    console.log("✓ Added attributes index");

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_position_scores_ranking ON player_position_scores(position_id, fitness_percentage DESC)`);
    console.log("✓ Added position scores index");

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_players_name ON players(name)`);
    console.log("✓ Added players name index");

    console.log("All indexes added successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Error adding indexes:", error);
    process.exit(1);
  }
}

addIndexes();
