-- Using TEXT for odaUserId to support both Telegram (numeric) and LINE (string) IDs
-- Each user has one entry per cellCount (difficulty level)
CREATE TABLE IF NOT EXISTS scores (
  odaUserId TEXT NOT NULL,
  odaName TEXT NOT NULL,
  time REAL NOT NULL,
  streak INTEGER DEFAULT 0,
  streakTime REAL DEFAULT 0,
  streakId TEXT DEFAULT NULL,
  cellCount INTEGER DEFAULT 1,
  platform TEXT DEFAULT 'telegram',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  PRIMARY KEY (odaUserId, cellCount)
);

CREATE INDEX IF NOT EXISTS idx_scores_time ON scores(time ASC);
CREATE INDEX IF NOT EXISTS idx_scores_platform ON scores(platform);
CREATE INDEX IF NOT EXISTS idx_scores_cellcount ON scores(cellCount);
CREATE INDEX IF NOT EXISTS idx_scores_streak ON scores(streak DESC);
CREATE INDEX IF NOT EXISTS idx_scores_streakid ON scores(streakId);
