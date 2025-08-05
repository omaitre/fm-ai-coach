import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core player data
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Player snapshots (attribute data at specific points in time)
export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  currentAbility: integer("current_ability"),
  potentialAbility: integer("potential_ability"),
  importDate: integer("import_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Individual attributes for each snapshot
export const attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: integer("value").notNull(),
});

// Tactical formations
export const tactics = sqliteTable("tactics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  formation: text("formation").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Positions within tactics
export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tacticId: integer("tactic_id").notNull().references(() => tactics.id, { onDelete: "cascade" }),
  positionCode: text("position_code").notNull(), // "GK", "DL", "DR", "DC", "DM", "ML", "MR", "MC", "AML", "AMR", "AMC", "ST"
  role: text("role").notNull(), // "GK", "FB", "CB", "WB", "DM", "CM", "W", "AM", "ST", etc.
  duty: text("duty").notNull(), // "defend", "support", "attack"
});

// Cached position suitability scores
export const positionScores = sqliteTable("position_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  score: real("score").notNull(), // 0-100 suitability score
  calculatedAt: integer("calculated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Define relations
export const playersRelations = relations(players, ({ many }) => ({
  snapshots: many(snapshots),
  positionScores: many(positionScores),
}));

export const snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  player: one(players, {
    fields: [snapshots.playerId],
    references: [players.id],
  }),
  attributes: many(attributes),
  positionScores: many(positionScores),
}));

export const attributesRelations = relations(attributes, ({ one }) => ({
  snapshot: one(snapshots, {
    fields: [attributes.snapshotId],
    references: [snapshots.id],
  }),
}));

export const tacticsRelations = relations(tactics, ({ many }) => ({
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  tactic: one(tactics, {
    fields: [positions.tacticId],
    references: [tactics.id],
  }),
  positionScores: many(positionScores),
}));

export const positionScoresRelations = relations(positionScores, ({ one }) => ({
  player: one(players, {
    fields: [positionScores.playerId],
    references: [players.id],
  }),
  position: one(positions, {
    fields: [positionScores.positionId],
    references: [positions.id],
  }),
  snapshot: one(snapshots, {
    fields: [positionScores.snapshotId],
    references: [snapshots.id],
  }),
}));

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertSnapshotSchema = createInsertSchema(snapshots).omit({
  id: true,
  importDate: true,
});

export const insertAttributeSchema = createInsertSchema(attributes).omit({
  id: true,
});

export const insertTacticSchema = createInsertSchema(tactics).omit({
  id: true,
  createdAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
});

export const insertPositionScoreSchema = createInsertSchema(positionScores).omit({
  id: true,
  calculatedAt: true,
});

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = z.infer<typeof insertSnapshotSchema>;
export type Attribute = typeof attributes.$inferSelect;
export type InsertAttribute = z.infer<typeof insertAttributeSchema>;
export type Tactic = typeof tactics.$inferSelect;
export type InsertTactic = z.infer<typeof insertTacticSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type PositionScore = typeof positionScores.$inferSelect;
export type InsertPositionScore = z.infer<typeof insertPositionScoreSchema>;