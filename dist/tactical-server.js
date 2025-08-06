var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/tactical-server.ts
import express2 from "express";
import { fileURLToPath as fileURLToPath3 } from "url";
import { dirname as dirname3, join as join3 } from "path";
import { existsSync as existsSync2 } from "fs";

// server/sqlite-db.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

// shared/sqlite-schema.ts
var sqlite_schema_exports = {};
__export(sqlite_schema_exports, {
  attributes: () => attributes,
  attributesRelations: () => attributesRelations,
  insertAttributeSchema: () => insertAttributeSchema,
  insertPlayerSchema: () => insertPlayerSchema,
  insertPositionSchema: () => insertPositionSchema,
  insertPositionScoreSchema: () => insertPositionScoreSchema,
  insertSnapshotSchema: () => insertSnapshotSchema,
  insertTacticSchema: () => insertTacticSchema,
  players: () => players,
  playersRelations: () => playersRelations,
  positionScores: () => positionScores,
  positionScoresRelations: () => positionScoresRelations,
  positions: () => positions,
  positionsRelations: () => positionsRelations,
  snapshots: () => snapshots,
  snapshotsRelations: () => snapshotsRelations,
  tactics: () => tactics,
  tacticsRelations: () => tacticsRelations
});
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
var snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  currentAbility: integer("current_ability"),
  potentialAbility: integer("potential_ability"),
  importDate: integer("import_date", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
var attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: integer("value").notNull()
});
var tactics = sqliteTable("tactics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  formation: text("formation").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
var positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tacticId: integer("tactic_id").notNull().references(() => tactics.id, { onDelete: "cascade" }),
  positionCode: text("position_code").notNull(),
  // "GK", "DL", "DR", "DC", "DM", "ML", "MR", "MC", "AML", "AMR", "AMC", "ST"
  role: text("role").notNull(),
  // "GK", "FB", "CB", "WB", "DM", "CM", "W", "AM", "ST", etc.
  duty: text("duty").notNull()
  // "defend", "support", "attack"
});
var positionScores = sqliteTable("position_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  score: real("score").notNull(),
  // 0-100 suitability score
  calculatedAt: integer("calculated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
var playersRelations = relations(players, ({ many }) => ({
  snapshots: many(snapshots),
  positionScores: many(positionScores)
}));
var snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  player: one(players, {
    fields: [snapshots.playerId],
    references: [players.id]
  }),
  attributes: many(attributes),
  positionScores: many(positionScores)
}));
var attributesRelations = relations(attributes, ({ one }) => ({
  snapshot: one(snapshots, {
    fields: [attributes.snapshotId],
    references: [snapshots.id]
  })
}));
var tacticsRelations = relations(tactics, ({ many }) => ({
  positions: many(positions)
}));
var positionsRelations = relations(positions, ({ one, many }) => ({
  tactic: one(tactics, {
    fields: [positions.tacticId],
    references: [tactics.id]
  }),
  positionScores: many(positionScores)
}));
var positionScoresRelations = relations(positionScores, ({ one }) => ({
  player: one(players, {
    fields: [positionScores.playerId],
    references: [players.id]
  }),
  position: one(positions, {
    fields: [positionScores.positionId],
    references: [positions.id]
  }),
  snapshot: one(snapshots, {
    fields: [positionScores.snapshotId],
    references: [snapshots.id]
  })
}));
var insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true
});
var insertSnapshotSchema = createInsertSchema(snapshots).omit({
  id: true,
  importDate: true
});
var insertAttributeSchema = createInsertSchema(attributes).omit({
  id: true
});
var insertTacticSchema = createInsertSchema(tactics).omit({
  id: true,
  createdAt: true
});
var insertPositionSchema = createInsertSchema(positions).omit({
  id: true
});
var insertPositionScoreSchema = createInsertSchema(positionScores).omit({
  id: true,
  calculatedAt: true
});

// server/sqlite-db.ts
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var dataDir = join(__dirname, "..", "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}
var dbPath = join(dataDir, "fm-tactical-analyzer.db");
var sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = on");
var db = drizzle(sqlite, { schema: sqlite_schema_exports });
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      created_at INTEGER
    )
  `);
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
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE
    )
  `);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tactics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      formation TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER
    )
  `);
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
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_players_name_age ON players(name, age);
    CREATE INDEX IF NOT EXISTS idx_snapshots_player_id ON snapshots(player_id);
    CREATE INDEX IF NOT EXISTS idx_attributes_snapshot_id ON attributes(snapshot_id);
    CREATE INDEX IF NOT EXISTS idx_position_scores_player_position ON position_scores(player_id, position_id);
  `);
  console.log("Database initialized successfully");
}

