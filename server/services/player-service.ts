import { db } from "../sqlite-db.js";
import { 
  players, 
  snapshots, 
  attributes,
  positionScores,
  type InsertPlayer,
  type InsertSnapshot,
  type InsertAttribute,
  type Player
} from "../../shared/sqlite-schema.js";
import { FMHtmlParser, type ParsedPlayer } from "../parsers/fm-html-parser.js";
import { eq, and, desc } from "drizzle-orm";

export interface ImportResult {
  success: boolean;
  playersImported: number;
  playersUpdated: number;
  errors: string[];
  warnings: string[];
}

export interface PlayerWithSnapshot {
  id: number;
  name: string;
  age: number;
  currentAbility: number | null;
  potentialAbility: number | null;
  attributes: Record<string, number>;
  snapshotId: number;
  importDate: Date;
}

export class PlayerService {
  
  public async importPlayersFromHtml(htmlContent: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      playersImported: 0,
      playersUpdated: 0,
      errors: [],
      warnings: []
    };

    try {
      // Parse HTML
      const parser = new FMHtmlParser(htmlContent);
      const parseResult = parser.parse();
      
      if (!parseResult.success) {
        result.errors = parseResult.errors;
        result.warnings = parseResult.warnings;
        return result;
      }

      // Import each player
      for (const parsedPlayer of parseResult.players) {
        try {
          const importedPlayer = await this.importSinglePlayer(parsedPlayer);
          if (importedPlayer.isNew) {
            result.playersImported++;
          } else {
            result.playersUpdated++;
          }
        } catch (error) {
          result.warnings.push(`Failed to import player ${parsedPlayer.name}: ${error}`);
        }
      }

      result.success = true;
      result.warnings.push(...parseResult.warnings);
      
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  private async importSinglePlayer(parsedPlayer: ParsedPlayer): Promise<{ playerId: number; isNew: boolean }> {
    // Try to find existing player by name and age
    const existingPlayer = await db.select()
      .from(players)
      .where(and(
        eq(players.name, parsedPlayer.name),
        eq(players.age, parsedPlayer.age)
      ))
      .limit(1);

    let playerId: number;
    let isNew = false;

    if (existingPlayer.length > 0) {
      // Player exists, use existing ID
      playerId = existingPlayer[0].id;
    } else {
      // Create new player
      const newPlayer: InsertPlayer = {
        name: parsedPlayer.name,
        age: parsedPlayer.age
      };
      
      const insertResult = await db.insert(players).values(newPlayer).returning({ id: players.id });
      playerId = insertResult[0].id;
      isNew = true;
    }

    // Create new snapshot
    const newSnapshot: InsertSnapshot = {
      playerId,
      currentAbility: parsedPlayer.currentAbility,
      potentialAbility: parsedPlayer.potentialAbility
    };

    const snapshotResult = await db.insert(snapshots).values(newSnapshot).returning({ id: snapshots.id });
    const snapshotId = snapshotResult[0].id;

    // Insert attributes
    const attributeInserts: InsertAttribute[] = Object.entries(parsedPlayer.attributes).map(([name, value]) => ({
      snapshotId,
      name,
      value
    }));

    if (attributeInserts.length > 0) {
      await db.insert(attributes).values(attributeInserts);
    }

    return { playerId, isNew };
  }

  public async getPlayersWithLatestSnapshot(): Promise<PlayerWithSnapshot[]> {
    // Get all players with their most recent snapshot
    const allPlayers = await db.select().from(players);
    
    const playersWithSnapshots: PlayerWithSnapshot[] = [];
    
    for (const player of allPlayers) {
      // Get the most recent snapshot for this player
      const latestSnapshot = await db.select()
        .from(snapshots)
        .where(eq(snapshots.playerId, player.id))
        .orderBy(desc(snapshots.importDate))
        .limit(1);
      
      if (latestSnapshot.length === 0) continue;
      
      const snapshot = latestSnapshot[0];
      
      // Get all attributes for this snapshot
      const snapshotAttributes = await db.select()
        .from(attributes)
        .where(eq(attributes.snapshotId, snapshot.id));
      
      const attributesMap: Record<string, number> = {};
      snapshotAttributes.forEach(attr => {
        attributesMap[attr.name] = attr.value;
      });
      
      playersWithSnapshots.push({
        id: player.id,
        name: player.name,
        age: player.age,
        currentAbility: snapshot.currentAbility,
        potentialAbility: snapshot.potentialAbility,
        attributes: attributesMap,
        snapshotId: snapshot.id,
        importDate: snapshot.importDate
      });
    }
    
    // Sort by name
    return playersWithSnapshots.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getPlayerProgressHistory(playerId: number): Promise<{
    snapshots: Array<{
      id: number;
      currentAbility: number | null;
      potentialAbility: number | null;
      importDate: Date;
      attributes: Record<string, number>;
    }>;
  }> {
    // Get all snapshots for a player with their attributes
    const playerSnapshots = await db.select({
      id: snapshots.id,
      currentAbility: snapshots.currentAbility,
      potentialAbility: snapshots.potentialAbility,
      importDate: snapshots.importDate
    })
    .from(snapshots)
    .where(eq(snapshots.playerId, playerId))
    .orderBy(desc(snapshots.importDate));

    const snapshotsWithAttributes = await Promise.all(
      playerSnapshots.map(async (snapshot) => {
        const snapshotAttributes = await db.select({
          name: attributes.name,
          value: attributes.value
        })
        .from(attributes)
        .where(eq(attributes.snapshotId, snapshot.id));

        const attributesMap: Record<string, number> = {};
        snapshotAttributes.forEach(attr => {
          attributesMap[attr.name] = attr.value;
        });

        return {
          ...snapshot,
          attributes: attributesMap
        };
      })
    );

    return {
      snapshots: snapshotsWithAttributes
    };
  }

  public async deleteAllData(): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await db.delete(positionScores);
    await db.delete(attributes);
    await db.delete(snapshots);
    await db.delete(players);
  }

  public async getDatabaseStats(): Promise<{
    totalPlayers: number;
    totalSnapshots: number;
    lastImportDate: Date | null;
  }> {
    const playerCount = await db.select().from(players);
    const snapshotCount = await db.select().from(snapshots);
    
    const latestSnapshot = await db.select({ importDate: snapshots.importDate })
      .from(snapshots)
      .orderBy(desc(snapshots.importDate))
      .limit(1);

    return {
      totalPlayers: playerCount.length,
      totalSnapshots: snapshotCount.length,
      lastImportDate: latestSnapshot.length > 0 ? latestSnapshot[0].importDate : null
    };
  }
}