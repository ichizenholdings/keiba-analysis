import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.KEIBA_DB_PATH || path.join(process.cwd(), 'data', 'keiba.db');

/**
 * データベース初期化スクリプト
 * テーブルが存在しない場合に作成する
 */
export function initializeDatabase(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS races (
      id TEXT PRIMARY KEY,
      race_name TEXT NOT NULL,
      race_date TEXT NOT NULL,
      venue TEXT NOT NULL,
      race_number INTEGER NOT NULL,
      grade TEXT,
      distance INTEGER NOT NULL,
      surface TEXT NOT NULL DEFAULT 'turf',
      weather TEXT,
      track_condition TEXT,
      horse_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS horses (
      id TEXT PRIMARY KEY,
      race_id TEXT NOT NULL,
      horse_name TEXT NOT NULL,
      horse_number INTEGER NOT NULL,
      frame_number INTEGER NOT NULL DEFAULT 0,
      sex TEXT,
      age INTEGER,
      weight REAL,
      jockey TEXT,
      trainer TEXT,
      father TEXT,
      mother TEXT,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );

    CREATE TABLE IF NOT EXISTS odds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id TEXT NOT NULL,
      horse_number INTEGER NOT NULL,
      win REAL,
      place_min REAL,
      place_max REAL,
      popularity INTEGER,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id TEXT NOT NULL,
      horse_number INTEGER NOT NULL,
      finish_position INTEGER,
      finish_time TEXT,
      margin TEXT,
      last_3f REAL,
      passing_order TEXT,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );

    CREATE INDEX IF NOT EXISTS idx_horses_race_id ON horses(race_id);
    CREATE INDEX IF NOT EXISTS idx_odds_race_id ON odds(race_id);
    CREATE INDEX IF NOT EXISTS idx_results_race_id ON results(race_id);
    CREATE INDEX IF NOT EXISTS idx_races_date ON races(race_date);
    CREATE INDEX IF NOT EXISTS idx_races_venue ON races(venue);
  `);

  db.close();
}

if (require.main === module) {
  initializeDatabase();
  console.log('Database initialized at:', DB_PATH);
}
