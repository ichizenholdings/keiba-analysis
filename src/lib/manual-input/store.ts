/**
 * 手動入力データのDB保存処理
 *
 * SQLite (node:sqlite) にレース・馬・結果データを保存する。
 * race_idは `{venue_code}{race_date_short}{race_number}` 形式で自動生成する。
 */
import type {
  ManualInputRequest,
  ManualInputResponse,
} from '@/types/manual-input';

/** 開催場 → コード変換マップ */
const VENUE_CODE_MAP: Record<string, string> = {
  '札幌': '01',
  '函館': '02',
  '福島': '03',
  '新潟': '04',
  '東京': '05',
  '中山': '06',
  '中京': '07',
  '京都': '08',
  '阪神': '09',
  '小倉': '10',
};

/** race_idの生成: 開催場コード + 日付(YYYYMMDD) + レース番号(2桁) */
function generateRaceId(venue: string, raceDate: string, raceNumber: number): string {
  const venueCode = VENUE_CODE_MAP[venue] || '99';
  const dateStr = raceDate.replace(/-/g, '');
  const raceNum = String(raceNumber).padStart(2, '0');
  return `${venueCode}${dateStr}${raceNum}`;
}

/** horse_idの生成: 馬名からハッシュ風のIDを生成 */
function generateHorseId(horseName: string): string {
  let hash = 0;
  for (let i = 0; i < horseName.length; i++) {
    const char = horseName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `M${Math.abs(hash).toString().padStart(10, '0').slice(0, 10)}`;
}

/**
 * 手動入力データをSQLiteに保存する
 *
 * Note: node:sqlite を使用。Database import は呼び出し元で DI する設計。
 * パッケージ追加不要 (Node.js 22+ built-in)。
 */
export async function storeManualInput(
  input: ManualInputRequest,
  db: {
    exec: (sql: string) => void;
    prepare: (sql: string) => { run: (...args: unknown[]) => void };
  }
): Promise<ManualInputResponse> {
  const raceId = generateRaceId(input.race.venue, input.race.race_date, input.race.race_number);

  // レース情報を保存
  const insertRace = db.prepare(`
    INSERT OR REPLACE INTO races (
      race_id, race_date, venue_code, venue_name, race_number,
      race_name, distance, surface, track_condition, grade, head_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const venueCode = VENUE_CODE_MAP[input.race.venue] || '99';
  insertRace.run(
    raceId,
    input.race.race_date.replace(/-/g, ''),
    venueCode,
    input.race.venue,
    input.race.race_number,
    input.race.race_name,
    input.race.distance,
    input.race.surface,
    input.race.track_condition,
    input.race.grade,
    input.horses.length
  );

  // 馬情報を保存
  const insertHorse = db.prepare(`
    INSERT OR IGNORE INTO horses (horse_id, horse_name, sex)
    VALUES (?, ?, ?)
  `);
  const insertEntry = db.prepare(`
    INSERT OR REPLACE INTO entries (
      race_id, horse_id, horse_number, gate_number,
      jockey_name, horse_weight, horse_weight_diff, odds, popularity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const horse of input.horses) {
    const horseId = generateHorseId(horse.horse_name);
    insertHorse.run(horseId, horse.horse_name, horse.sex);
    insertEntry.run(
      raceId,
      horseId,
      horse.horse_number,
      horse.frame_number,
      horse.jockey,
      horse.weight,
      horse.weight_diff,
      horse.odds,
      horse.popularity
    );
  }

  // 結果情報を保存（あれば）
  let resultsCount = 0;
  if (input.results && input.results.length > 0) {
    const insertResult = db.prepare(`
      INSERT OR REPLACE INTO results (
        race_id, horse_id, finish_position, finish_time,
        margin, last_3f, corner_positions, jockey_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const result of input.results) {
      const horse = input.horses.find((h) => h.horse_number === result.horse_number);
      if (!horse) continue;
      const horseId = generateHorseId(horse.horse_name);
      insertResult.run(
        raceId,
        horseId,
        result.finish_position,
        result.finish_time,
        result.margin,
        result.last_3f,
        result.passing_order,
        horse.jockey
      );
      resultsCount++;
    }
  }

  return {
    success: true,
    race_id: raceId,
    horses_count: input.horses.length,
    results_count: resultsCount,
    message: `レース ${raceId} を保存しました（出走馬${input.horses.length}頭、結果${resultsCount}件）`,
  };
}

export { generateRaceId, generateHorseId, VENUE_CODE_MAP };
