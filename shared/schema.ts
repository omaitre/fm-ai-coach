import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Players table
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age"),
  positions: text("positions"), // SQLite stores as JSON text string
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Player snapshots (attribute data at specific points in time)
export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  currentAbility: integer("current_ability"),
  potentialAbility: integer("potential_ability"),
  snapshotDate: text("snapshot_date").default(sql`(datetime('now'))`),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Individual attributes for each snapshot
export const attributes = sqliteTable("attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  attributeName: text("attribute_name").notNull(),
  attributeValue: integer("attribute_value").notNull(),
  attributeCategory: text("attribute_category").notNull(), // "technical", "mental", "physical"
});

// Tactical formations
export const tactics = sqliteTable("tactics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  formation: text("formation"),
  isActive: integer("is_active").default(0), // SQLite uses 0/1 for boolean
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Positions within tactics
export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tacticId: integer("tactic_id").notNull().references(() => tactics.id, { onDelete: "cascade" }),
  positionName: text("position_name").notNull(),
  positionCode: text("position_code").notNull(),
  positionSide: text("position_side"), // "left", "center", "right"
  roleName: text("role_name"), // "Full Back", "Wing Back", etc.
  duty: text("duty"), // "Defend", "Support", "Attack"
  playerId: integer("player_id").references(() => players.id),
});

// Key attributes for each position
export const positionAttributes = sqliteTable("position_attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  attributeName: text("attribute_name").notNull(),
  weight: real("weight").default(1.0),
});

// Global storage of attribute definitions for Position+Role+Duty combinations
export const positionRoleDutyAttributes = sqliteTable("position_role_duty_attributes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  positionCode: text("position_code").notNull(),
  roleName: text("role_name").notNull(),
  duty: text("duty").notNull(),
  keyAttributes: text("key_attributes").notNull(), // JSON array of attribute names
  preferableAttributes: text("preferable_attributes").notNull(), // JSON array of attribute names
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Cached position suitability scores
export const playerPositionScores = sqliteTable("player_position_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  positionId: integer("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  snapshotId: integer("snapshot_id").notNull().references(() => snapshots.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  maxPossibleScore: integer("max_possible_score").notNull(),
  keyAttributeScore: integer("key_attribute_score").notNull(),
  preferredAttributeScore: integer("preferred_attribute_score").notNull(),
  otherAttributeScore: integer("other_attribute_score").notNull(),
  fitnessPercentage: text("fitness_percentage").notNull(),
  calculatedAt: text("calculated_at").default(sql`(datetime('now'))`),
});

// Define relations
export const playersRelations = relations(players, ({ many }) => ({
  snapshots: many(snapshots),
  positionScores: many(playerPositionScores),
}));

export const snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  player: one(players, {
    fields: [snapshots.playerId],
    references: [players.id],
  }),
  attributes: many(attributes),
  positionScores: many(playerPositionScores),
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
  player: one(players, {
    fields: [positions.playerId],
    references: [players.id],
  }),
  attributes: many(positionAttributes),
  playerScores: many(playerPositionScores),
}));

export const positionAttributesRelations = relations(positionAttributes, ({ one }) => ({
  position: one(positions, {
    fields: [positionAttributes.positionId],
    references: [positions.id],
  }),
}));

export const playerPositionScoresRelations = relations(playerPositionScores, ({ one }) => ({
  player: one(players, {
    fields: [playerPositionScores.playerId],
    references: [players.id],
  }),
  position: one(positions, {
    fields: [playerPositionScores.positionId],
    references: [positions.id],
  }),
  snapshot: one(snapshots, {
    fields: [playerPositionScores.snapshotId],
    references: [snapshots.id],
  }),
}));

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSnapshotSchema = createInsertSchema(snapshots).omit({
  id: true,
  createdAt: true,
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

export const insertPositionAttributeSchema = createInsertSchema(positionAttributes).omit({
  id: true,
});

export const insertPositionRoleDutyAttributeSchema = createInsertSchema(positionRoleDutyAttributes).omit({
  id: true,
  createdAt: true,
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
export type PositionAttribute = typeof positionAttributes.$inferSelect;
export type InsertPositionAttribute = z.infer<typeof insertPositionAttributeSchema>;
export type PositionRoleDutyAttribute = typeof positionRoleDutyAttributes.$inferSelect;
export type InsertPositionRoleDutyAttribute = z.infer<typeof insertPositionRoleDutyAttributeSchema>;
export type PlayerPositionScore = typeof playerPositionScores.$inferSelect;