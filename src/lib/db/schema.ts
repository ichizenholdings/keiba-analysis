/**
 * SQLite スキーマ定義
 *
 * node:sqlite (Node.js 組み込み) を使用。
 * JRDB データの5種別に対応するテーブルを定義する。
 */

export const SCHEMA_SQL = `
-- レース情報 (BAC: 番組データ)
CREATE TABLE IF NOT EXISTS races (
  race_id       TEXT PRIMARY KEY,
  race_date     TEXT NOT NULL,
  venue_code    TEXT NOT NULL,
  venue_name    TEXT,
  kaiji_code    TEXT,
  nichiji       TEXT,
  race_number   INTEGER NOT NULL,
  race_name     TEXT,
  distance      INTEGER NOT NULL,
  surface       TEXT NOT NULL,
  track_direction TEXT,
  track_condition TEXT,
  grade         TEXT,
  head_count    INTEGER,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- 馬マスター (UMA: 馬基本データ)
CREATE TABLE IF NOT EXISTS horses (
  horse_id      TEXT PRIMARY KEY,
  horse_name    TEXT NOT NULL,
  sex           TEXT,
  birth_year    INTEGER,
  coat_color    TEXT,
  trainer_name  TEXT,
  owner_name    TEXT,
  breeder_name  TEXT,
  sire_name     TEXT,
  dam_name      TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- 出走馬情報 (KYI: 競走馬データ)
CREATE TABLE IF NOT EXISTS entries (
  entry_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id         TEXT NOT NULL,
  horse_id        TEXT NOT NULL,
  horse_number    INTEGER NOT NULL,
  gate_number     INTEGER,
  jockey_name     TEXT,
  weight_carried  REAL,
  horse_weight    INTEGER,
  horse_weight_diff INTEGER,
  odds            REAL,
  popularity      INTEGER,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (race_id) REFERENCES races(race_id),
  FOREIGN KEY (horse_id) REFERENCES horses(horse_id),
  UNIQUE(race_id, horse_id)
);

-- 成績データ (SED: 成績データ)
CREATE TABLE IF NOT EXISTS results (
  result_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id           TEXT NOT NULL,
  horse_id          TEXT NOT NULL,
  finish_position   INTEGER,
  finish_time       TEXT,
  finish_time_value REAL,
  margin            TEXT,
  last_3f           REAL,
  corner_positions  TEXT,
  jockey_name       TEXT,
  weight_carried    REAL,
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (race_id) REFERENCES races(race_id),
  FOREIGN KEY (horse_id) REFERENCES horses(horse_id),
  UNIQUE(race_id, horse_id)
);

-- 払戻データ (SRB: 速報データ)
CREATE TABLE IF NOT EXISTS payouts (
  payout_id             INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id               TEXT NOT NULL UNIQUE,
  win_horse_number      INTEGER,
  win_payout            INTEGER,
  place_horse_numbers   TEXT,
  place_payouts         TEXT,
  quinella_horse_numbers TEXT,
  quinella_payout       INTEGER,
  exacta_horse_numbers  TEXT,
  exacta_payout         INTEGER,
  created_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (race_id) REFERENCES races(race_id)
);

-- 馬場バイアス情報
CREATE TABLE IF NOT EXISTS track_biases (
  bias_id               INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id               TEXT,
  race_date             TEXT NOT NULL,
  venue                 TEXT NOT NULL,
  race_number           INTEGER,
  surface               TEXT NOT NULL,
  track_condition       TEXT NOT NULL,
  moisture_level        INTEGER,
  inner_outer           TEXT NOT NULL DEFAULT 'フラット',
  pace_bias             TEXT NOT NULL DEFAULT 'フラット',
  rail_position         INTEGER,
  course_condition_detail TEXT,
  winning_positions     TEXT,
  notes                 TEXT,
  created_at            TEXT DEFAULT (datetime('now')),
  updated_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (race_id) REFERENCES races(race_id)
);

-- 全頭診断ヘッダー
CREATE TABLE IF NOT EXISTS diagnoses (
  diagnosis_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  race_date         TEXT NOT NULL,
  venue             TEXT NOT NULL,
  race_number       INTEGER NOT NULL,
  race_name         TEXT NOT NULL DEFAULT '',
  overall_comment   TEXT NOT NULL DEFAULT '',
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);

-- 全頭診断明細（馬ごと）
CREATE TABLE IF NOT EXISTS diagnosis_details (
  detail_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  diagnosis_id      INTEGER NOT NULL,
  horse_number      INTEGER NOT NULL,
  horse_name        TEXT NOT NULL,
  rank              TEXT NOT NULL DEFAULT 'C',
  speed_rating      INTEGER,
  stamina_rating    INTEGER,
  condition_rating  INTEGER,
  jockey_rating     INTEGER,
  comment           TEXT NOT NULL DEFAULT '',
  is_honmei         INTEGER NOT NULL DEFAULT 0,
  is_taikou         INTEGER NOT NULL DEFAULT 0,
  is_tanana         INTEGER NOT NULL DEFAULT 0,
  is_renka          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(diagnosis_id) ON DELETE CASCADE,
  UNIQUE(diagnosis_id, horse_number)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_races_date ON races(race_date);
CREATE INDEX IF NOT EXISTS idx_races_venue ON races(venue_code);
CREATE INDEX IF NOT EXISTS idx_entries_race ON entries(race_id);
CREATE INDEX IF NOT EXISTS idx_entries_horse ON entries(horse_id);
CREATE INDEX IF NOT EXISTS idx_results_race ON results(race_id);
CREATE INDEX IF NOT EXISTS idx_results_horse ON results(horse_id);
CREATE INDEX IF NOT EXISTS idx_results_position ON results(finish_position);
CREATE INDEX IF NOT EXISTS idx_track_biases_date ON track_biases(race_date);
CREATE INDEX IF NOT EXISTS idx_track_biases_venue ON track_biases(venue);
CREATE INDEX IF NOT EXISTS idx_track_biases_race ON track_biases(race_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_date ON diagnoses(race_date);
CREATE INDEX IF NOT EXISTS idx_diagnoses_venue ON diagnoses(venue);
CREATE INDEX IF NOT EXISTS idx_diagnosis_details_diag ON diagnosis_details(diagnosis_id);
`;

