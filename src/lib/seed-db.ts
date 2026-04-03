import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.KEIBA_DB_PATH || path.join(process.cwd(), 'data', 'keiba.db');

/**
 * テスト用サンプルデータ投入スクリプト
 * 使い方: npx tsx src/lib/seed-db.ts
 */
function seed(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // テーブル作成（init-dbと同じ）
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
      sex TEXT, age INTEGER, weight REAL,
      jockey TEXT, trainer TEXT, father TEXT, mother TEXT,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );
    CREATE TABLE IF NOT EXISTS odds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id TEXT NOT NULL,
      horse_number INTEGER NOT NULL,
      win REAL, place_min REAL, place_max REAL, popularity INTEGER,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      race_id TEXT NOT NULL,
      horse_number INTEGER NOT NULL,
      finish_position INTEGER, finish_time TEXT, margin TEXT, last_3f REAL, passing_order TEXT,
      FOREIGN KEY (race_id) REFERENCES races(id)
    );
  `);

  const insertRace = db.prepare(`
    INSERT OR REPLACE INTO races (id, race_name, race_date, venue, race_number, grade, distance, surface, weather, track_condition, horse_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHorse = db.prepare(`
    INSERT OR REPLACE INTO horses (id, race_id, horse_name, horse_number, frame_number, sex, age, weight, jockey, trainer, father, mother)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertOdds = db.prepare(`
    INSERT OR REPLACE INTO odds (race_id, horse_number, win, place_min, place_max, popularity)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertResult = db.prepare(`
    INSERT OR REPLACE INTO results (race_id, horse_number, finish_position, finish_time, margin, last_3f, passing_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    // サンプルレース1: 有馬記念
    insertRace.run('202506050811', '有馬記念', '2025-12-28', '中山', 11, 'G1', 2500, 'turf', '晴', '良', 16);

    // サンプル馬データ
    const horses = [
      ['H001', '202506050811', 'イクイノックス', 1, 1, '牡', 5, 488, '武豊', '木村哲也', 'キタサンブラック', 'シャトーブランシュ'],
      ['H002', '202506050811', 'ドウデュース', 2, 1, '牡', 5, 482, '戸崎圭太', '友道康夫', 'ハーツクライ', 'ダストビューティ'],
      ['H003', '202506050811', 'リバティアイランド', 3, 2, '牝', 4, 460, 'ルメール', '中内田充正', 'ドゥラメンテ', 'ヤンキーローズ'],
      ['H004', '202506050811', 'スターズオンアース', 4, 2, '牝', 5, 468, '川田将雅', '高柳瑞樹', 'ドゥラメンテ', 'サザンスターズ'],
    ];
    for (const h of horses) insertHorse.run(...h);

    // サンプルオッズ
    insertOdds.run('202506050811', 1, 2.5, 1.2, 1.5, 1);
    insertOdds.run('202506050811', 2, 4.8, 1.5, 2.0, 2);
    insertOdds.run('202506050811', 3, 6.2, 1.8, 2.5, 3);
    insertOdds.run('202506050811', 4, 12.0, 2.5, 4.0, 4);

    // サンプル結果
    insertResult.run('202506050811', 1, 1, '2:32.5', '', 35.8, '5-5-3-1');
    insertResult.run('202506050811', 3, 2, '2:32.8', 'クビ', 35.5, '3-3-2-2');
    insertResult.run('202506050811', 2, 3, '2:33.0', '1馬身', 36.2, '8-8-6-3');
    insertResult.run('202506050811', 4, 4, '2:33.3', '2馬身', 36.8, '10-10-8-4');

    // サンプルレース2: 日本ダービー
    insertRace.run('202505020811', '東京優駿', '2025-05-25', '東京', 11, 'G1', 2400, 'turf', '曇', '稍重', 18);

    // サンプルレース3: フェブラリーS
    insertRace.run('202501010811', 'フェブラリーステークス', '2025-02-16', '東京', 11, 'G1', 1600, 'dirt', '晴', '良', 16);
  });

  seedAll();
  db.close();
  console.log('Seed data inserted successfully at:', DB_PATH);
}

seed();
