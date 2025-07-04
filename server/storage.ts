import { 
  players, 
  snapshots, 
  attributes, 
  tactics, 
  positions, 
  positionAttributes, 
  positionRoleDutyAttributes,
  playerPositionScores,
  type Player, 
  type InsertPlayer, 
  type Snapshot, 
  type InsertSnapshot, 
  type Attribute, 
  type InsertAttribute, 
  type Tactic, 
  type InsertTactic, 
  type Position, 
  type InsertPosition, 
  type PositionAttribute, 
  type InsertPositionAttribute,
  type PositionRoleDutyAttribute,
  type InsertPositionRoleDutyAttribute,
  type PlayerPositionScore
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Player operations
  getPlayer(id: number): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;

  // Snapshot operations
  getSnapshot(id: number): Promise<Snapshot | undefined>;
  getSnapshotsByPlayer(playerId: number): Promise<Snapshot[]>;
  getLatestSnapshotByPlayer(playerId: number): Promise<Snapshot | undefined>;
  createSnapshot(snapshot: InsertSnapshot): Promise<Snapshot>;
  deleteSnapshot(id: number): Promise<boolean>;

  // Attribute operations
  getAttributesBySnapshot(snapshotId: number): Promise<Attribute[]>;
  createAttribute(attribute: InsertAttribute): Promise<Attribute>;
  createMultipleAttributes(attributes: InsertAttribute[]): Promise<Attribute[]>;
  deleteAttributesBySnapshot(snapshotId: number): Promise<boolean>;

  // Tactic operations
  getTactic(id: number): Promise<Tactic | undefined>;
  getAllTactics(): Promise<Tactic[]>;
  getActiveTactic(): Promise<Tactic | undefined>;
  createTactic(tactic: InsertTactic): Promise<Tactic>;
  updateTactic(id: number, tactic: Partial<InsertTactic>): Promise<Tactic | undefined>;
  deleteTactic(id: number): Promise<boolean>;
  setActiveTactic(id: number): Promise<boolean>;

  // Position operations
  getPosition(id: number): Promise<Position | undefined>;
  getPositionsByTactic(tacticId: number): Promise<Position[]>;
  createPosition(position: InsertPosition): Promise<Position>;
  deletePosition(id: number): Promise<boolean>;

  // Position attribute operations
  getPositionAttributes(positionId: number): Promise<PositionAttribute[]>;
  createPositionAttribute(positionAttribute: InsertPositionAttribute): Promise<PositionAttribute>;
  createMultiplePositionAttributes(positionAttributes: InsertPositionAttribute[]): Promise<PositionAttribute[]>;
  deletePositionAttributes(positionId: number): Promise<boolean>;

  // Position role duty attribute operations
  getPositionRoleDutyAttribute(positionCode: string, roleName: string, duty: string): Promise<PositionRoleDutyAttribute | undefined>;
  createPositionRoleDutyAttribute(attributes: InsertPositionRoleDutyAttribute): Promise<PositionRoleDutyAttribute>;
  updatePositionRoleDutyAttribute(positionCode: string, roleName: string, duty: string, attributes: Partial<InsertPositionRoleDutyAttribute>): Promise<PositionRoleDutyAttribute | undefined>;

  // Player position score operations
  getPlayerPositionScore(playerId: number, positionId: number, snapshotId: number): Promise<PlayerPositionScore | undefined>;
  getPlayerPositionScores(positionId: number): Promise<PlayerPositionScore[]>;
  getPlayerPositionScoresByTactic(tacticId: number): Promise<Array<PlayerPositionScore & { player: Player; position: Position; snapshot: Snapshot }>>;
  createPlayerPositionScore(score: Omit<PlayerPositionScore, 'id' | 'calculatedAt'>): Promise<PlayerPositionScore>;
  updatePlayerPositionScore(playerId: number, positionId: number, snapshotId: number, scoreData: Partial<PlayerPositionScore>): Promise<PlayerPositionScore | undefined>;
  calculateAndStorePositionScore(playerId: number, positionId: number, snapshotId: number): Promise<PlayerPositionScore>;
  getPositionEvaluationRankings(positionId: number): Promise<Array<Player & { snapshot: Snapshot; score: PlayerPositionScore; attributes: Attribute[] }>>;
  getTacticSquadAnalysis(tacticId: number): Promise<{
    positions: Array<Position & {
      bestPlayers: Array<Player & { snapshot: Snapshot; score: PlayerPositionScore }>;
      playerCount: number;
      averageScore: number;
    }>;
    overallFitness: number;
    squadGaps: string[];
  }>;

  // Complex queries
  getPlayersWithLatestSnapshots(): Promise<Array<Player & { latestSnapshot?: Snapshot; attributes?: Attribute[] }>>;
  getPlayerRankingsForPosition(positionId: number): Promise<Array<Player & { snapshot: Snapshot; score: number; attributes: Attribute[] }>>;
  
  // Tactic evaluation query
  getTacticEvaluation(tacticId: number): Promise<{
    tactic: Tactic;
    positions: Array<Position & {
      positionRoleDutyAttributes?: PositionRoleDutyAttribute;
    }>;
    players: Array<Player & {
      latestSnapshot: Snapshot;
      attributes: Attribute[];
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Player operations
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    console.log("Creating player with data:", JSON.stringify(player, null, 2));
    
    // Special debugging for Mylo Hall
    if (player.name === 'Mylo Hall') {
      console.log('=== MYLO HALL DATABASE DEBUG ===');
      console.log('Input positions:', player.positions);
      console.log('Input positions type:', typeof player.positions);
      console.log('Input positions length:', Array.isArray(player.positions) ? player.positions.length : 'not array');
    }
    
    const [created] = await db.insert(players).values(player).returning();
    console.log("Player created in database:", JSON.stringify(created, null, 2));
    
    if (player.name === 'Mylo Hall') {
      console.log('=== MYLO HALL DATABASE RESULT ===');
      console.log('Database positions:', created.positions);
      console.log('Database positions type:', typeof created.positions);
      console.log('===================================');
    }
    
    return created;
  }

  async updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [updated] = await db
      .update(players)
      .set({ ...player, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlayer(id: number): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.id, id));
    return result.rowCount > 0;
  }

  // Snapshot operations
  async getSnapshot(id: number): Promise<Snapshot | undefined> {
    const [snapshot] = await db.select().from(snapshots).where(eq(snapshots.id, id));
    return snapshot || undefined;
  }

  async getSnapshotsByPlayer(playerId: number): Promise<Snapshot[]> {
    return await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.playerId, playerId))
      .orderBy(desc(snapshots.snapshotDate));
  }

  async getLatestSnapshotByPlayer(playerId: number): Promise<Snapshot | undefined> {
    const [snapshot] = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.playerId, playerId))
      .orderBy(desc(snapshots.snapshotDate))
      .limit(1);
    return snapshot || undefined;
  }

  async createSnapshot(snapshot: InsertSnapshot): Promise<Snapshot> {
    const [created] = await db.insert(snapshots).values(snapshot).returning();
    return created;
  }

  async deleteSnapshot(id: number): Promise<boolean> {
    const result = await db.delete(snapshots).where(eq(snapshots.id, id));
    return result.rowCount > 0;
  }

  // Attribute operations
  async getAttributesBySnapshot(snapshotId: number): Promise<Attribute[]> {
    return await db.select().from(attributes).where(eq(attributes.snapshotId, snapshotId));
  }

  async createAttribute(attribute: InsertAttribute): Promise<Attribute> {
    const [created] = await db.insert(attributes).values(attribute).returning();
    return created;
  }

  async createMultipleAttributes(attributeList: InsertAttribute[]): Promise<Attribute[]> {
    return await db.insert(attributes).values(attributeList).returning();
  }

  async deleteAttributesBySnapshot(snapshotId: number): Promise<boolean> {
    const result = await db.delete(attributes).where(eq(attributes.snapshotId, snapshotId));
    return result.rowCount > 0;
  }

  // Tactic operations
  async getTactic(id: number): Promise<Tactic | undefined> {
    const [tactic] = await db.select().from(tactics).where(eq(tactics.id, id));
    return tactic || undefined;
  }

  async getAllTactics(): Promise<Tactic[]> {
    return await db.select().from(tactics);
  }

  async getActiveTactic(): Promise<Tactic | undefined> {
    const [tactic] = await db.select().from(tactics).where(eq(tactics.isActive, true));
    return tactic || undefined;
  }

  async createTactic(tactic: InsertTactic): Promise<Tactic> {
    const [created] = await db.insert(tactics).values(tactic).returning();
    return created;
  }

  async updateTactic(id: number, tactic: Partial<InsertTactic>): Promise<Tactic | undefined> {
    const [updated] = await db
      .update(tactics)
      .set(tactic)
      .where(eq(tactics.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTactic(id: number): Promise<boolean> {
    const result = await db.delete(tactics).where(eq(tactics.id, id));
    return result.rowCount > 0;
  }

  async setActiveTactic(id: number): Promise<boolean> {
    // First, set all tactics to inactive
    await db.update(tactics).set({ isActive: false });
    // Then set the specified tactic as active
    const result = await db.update(tactics).set({ isActive: true }).where(eq(tactics.id, id));
    return result.rowCount > 0;
  }

  // Position operations
  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async getPositionsByTactic(tacticId: number): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.tacticId, tacticId));
  }

  async createPosition(position: InsertPosition): Promise<Position> {
    const [created] = await db.insert(positions).values(position).returning();
    return created;
  }

  async deletePosition(id: number): Promise<boolean> {
    const result = await db.delete(positions).where(eq(positions.id, id));
    return result.rowCount > 0;
  }

  // Position attribute operations
  async getPositionAttributes(positionId: number): Promise<PositionAttribute[]> {
    return await db.select().from(positionAttributes).where(eq(positionAttributes.positionId, positionId));
  }

  async createPositionAttribute(positionAttribute: InsertPositionAttribute): Promise<PositionAttribute> {
    const [created] = await db.insert(positionAttributes).values(positionAttribute).returning();
    return created;
  }

  async createMultiplePositionAttributes(positionAttributeList: InsertPositionAttribute[]): Promise<PositionAttribute[]> {
    return await db.insert(positionAttributes).values(positionAttributeList).returning();
  }

  async deletePositionAttributes(positionId: number): Promise<boolean> {
    const result = await db.delete(positionAttributes).where(eq(positionAttributes.positionId, positionId));
    return result.rowCount > 0;
  }

  // Position role duty attribute operations
  async getPositionRoleDutyAttribute(positionCode: string, roleName: string, duty: string): Promise<PositionRoleDutyAttribute | undefined> {
    const [attribute] = await db
      .select()
      .from(positionRoleDutyAttributes)
      .where(
        and(
          eq(positionRoleDutyAttributes.positionCode, positionCode),
          eq(positionRoleDutyAttributes.roleName, roleName),
          eq(positionRoleDutyAttributes.duty, duty)
        )
      );
    return attribute || undefined;
  }

  async createPositionRoleDutyAttribute(attributes: InsertPositionRoleDutyAttribute): Promise<PositionRoleDutyAttribute> {
    const [created] = await db
      .insert(positionRoleDutyAttributes)
      .values(attributes)
      .returning();
    return created;
  }

  async updatePositionRoleDutyAttribute(positionCode: string, roleName: string, duty: string, attributes: Partial<InsertPositionRoleDutyAttribute>): Promise<PositionRoleDutyAttribute | undefined> {
    const [updated] = await db
      .update(positionRoleDutyAttributes)
      .set(attributes)
      .where(
        and(
          eq(positionRoleDutyAttributes.positionCode, positionCode),
          eq(positionRoleDutyAttributes.roleName, roleName),
          eq(positionRoleDutyAttributes.duty, duty)
        )
      )
      .returning();
    return updated || undefined;
  }

  // Player position score operations
  async getPlayerPositionScore(playerId: number, positionId: number, snapshotId: number): Promise<PlayerPositionScore | undefined> {
    const result = await db.select().from(playerPositionScores)
      .where(and(
        eq(playerPositionScores.playerId, playerId),
        eq(playerPositionScores.positionId, positionId),
        eq(playerPositionScores.snapshotId, snapshotId)
      ))
      .limit(1);
    return result[0];
  }

  async getPlayerPositionScores(positionId: number): Promise<PlayerPositionScore[]> {
    return await db.select().from(playerPositionScores)
      .where(eq(playerPositionScores.positionId, positionId));
  }

  async getPlayerPositionScoresByTactic(tacticId: number): Promise<Array<PlayerPositionScore & { player: Player; position: Position; snapshot: Snapshot }>> {
    return await db.select({
      id: playerPositionScores.id,
      playerId: playerPositionScores.playerId,
      positionId: playerPositionScores.positionId,
      snapshotId: playerPositionScores.snapshotId,
      score: playerPositionScores.score,
      maxPossibleScore: playerPositionScores.maxPossibleScore,
      keyAttributeScore: playerPositionScores.keyAttributeScore,
      preferredAttributeScore: playerPositionScores.preferredAttributeScore,
      otherAttributeScore: playerPositionScores.otherAttributeScore,
      fitnessPercentage: playerPositionScores.fitnessPercentage,
      calculatedAt: playerPositionScores.calculatedAt,
      player: players,
      position: positions,
      snapshot: snapshots
    })
    .from(playerPositionScores)
    .innerJoin(players, eq(playerPositionScores.playerId, players.id))
    .innerJoin(positions, eq(playerPositionScores.positionId, positions.id))
    .innerJoin(snapshots, eq(playerPositionScores.snapshotId, snapshots.id))
    .where(eq(positions.tacticId, tacticId));
  }

  async createPlayerPositionScore(score: Omit<PlayerPositionScore, 'id' | 'calculatedAt'>): Promise<PlayerPositionScore> {
    const result = await db.insert(playerPositionScores)
      .values(score)
      .returning();
    return result[0];
  }

  async updatePlayerPositionScore(playerId: number, positionId: number, snapshotId: number, scoreData: Partial<PlayerPositionScore>): Promise<PlayerPositionScore | undefined> {
    const result = await db.update(playerPositionScores)
      .set({ ...scoreData, calculatedAt: new Date() })
      .where(and(
        eq(playerPositionScores.playerId, playerId),
        eq(playerPositionScores.positionId, positionId),
        eq(playerPositionScores.snapshotId, snapshotId)
      ))
      .returning();
    return result[0];
  }

  async calculateAndStorePositionScore(playerId: number, positionId: number, snapshotId: number): Promise<PlayerPositionScore> {
    // Get player attributes
    const playerAttributes = await this.getAttributesBySnapshot(snapshotId);
    
    // Get position requirements
    const position = await this.getPosition(positionId);
    if (!position) {
      throw new Error(`Position ${positionId} not found`);
    }

    const positionAttributes = await this.getPositionAttributes(positionId);
    
    // Calculate weighted scores
    let keyAttributeScore = 0;
    let preferredAttributeScore = 0;
    let otherAttributeScore = 0;
    let maxKeyScore = 0;
    let maxPreferredScore = 0;
    let maxOtherScore = 0;

    const keyAttributeNames = positionAttributes.filter(pa => pa.weight === 3).map(pa => pa.attributeName);
    const preferredAttributeNames = positionAttributes.filter(pa => pa.weight === 2).map(pa => pa.attributeName);
    
    // Calculate key attributes (weight 3x)
    keyAttributeNames.forEach(attrName => {
      const playerAttr = playerAttributes.find(pa => pa.attributeName === attrName);
      if (playerAttr) {
        keyAttributeScore += playerAttr.attributeValue * 3;
      }
      maxKeyScore += 20 * 3; // Max attribute value is 20
    });

    // Calculate preferred attributes (weight 2x)
    preferredAttributeNames.forEach(attrName => {
      const playerAttr = playerAttributes.find(pa => pa.attributeName === attrName);
      if (playerAttr) {
        preferredAttributeScore += playerAttr.attributeValue * 2;
      }
      maxPreferredScore += 20 * 2;
    });

    // Calculate other relevant attributes (weight 1x)
    const relevantAttributes = position.positionCode === 'GK' 
      ? ['Reflexes', 'Handling', 'One on Ones', 'Aerial Reach', 'Command of Area', 'Communication', 'Kicking', 'Throwing']
      : ['Pace', 'Acceleration', 'Stamina', 'Work Rate', 'Teamwork', 'Decisions', 'Positioning', 'Balance'];
    
    relevantAttributes.forEach(attrName => {
      if (!keyAttributeNames.includes(attrName) && !preferredAttributeNames.includes(attrName)) {
        const playerAttr = playerAttributes.find(pa => pa.attributeName === attrName);
        if (playerAttr) {
          otherAttributeScore += playerAttr.attributeValue;
        }
        maxOtherScore += 20;
      }
    });

    const totalScore = keyAttributeScore + preferredAttributeScore + otherAttributeScore;
    const maxPossibleScore = maxKeyScore + maxPreferredScore + maxOtherScore;
    const fitnessPercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    const scoreData = {
      playerId,
      positionId,
      snapshotId,
      score: totalScore,
      maxPossibleScore,
      keyAttributeScore,
      preferredAttributeScore,
      otherAttributeScore,
      fitnessPercentage: fitnessPercentage.toFixed(2)
    };

    // Check if score already exists
    const existingScore = await this.getPlayerPositionScore(playerId, positionId, snapshotId);
    
    if (existingScore) {
      return await this.updatePlayerPositionScore(playerId, positionId, snapshotId, scoreData) || existingScore;
    } else {
      return await this.createPlayerPositionScore(scoreData);
    }
  }

  async getPositionEvaluationRankings(positionId: number): Promise<Array<Player & { snapshot: Snapshot; score: PlayerPositionScore; attributes: Attribute[] }>> {
    const scores = await db.select({
      player: players,
      snapshot: snapshots,
      score: playerPositionScores
    })
    .from(playerPositionScores)
    .innerJoin(players, eq(playerPositionScores.playerId, players.id))
    .innerJoin(snapshots, eq(playerPositionScores.snapshotId, snapshots.id))
    .where(eq(playerPositionScores.positionId, positionId))
    .orderBy(desc(playerPositionScores.fitnessPercentage));

    // Get attributes for each player
    const results = [];
    for (const { player, snapshot, score } of scores) {
      const attributes = await this.getAttributesBySnapshot(snapshot.id);
      results.push({
        ...player,
        snapshot,
        score,
        attributes
      });
    }

    return results;
  }

  async getTacticSquadAnalysis(tacticId: number): Promise<{
    positions: Array<Position & {
      bestPlayers: Array<Player & { snapshot: Snapshot; score: PlayerPositionScore }>;
      playerCount: number;
      averageScore: number;
    }>;
    overallFitness: number;
    squadGaps: string[];
  }> {
    const tacticPositions = await this.getPositionsByTactic(tacticId);
    const results = [];
    let totalFitness = 0;
    const squadGaps: string[] = [];

    for (const position of tacticPositions) {
      const rankings = await this.getPositionEvaluationRankings(position.id);
      const bestPlayers = rankings.slice(0, 3); // Top 3 players for each position
      const averageScore = rankings.length > 0 
        ? rankings.reduce((sum, p) => sum + parseFloat(p.score.fitnessPercentage), 0) / rankings.length
        : 0;

      if (rankings.length === 0) {
        squadGaps.push(`No players evaluated for ${position.positionCode}`);
      } else if (averageScore < 60) {
        squadGaps.push(`Weak depth at ${position.positionCode} (${averageScore.toFixed(1)}% avg)`);
      }

      results.push({
        ...position,
        bestPlayers,
        playerCount: rankings.length,
        averageScore
      });

      totalFitness += averageScore;
    }

    return {
      positions: results,
      overallFitness: tacticPositions.length > 0 ? totalFitness / tacticPositions.length : 0,
      squadGaps
    };
  }

  // Complex queries
  async getPlayersWithLatestSnapshots(): Promise<Array<Player & { latestSnapshot?: Snapshot; attributes?: Attribute[] }>> {
    const allPlayers = await this.getAllPlayers();
    const result = [];

    for (const player of allPlayers) {
      const latestSnapshot = await this.getLatestSnapshotByPlayer(player.id);
      let attributes: Attribute[] = [];
      
      if (latestSnapshot) {
        attributes = await this.getAttributesBySnapshot(latestSnapshot.id);
      }

      result.push({
        ...player,
        latestSnapshot,
        attributes,
      });
    }

    return result;
  }

  async getPlayerRankingsForPosition(positionId: number): Promise<Array<Player & { snapshot: Snapshot; score: number; attributes: Attribute[] }>> {
    const scores = await this.getPlayerPositionScores(positionId);
    const result = [];

    for (const scoreRecord of scores) {
      const player = await this.getPlayer(scoreRecord.playerId);
      const snapshot = await this.getSnapshot(scoreRecord.snapshotId);
      const attributes = await this.getAttributesBySnapshot(scoreRecord.snapshotId);

      if (player && snapshot) {
        result.push({
          ...player,
          snapshot,
          score: scoreRecord.score || 0,
          attributes,
        });
      }
    }

    return result;
  }

  async getTacticEvaluation(tacticId: number): Promise<{
    tactic: Tactic;
    positions: Array<Position & {
      positionRoleDutyAttributes?: PositionRoleDutyAttribute;
    }>;
    players: Array<Player & {
      latestSnapshot: Snapshot;
      attributes: Attribute[];
    }>;
  }> {
    // Get the tactic
    const tactic = await this.getTactic(tacticId);
    if (!tactic) {
      throw new Error(`Tactic with id ${tacticId} not found`);
    }

    // Get all positions for this tactic with their role/duty attributes
    const tacticPositions = await db
      .select({
        position: positions,
        positionRoleDutyAttributes: positionRoleDutyAttributes,
      })
      .from(positions)
      .leftJoin(
        positionRoleDutyAttributes,
        and(
          eq(positionRoleDutyAttributes.positionCode, positions.positionCode),
          eq(positionRoleDutyAttributes.roleName, positions.roleName),
          eq(positionRoleDutyAttributes.duty, positions.duty)
        )
      )
      .where(eq(positions.tacticId, tacticId));

    const positionsWithAttributes = tacticPositions.map(item => ({
      ...item.position,
      positionRoleDutyAttributes: item.positionRoleDutyAttributes || undefined,
    }));

    // Use the existing optimized method for players with latest snapshots
    const playersWithLatestSnapshots = await this.getPlayersWithLatestSnapshots();
    
    // Filter to only players that have snapshots and get their attributes
    const playersWithAttributes: Array<Player & {
      latestSnapshot: Snapshot;
      attributes: Attribute[];
    }> = [];

    for (const player of playersWithLatestSnapshots) {
      if (player.latestSnapshot) {
        const playerAttributes = await this.getAttributesBySnapshot(player.latestSnapshot.id);
        playersWithAttributes.push({
          ...player,
          latestSnapshot: player.latestSnapshot,
          attributes: playerAttributes,
        });
      }
    }

    return {
      tactic,
      positions: positionsWithAttributes,
      players: playersWithAttributes,
    };
  }
}

export const storage = new DatabaseStorage();