/** サンプルデータ投入SQL */
export const SEED_SQL = `
-- サンプルレースデータ（2024年有馬記念）
INSERT OR IGNORE INTO races VALUES (
  '09012412', '20241222', '06', '中山', '05', '08', 11, '有馬記念', 2500, '芝', '右', '良', 'G1', 16, datetime('now')
);

-- サンプルレースデータ（2024年日本ダービー）
INSERT OR IGNORE INTO races VALUES (
  '05010612', '20240526', '05', '東京', '02', '12', 11, '東京優駿（日本ダービー）', 2400, '芝', '左', '良', 'G1', 18, datetime('now')
);

-- サンプル馬データ
INSERT OR IGNORE INTO horses VALUES ('2019104567', 'ドウデュース', '牡', 2019, '鹿毛', '友道康夫', 'キーファーズ', 'ノーザンファーム', 'ハーツクライ', 'ダストビューティー', datetime('now'));
INSERT OR IGNORE INTO horses VALUES ('2020103456', 'レガレイラ', '牝', 2020, '鹿毛', '木村哲也', 'サンデーレーシング', '社台ファーム', 'スワーヴリチャード', 'ロカ', datetime('now'));
INSERT OR IGNORE INTO horses VALUES ('2019105678', 'スターズオンアース', '牝', 2019, '鹿毛', '高柳瑞樹', 'サンデーレーシング', '社台ファーム', 'ドゥラメンテ', 'サザンスターズ', datetime('now'));
INSERT OR IGNORE INTO horses VALUES ('2020101234', 'ジャスティンミラノ', '牡', 2020, '黒鹿毛', '友道康夫', 'サンデーレーシング', '社台ファーム', 'キズナ', 'マーティンボロ', datetime('now'));

-- サンプル出走馬データ（有馬記念）
INSERT OR IGNORE INTO entries (race_id, horse_id, horse_number, gate_number, jockey_name, weight_carried, horse_weight, horse_weight_diff, odds, popularity)
VALUES ('09012412', '2019104567', 6, 6, '武豊', 57.0, 498, 2, 3.5, 1);
INSERT OR IGNORE INTO entries (race_id, horse_id, horse_number, gate_number, jockey_name, weight_carried, horse_weight, horse_weight_diff, odds, popularity)
VALUES ('09012412', '2020103456', 3, 2, 'ルメール', 55.0, 472, -4, 5.2, 2);
INSERT OR IGNORE INTO entries (race_id, horse_id, horse_number, gate_number, jockey_name, weight_carried, horse_weight, horse_weight_diff, odds, popularity)
VALUES ('09012412', '2019105678', 10, 7, '川田将雅', 55.0, 480, 0, 8.1, 3);

-- サンプル成績データ
INSERT OR IGNORE INTO results (race_id, horse_id, finish_position, finish_time, finish_time_value, margin, last_3f, corner_positions, jockey_name, weight_carried)
VALUES ('09012412', '2020103456', 1, '2:32.4', 152.4, '', 35.8, '05-05-04-02', 'ルメール', 55.0);
INSERT OR IGNORE INTO results (race_id, horse_id, finish_position, finish_time, finish_time_value, margin, last_3f, corner_positions, jockey_name, weight_carried)
VALUES ('09012412', '2019104567', 2, '2:32.6', 152.6, 'クビ', 35.5, '10-10-08-05', '武豊', 57.0);
INSERT OR IGNORE INTO results (race_id, horse_id, finish_position, finish_time, finish_time_value, margin, last_3f, corner_positions, jockey_name, weight_carried)
VALUES ('09012412', '2019105678', 3, '2:32.8', 152.8, '1', 36.0, '03-03-03-03', '川田将雅', 55.0);

-- サンプル払戻データ
INSERT OR IGNORE INTO payouts (race_id, win_horse_number, win_payout, place_horse_numbers, place_payouts, quinella_horse_numbers, quinella_payout, exacta_horse_numbers, exacta_payout)
VALUES ('09012412', 3, 520, '3,6,10', '180,210,350', '3,6', 1240, '3,6', 2580);
`;