// server/tactical-routes.ts
import express from "express";
import multer from "multer";

// server/parsers/fm-html-parser.ts
import { JSDOM } from "jsdom";
var FM_ATTRIBUTE_MAPPINGS = {
  // Technical
  "Cor": "Corners",
  "Cro": "Crossing",
  "Dri": "Dribbling",
  "Fin": "Finishing",
  "Fir": "First Touch",
  "Fre": "Free Kick Taking",
  "Hea": "Heading",
  "L Th": "Long Throws",
  "Lon": "Long Shots",
  "Mar": "Marking",
  "Pas": "Passing",
  "Pen": "Penalty Taking",
  "Tck": "Tackling",
  "Tec": "Technique",
  // Mental
  "Agg": "Aggression",
  "Ant": "Anticipation",
  "Bra": "Bravery",
  "Cmp": "Composure",
  "Cnt": "Concentration",
  "Dec": "Decisions",
  "Det": "Determination",
  "Fla": "Flair",
  "Ldr": "Leadership",
  "OtB": "Off The Ball",
  "Pos": "Positioning",
  "Tea": "Teamwork",
  "Vis": "Vision",
  "Wor": "Work Rate",
  // Physical
  "Acc": "Acceleration",
  "Agi": "Agility",
  "Bal": "Balance",
  "Jum": "Jumping Reach",
  "Nat": "Natural Fitness",
  "Pac": "Pace",
  "Sta": "Stamina",
  "Str": "Strength",
  // Goalkeeper
  "Aer": "Aerial Reach",
  "Cmd": "Command of Area",
  "Com": "Communication",
  "Ecc": "Eccentricity",
  "Han": "Handling",
  "Kic": "Kicking",
  "1v1": "One on Ones",
  "Ref": "Reflexes",
  "TRO": "Rushing Out",
  "Thr": "Throwing",
  "Pun": "Punching"
};
var FMHtmlParser = class {
  dom;
  constructor(htmlContent) {
    this.dom = new JSDOM(htmlContent);
  }
  parse() {
    const result = {
      success: false,
      players: [],
      errors: [],
      warnings: []
    };
    try {
      const table = this.findPlayerTable();
      if (!table) {
        result.errors.push("No player data table found in HTML");
        return result;
      }
      const { headers, headerMap } = this.parseTableHeaders(table);
      if (headers.length === 0) {
        result.errors.push("No valid headers found in table");
        return result;
      }
      const rows = this.getDataRows(table);
      if (rows.length === 0) {
        result.errors.push("No player data rows found");
        return result;
      }
      const requiredColumns = ["Name", "Age", "CA", "PA", "Position"];
      const missingColumns = requiredColumns.filter((col) => !headerMap.has(col));
      if (missingColumns.length > 0) {
        result.errors.push(`Missing required columns: ${missingColumns.join(", ")}`);
        return result;
      }
      for (let i = 0; i < rows.length; i++) {
        try {
          const player = this.parsePlayerRow(rows[i], headers, headerMap);
          if (player) {
            result.players.push(player);
          }
        } catch (error) {
          result.warnings.push(`Failed to parse player row ${i + 1}: ${error}`);
        }
      }
      if (result.players.length === 0) {
        result.errors.push("No valid players could be parsed");
        return result;
      }
      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(`Parser error: ${error}`);
      return result;
    }
  }
  findPlayerTable() {
    const document = this.dom.window.document;
    const tables = document.querySelectorAll("table");
    for (const table of tables) {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const headerText = firstRow.textContent?.toLowerCase() || "";
        if (headerText.includes("name") && headerText.includes("age") && headerText.includes("ca")) {
          return table;
        }
      }
    }
    return null;
  }
  parseTableHeaders(table) {
    const headerRow = table.querySelector("tr");
    if (!headerRow) {
      return { headers: [], headerMap: /* @__PURE__ */ new Map() };
    }
    const headers = [];
    const headerMap = /* @__PURE__ */ new Map();
    const cells = headerRow.querySelectorAll("th, td");
    cells.forEach((cell, index) => {
      const cellText = cell.textContent?.trim() || "";
      if (cellText) {
        const fullName = FM_ATTRIBUTE_MAPPINGS[cellText] || cellText;
        headers.push(fullName);
        headerMap.set(fullName, index);
        if (cellText !== fullName) {
          headerMap.set(cellText, index);
        }
      }
    });
    return { headers, headerMap };
  }
  getDataRows(table) {
    const rows = Array.from(table.querySelectorAll("tr"));
    return rows.slice(1).filter((row) => {
      const cells = row.querySelectorAll("td");
      return cells.length > 0;
    });
  }
  parsePlayerRow(row, headers, headerMap) {
    const cells = row.querySelectorAll("td");
    if (cells.length === 0) return null;
    const nameIndex = headerMap.get("Name");
    const ageIndex = headerMap.get("Age");
    const caIndex = headerMap.get("CA");
    const paIndex = headerMap.get("PA");
    const positionIndex = headerMap.get("Position");
    if (nameIndex === void 0 || ageIndex === void 0 || positionIndex === void 0) {
      throw new Error("Missing required player data columns");
    }
    const name = cells[nameIndex]?.textContent?.trim();
    const ageText = cells[ageIndex]?.textContent?.trim();
    const caText = cells[caIndex]?.textContent?.trim();
    const paText = cells[paIndex]?.textContent?.trim();
    const position = cells[positionIndex]?.textContent?.trim();
    if (!name || !ageText || !position) {
      throw new Error("Missing required player data");
    }
    const age = parseInt(ageText);
    if (isNaN(age)) {
      throw new Error(`Invalid age: ${ageText}`);
    }
    const currentAbility = caText ? parseInt(caText) : null;
    const potentialAbility = paText ? parseInt(paText) : null;
    const attributes2 = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (["Name", "Age", "CA", "PA", "Position"].includes(header)) {
        continue;
      }
      const cellValue = cells[i]?.textContent?.trim();
      if (cellValue && cellValue !== "-" && cellValue !== "") {
        const numValue = parseInt(cellValue);
        if (!isNaN(numValue)) {
          attributes2[header] = numValue;
        }
      }
    }
    return {
      name,
      age,
      currentAbility,
      potentialAbility,
      position,
      attributes: attributes2
    };
  }
};
function validateFMHtmlStructure(htmlContent) {
  const errors = [];
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    if (!document.querySelector("table")) {
      errors.push("No HTML table found");
    }
    const tables = document.querySelectorAll("table");
    let hasPlayerTable = false;
    for (const table of tables) {
      const firstRow = table.querySelector("tr");
      if (firstRow) {
        const headerText = firstRow.textContent?.toLowerCase() || "";
        if (headerText.includes("name") && headerText.includes("age")) {
          hasPlayerTable = true;
          break;
        }
      }
    }
    if (!hasPlayerTable) {
      errors.push("No valid FM player data table found");
    }
  } catch (error) {
    errors.push(`HTML parsing error: ${error}`);
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

// server/services/player-service.ts
import { eq, and, desc } from "drizzle-orm";
var PlayerService = class {
  async importPlayersFromHtml(htmlContent) {
    const result = {
      success: false,
      playersImported: 0,
      playersUpdated: 0,
      errors: [],
      warnings: []
    };
    try {
      const parser = new FMHtmlParser(htmlContent);
      const parseResult = parser.parse();
      if (!parseResult.success) {
        result.errors = parseResult.errors;
        result.warnings = parseResult.warnings;
        return result;
      }
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
  async importSinglePlayer(parsedPlayer) {
    const existingPlayer = await db.select().from(players).where(and(
      eq(players.name, parsedPlayer.name),
      eq(players.age, parsedPlayer.age)
    )).limit(1);
    let playerId;
    let isNew = false;
    if (existingPlayer.length > 0) {
      playerId = existingPlayer[0].id;
    } else {
      const newPlayer = {
        name: parsedPlayer.name,
        age: parsedPlayer.age
      };
      const insertResult = await db.insert(players).values(newPlayer).returning({ id: players.id });
      playerId = insertResult[0].id;
      isNew = true;
    }
    const newSnapshot = {
      playerId,
      currentAbility: parsedPlayer.currentAbility,
      potentialAbility: parsedPlayer.potentialAbility
    };
    const snapshotResult = await db.insert(snapshots).values(newSnapshot).returning({ id: snapshots.id });
    const snapshotId = snapshotResult[0].id;
    const attributeInserts = Object.entries(parsedPlayer.attributes).map(([name, value]) => ({
      snapshotId,
      name,
      value
    }));
    if (attributeInserts.length > 0) {
      await db.insert(attributes).values(attributeInserts);
    }
    return { playerId, isNew };
  }
  async getPlayersWithLatestSnapshot() {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.age,
        s.id as snapshot_id,
        s.current_ability,
        s.potential_ability,
        s.import_date,
        GROUP_CONCAT(a.name || ':' || a.value) as attributes_data
      FROM players p
      JOIN snapshots s ON p.id = s.player_id
      JOIN attributes a ON s.id = a.snapshot_id
      WHERE s.id IN (
        SELECT s2.id 
        FROM snapshots s2 
        WHERE s2.player_id = p.id 
        ORDER BY s2.import_date DESC 
        LIMIT 1
      )
      GROUP BY p.id, p.name, p.age, s.id, s.current_ability, s.potential_ability, s.import_date
      ORDER BY p.name
    `;
    const results = db.prepare(query).all();
    return results.map((row) => {
      const attributesData = row.attributes_data || "";
      const attributes2 = {};
      if (attributesData) {
        const attrPairs = attributesData.split(",");
        for (const pair of attrPairs) {
          const [name, value] = pair.split(":");
          if (name && value) {
            attributes2[name] = parseInt(value);
          }
        }
      }
      return {
        id: row.id,
        name: row.name,
        age: row.age,
        currentAbility: row.current_ability,
        potentialAbility: row.potential_ability,
        attributes: attributes2,
        snapshotId: row.snapshot_id,
        importDate: new Date(row.import_date)
      };
    });
  }
  async getPlayerProgressHistory(playerId) {
    const playerSnapshots = await db.select({
      id: snapshots.id,
      currentAbility: snapshots.currentAbility,
      potentialAbility: snapshots.potentialAbility,
      importDate: snapshots.importDate
    }).from(snapshots).where(eq(snapshots.playerId, playerId)).orderBy(desc(snapshots.importDate));
    const snapshotsWithAttributes = await Promise.all(
      playerSnapshots.map(async (snapshot) => {
        const snapshotAttributes = await db.select({
          name: attributes.name,
          value: attributes.value
        }).from(attributes).where(eq(attributes.snapshotId, snapshot.id));
        const attributesMap = {};
        snapshotAttributes.forEach((attr) => {
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
  async deleteAllData() {
    await db.delete(positionScores);
    await db.delete(attributes);
    await db.delete(snapshots);
    await db.delete(players);
  }
  async getDatabaseStats() {
    const playerCount = await db.select().from(players);
    const snapshotCount = await db.select().from(snapshots);
    const latestSnapshot = await db.select({ importDate: snapshots.importDate }).from(snapshots).orderBy(desc(snapshots.importDate)).limit(1);
    return {
      totalPlayers: playerCount.length,
      totalSnapshots: snapshotCount.length,
      lastImportDate: latestSnapshot.length > 0 ? latestSnapshot[0].importDate : null
    };
  }
};

// server/services/tactic-service.ts
import { eq as eq2, and as and2 } from "drizzle-orm";
var TacticService = class {
  // Predefined formation templates
  formationTemplates = [
    {
      formation: "4-4-2",
      name: "4-4-2 Classic",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "FB", duty: "defend", defaultRole: "FB", defaultDuty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "defend", defaultRole: "FB", defaultDuty: "support" },
        { positionCode: "ML", role: "W", duty: "support", defaultRole: "W", defaultDuty: "attack" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MR", role: "W", duty: "support", defaultRole: "W", defaultDuty: "attack" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "ST", role: "DLF", duty: "support" }
      ]
    },
    {
      formation: "4-3-3",
      name: "4-3-3 Control",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "FB", duty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "AML", role: "W", duty: "attack" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "AMR", role: "W", duty: "attack" }
      ]
    },
    {
      formation: "4-2-3-1",
      name: "4-2-3-1 Gegenpress",
      positions: [
        { positionCode: "GK", role: "SK", duty: "support" },
        { positionCode: "DL", role: "FB", duty: "support" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "FB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "DM", role: "DM", duty: "support" },
        { positionCode: "AML", role: "IF", duty: "attack" },
        { positionCode: "AMC", role: "AM", duty: "attack" },
        { positionCode: "AMR", role: "IF", duty: "attack" },
        { positionCode: "ST", role: "PF", duty: "attack" }
      ]
    },
    {
      formation: "3-5-2",
      name: "3-5-2 Wing Play",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "ML", role: "WB", duty: "support" },
        { positionCode: "DM", role: "DM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MR", role: "WB", duty: "support" },
        { positionCode: "ST", role: "AF", duty: "attack" },
        { positionCode: "ST", role: "F9", duty: "support" }
      ]
    },
    {
      formation: "5-3-2",
      name: "5-3-2 Defensive",
      positions: [
        { positionCode: "GK", role: "GK", duty: "defend" },
        { positionCode: "DL", role: "WB", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DC", role: "CD", duty: "defend" },
        { positionCode: "DR", role: "WB", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "defend" },
        { positionCode: "MC", role: "CM", duty: "support" },
        { positionCode: "MC", role: "CM", duty: "defend" },
        { positionCode: "ST", role: "TM", duty: "support" },
        { positionCode: "ST", role: "AF", duty: "attack" }
      ]
    }
  ];
  getFormationTemplates() {
    return this.formationTemplates;
  }
  async createTacticFromTemplate(templateName, tacticName) {
    const template = this.formationTemplates.find((t) => t.name === templateName);
    if (!template) {
      throw new Error(`Formation template ${templateName} not found`);
    }
    await db.update(tactics).set({ isActive: false }).where(eq2(tactics.isActive, true));
    const newTactic = {
      name: tacticName || template.name,
      formation: template.formation,
      isActive: true
    };
    const tacticResult = await db.insert(tactics).values(newTactic).returning({ id: tactics.id });
    const tacticId = tacticResult[0].id;
    const positionInserts = template.positions.map((pos) => ({
      tacticId,
      positionCode: pos.positionCode,
      role: pos.role,
      duty: pos.duty
    }));
    await db.insert(positions).values(positionInserts);
    return tacticId;
  }
  async getActiveTactic() {
    const activeTactic = await db.select().from(tactics).where(eq2(tactics.isActive, true)).limit(1);
    if (activeTactic.length === 0) {
      return null;
    }
    const tacticPositions = await db.select().from(positions).where(eq2(positions.tacticId, activeTactic[0].id));
    return {
      ...activeTactic[0],
      positions: tacticPositions
    };
  }
  async getAllTactics() {
    const allTactics = await db.select().from(tactics);
    const tacticsWithPositions = await Promise.all(
      allTactics.map(async (tactic) => {
        const tacticPositions = await db.select().from(positions).where(eq2(positions.tacticId, tactic.id));
        return {
          ...tactic,
          positions: tacticPositions
        };
      })
    );
    return tacticsWithPositions;
  }
  async updatePositionRole(tacticId, positionId, newRole, newDuty) {
    await db.update(positions).set({ role: newRole, duty: newDuty }).where(and2(
      eq2(positions.tacticId, tacticId),
      eq2(positions.id, positionId)
    ));
  }
  async setActiveTactic(tacticId) {
    await db.update(tactics).set({ isActive: false });
    await db.update(tactics).set({ isActive: true }).where(eq2(tactics.id, tacticId));
  }
  async deleteTactic(tacticId) {
    await db.delete(tactics).where(eq2(tactics.id, tacticId));
  }
  getRolesByPosition(positionCode) {
    const roleMap = {
      "GK": [
        { role: "GK", duties: ["defend"] },
        { role: "SK", duties: ["defend", "support", "attack"] }
      ],
      "DL": [
        { role: "FB", duties: ["defend", "support", "attack"] },
        { role: "WB", duties: ["defend", "support", "attack"] },
        { role: "IWB", duties: ["defend", "support"] },
        { role: "CWB", duties: ["support", "attack"] }
      ],
      "DR": [
        { role: "FB", duties: ["defend", "support", "attack"] },
        { role: "WB", duties: ["defend", "support", "attack"] },
        { role: "IWB", duties: ["defend", "support"] },
        { role: "CWB", duties: ["support", "attack"] }
      ],
      "DC": [
        { role: "CD", duties: ["defend"] },
        { role: "BPD", duties: ["defend", "support"] },
        { role: "L", duties: ["defend"] },
        { role: "NCB", duties: ["defend"] }
      ],
      "DM": [
        { role: "DM", duties: ["defend", "support"] },
        { role: "BWM", duties: ["defend", "support"] },
        { role: "A", duties: ["defend", "support"] },
        { role: "HB", duties: ["defend"] },
        { role: "DLP", duties: ["defend", "support"] }
      ],
      "ML": [
        { role: "W", duties: ["support", "attack"] },
        { role: "WM", duties: ["defend", "support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "MR": [
        { role: "W", duties: ["support", "attack"] },
        { role: "WM", duties: ["defend", "support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "MC": [
        { role: "CM", duties: ["defend", "support", "attack"] },
        { role: "BWM", duties: ["defend", "support"] },
        { role: "DLP", duties: ["defend", "support"] },
        { role: "AP", duties: ["support", "attack"] },
        { role: "BBM", duties: ["support"] },
        { role: "CAR", duties: ["support"] }
      ],
      "AML": [
        { role: "W", duties: ["support", "attack"] },
        { role: "IF", duties: ["support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "AMR": [
        { role: "W", duties: ["support", "attack"] },
        { role: "IF", duties: ["support", "attack"] },
        { role: "IW", duties: ["support", "attack"] }
      ],
      "AMC": [
        { role: "AM", duties: ["support", "attack"] },
        { role: "T", duties: ["attack"] },
        { role: "AP", duties: ["support", "attack"] },
        { role: "SS", duties: ["attack"] }
      ],
      "ST": [
        { role: "AF", duties: ["attack"] },
        { role: "DLF", duties: ["support", "attack"] },
        { role: "CF", duties: ["support", "attack"] },
        { role: "TM", duties: ["support", "attack"] },
        { role: "P", duties: ["attack"] },
        { role: "F9", duties: ["support"] },
        { role: "PF", duties: ["defend", "support", "attack"] },
        { role: "T", duties: ["attack"] }
      ]
    };
    return roleMap[positionCode] || [];
  }
};

// server/analysis/position-analyzer.ts
import { readFileSync } from "fs";
import { join as join2, dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var PositionAnalyzer = class {
  positionData = /* @__PURE__ */ new Map();
  constructor() {
    this.loadPositionData();
  }
  loadPositionData() {
    const positionFiles = [
      "gk_position_data_1750867479844.json",
      "st_position_data_1750867479841.json",
      "amc_position_data_1750867479843.json",
      "aml_position_data_1750867479842.json",
      "amr_position_data_1750867479842.json",
      "cd_position_data_1750867479844.json",
      "dl_position_data_1750867479844.json",
      "dm_position_data_1750867479843.json",
      "dr_position_data_1750867479844.json",
      "mc_position_data_1750867479843.json",
      "ml_position_data_1750867479843.json",
      "mr_position_data_1750867479843.json"
    ];
    for (const file of positionFiles) {
      try {
        const filePath = join2(__dirname2, "..", "..", "attached_assets", file);
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        const positionCode = file.split("_")[0].toUpperCase();
        this.positionData.set(positionCode, data);
      } catch (error) {
        console.warn(`Failed to load position data file ${file}:`, error);
      }
    }
  }
  analyzePosition(positionCode, role, duty, players2) {
    const requirements = this.getPositionRequirements(positionCode, role, duty);
    if (!requirements) {
      throw new Error(`No requirements found for ${positionCode} ${role} ${duty}`);
    }
    const playerScores = players2.map(
      (player) => this.calculatePlayerScore(player, requirements)
    ).sort((a, b) => b.score - a.score);
    const averageScore = playerScores.length > 0 ? playerScores.reduce((sum, p) => sum + p.score, 0) / playerScores.length : 0;
    const coverageLevel = this.determineCoverageLevel(playerScores);
    return {
      positionCode,
      role,
      duty,
      playerScores: playerScores.slice(0, 5),
      // Top 5 players
      averageScore,
      coverageLevel
    };
  }
  getPositionRequirements(positionCode, role, duty) {
    const data = this.positionData.get(positionCode);
    if (!data?.positions) return null;
    const position = Object.values(data.positions)[0];
    if (!position?.roles) return null;
    const roleData = position.roles[role];
    if (!roleData?.duties) return null;
    const dutyData = roleData.duties[duty];
    if (!dutyData) return null;
    return {
      key_attributes: dutyData.key_attributes || [],
      preferred_attributes: dutyData.preferred_attributes || []
    };
  }
  calculatePlayerScore(player, requirements) {
    const keyAttrWeight = 2;
    const preferredAttrWeight = 1;
    const minRecommendedValue = 12;
    let keyAttributeScore = 0;
    let keyAttributeMax = 0;
    let preferredAttributeScore = 0;
    let preferredAttributeMax = 0;
    const missingKeyAttributes = [];
    const missingPreferredAttributes = [];
    for (const attr of requirements.key_attributes) {
      const value = player.attributes[attr] || 0;
      keyAttributeScore += value * keyAttrWeight;
      keyAttributeMax += 20 * keyAttrWeight;
      if (value < minRecommendedValue) {
        missingKeyAttributes.push({
          attribute: attr,
          current: value,
          recommended: minRecommendedValue
        });
      }
    }
    for (const attr of requirements.preferred_attributes) {
      const value = player.attributes[attr] || 0;
      preferredAttributeScore += value * preferredAttrWeight;
      preferredAttributeMax += 20 * preferredAttrWeight;
      if (value < minRecommendedValue) {
        missingPreferredAttributes.push({
          attribute: attr,
          current: value,
          recommended: minRecommendedValue
        });
      }
    }
    const totalScore = keyAttributeScore + preferredAttributeScore;
    const totalMax = keyAttributeMax + preferredAttributeMax;
    const score = totalMax > 0 ? Math.round(totalScore / totalMax * 100) : 0;
    return {
      playerId: player.id,
      playerName: player.name,
      score,
      keyAttributeScore: keyAttributeMax > 0 ? Math.round(keyAttributeScore / keyAttributeMax * 100) : 0,
      preferredAttributeScore: preferredAttributeMax > 0 ? Math.round(preferredAttributeScore / preferredAttributeMax * 100) : 0,
      missingKeyAttributes,
      missingPreferredAttributes
    };
  }
  determineCoverageLevel(scores) {
    if (scores.length === 0) return "critical";
    const topScore = scores[0].score;
    const hasBackup = scores.length > 1 && scores[1].score >= 60;
    if (topScore >= 80 && hasBackup) return "excellent";
    if (topScore >= 70 && hasBackup) return "good";
    if (topScore >= 60) return "adequate";
    if (topScore >= 40) return "poor";
    return "critical";
  }
  generateRecruitmentTargets(positionCode, role, duty, currentPlayers) {
    const analysis = this.analyzePosition(positionCode, role, duty, currentPlayers);
    const targets = [];
    if (analysis.coverageLevel === "critical" || analysis.coverageLevel === "poor") {
      const requirements = this.getPositionRequirements(positionCode, role, duty);
      if (requirements) {
        const keyTargets = requirements.key_attributes.slice(0, 3).map((attr) => `${attr} 14+`);
        const preferredTargets = requirements.preferred_attributes.slice(0, 2).map((attr) => `${attr} 12+`);
        targets.push(`Priority: ${keyTargets.join(", ")}`);
        if (preferredTargets.length > 0) {
          targets.push(`Preferred: ${preferredTargets.join(", ")}`);
        }
      }
    }
    return {
      position: `${positionCode} - ${role} (${duty})`,
      targets
    };
  }
};

// server/tactical-routes.ts
var router = express.Router();
var upload = multer({ storage: multer.memoryStorage() });
var playerService = new PlayerService();
var tacticService = new TacticService();
var positionAnalyzer = new PositionAnalyzer();
router.post("/import/html", upload.single("htmlFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const htmlContent = req.file.buffer.toString("utf-8");
    const validation = validateFMHtmlStructure(htmlContent);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid FM HTML file",
        details: validation.errors
      });
    }
    const result = await playerService.importPlayersFromHtml(htmlContent);
    res.json(result);
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ error: "Failed to import HTML file" });
  }
});
router.get("/players", async (req, res) => {
  try {
    const players2 = await playerService.getPlayersWithLatestSnapshot();
    res.json(players2);
  } catch (error) {
    console.error("Get players error:", error);
    res.status(500).json({ error: "Failed to get players" });
  }
});
router.get("/players/:id/history", async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: "Invalid player ID" });
    }
    const history = await playerService.getPlayerProgressHistory(playerId);
    res.json(history);
  } catch (error) {
    console.error("Get player history error:", error);
    res.status(500).json({ error: "Failed to get player history" });
  }
});
router.get("/formations", async (req, res) => {
  try {
    const templates = tacticService.getFormationTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Get formations error:", error);
    res.status(500).json({ error: "Failed to get formations" });
  }
});
router.post("/tactics/create", async (req, res) => {
  try {
    const { templateName, tacticName } = req.body;
    if (!templateName) {
      return res.status(400).json({ error: "Template name is required" });
    }
    const tacticId = await tacticService.createTacticFromTemplate(templateName, tacticName);
    res.json({ tacticId, success: true });
  } catch (error) {
    console.error("Create tactic error:", error);
    res.status(500).json({ error: "Failed to create tactic" });
  }
});
router.get("/tactics/active", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    res.json(activeTactic);
  } catch (error) {
    console.error("Get active tactic error:", error);
    res.status(500).json({ error: "Failed to get active tactic" });
  }
});
router.get("/tactics", async (req, res) => {
  try {
    const tactics2 = await tacticService.getAllTactics();
    res.json(tactics2);
  } catch (error) {
    console.error("Get tactics error:", error);
    res.status(500).json({ error: "Failed to get tactics" });
  }
});
router.put("/tactics/:tacticId/positions/:positionId", async (req, res) => {
  try {
    const tacticId = parseInt(req.params.tacticId);
    const positionId = parseInt(req.params.positionId);
    const { role, duty } = req.body;
    if (isNaN(tacticId) || isNaN(positionId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }
    if (!role || !duty) {
      return res.status(400).json({ error: "Role and duty are required" });
    }
    await tacticService.updatePositionRole(tacticId, positionId, role, duty);
    res.json({ success: true });
  } catch (error) {
    console.error("Update position error:", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});
router.get("/analysis/tactic", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    if (!activeTactic) {
      return res.status(400).json({ error: "No active tactic found" });
    }
    const players2 = await playerService.getPlayersWithLatestSnapshot();
    const analyzePlayers = players2.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      attributes: p.attributes
    }));
    const positionAnalyses = await Promise.all(
      activeTactic.positions.map(async (position) => {
        try {
          return positionAnalyzer.analyzePosition(
            position.positionCode,
            position.role,
            position.duty,
            analyzePlayers
          );
        } catch (error) {
          console.warn(`Failed to analyze position ${position.positionCode}:`, error);
          return {
            positionCode: position.positionCode,
            role: position.role,
            duty: position.duty,
            playerScores: [],
            averageScore: 0,
            coverageLevel: "critical"
          };
        }
      })
    );
    res.json({
      tactic: activeTactic,
      analysis: positionAnalyses
    });
  } catch (error) {
    console.error("Tactic analysis error:", error);
    res.status(500).json({ error: "Failed to analyze tactic" });
  }
});
router.get("/analysis/recruitment", async (req, res) => {
  try {
    const activeTactic = await tacticService.getActiveTactic();
    if (!activeTactic) {
      return res.status(400).json({ error: "No active tactic found" });
    }
    const players2 = await playerService.getPlayersWithLatestSnapshot();
    const analyzePlayers = players2.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      attributes: p.attributes
    }));
    const recruitmentTargets = activeTactic.positions.map((position) => {
      try {
        return positionAnalyzer.generateRecruitmentTargets(
          position.positionCode,
          position.role,
          position.duty,
          analyzePlayers
        );
      } catch (error) {
        console.warn(`Failed to generate targets for position ${position.positionCode}:`, error);
        return {
          position: `${position.positionCode} - ${position.role} (${position.duty})`,
          targets: []
        };
      }
    }).filter((target) => target.targets.length > 0);
    res.json({ recruitmentTargets });
  } catch (error) {
    console.error("Recruitment targets error:", error);
    res.status(500).json({ error: "Failed to generate recruitment targets" });
  }
});
router.get("/positions/:positionCode/roles", async (req, res) => {
  try {
    const { positionCode } = req.params;
    const roles = tacticService.getRolesByPosition(positionCode);
    res.json(roles);
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
});
router.get("/stats", async (req, res) => {
  try {
    const stats = await playerService.getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});
router.delete("/data", async (req, res) => {
  try {
    await playerService.deleteAllData();
    res.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    res.status(500).json({ error: "Failed to clear data" });
  }
});
var tactical_routes_default = router;

// server/tactical-server.ts
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname3(__filename3);
var app = express2();
var PORT = process.env.PORT || 3001;
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
try {
  initializeDatabase();
  console.log("Database initialized successfully");
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exit(1);
}
app.use("/api", tactical_routes_default);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "FM Tactical Squad Analyzer"
  });
});
if (process.env.NODE_ENV === "production") {
  const clientDistPath = join3(__dirname3, "..", "client", "dist");
  if (existsSync2(clientDistPath)) {
    app.use(express2.static(clientDistPath));
    app.get("*", (req, res) => {
      res.sendFile(join3(clientDistPath, "index.html"));
    });
  } else {
    console.warn("Client dist directory not found. Static files will not be served.");
  }
}
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
var server = app.listen(PORT, () => {
  console.log(`\u{1F680} FM Tactical Squad Analyzer server running on http://localhost:${PORT}`);
  console.log(`\u{1F4CA} Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`\u{1F4BE} Database: SQLite (offline-first)`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\u274C Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, () => {
      console.log(`\u{1F680} FM Tactical Squad Analyzer server running on http://localhost:${PORT + 1}`);
      console.log(`\u{1F4CA} Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`\u{1F4BE} Database: SQLite (offline-first)`);
    });
  } else {
    console.error("\u274C Server error:", err);
    process.exit(1);
  }
});
