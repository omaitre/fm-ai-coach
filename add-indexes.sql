  -- Performance indexes for FM Player Tracker
  CREATE INDEX IF NOT EXISTS idx_snapshots_player_date ON snapshots(player_id, snapshot_date DESC);
  CREATE INDEX IF NOT EXISTS idx_attributes_snapshot ON attributes(snapshot_id);
  CREATE INDEX IF NOT EXISTS idx_position_scores_ranking ON player_position_scores(position_id, fitness_percentage DESC);
  CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);