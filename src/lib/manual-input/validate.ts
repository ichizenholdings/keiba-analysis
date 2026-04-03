/**
 * 手動入力データのバリデーション
 */
import type {
  ManualInputRequest,
  ManualRaceInput,
  ManualHorseInput,
  ManualResultInput,
  ValidationResult,
  ValidationError,
} from '@/types/manual-input';

const VENUES = [
  '札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉',
] as const;

const SURFACES = ['芝', 'ダート', '障害'] as const;
const TRACK_CONDITIONS = ['良', '稍重', '重', '不良'] as const;

/** レース情報のバリデーション */
export function validateRace(race: ManualRaceInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!race.race_date || !/^\d{4}-\d{2}-\d{2}$/.test(race.race_date)) {
    errors.push({ field: 'race.race_date', message: '日付はYYYY-MM-DD形式で入力してください' });
  }

  if (!race.venue || !VENUES.includes(race.venue as typeof VENUES[number])) {
    errors.push({ field: 'race.venue', message: `開催場は${VENUES.join('/')}のいずれかを選択してください` });
  }

  if (!race.race_number || race.race_number < 1 || race.race_number > 12) {
    errors.push({ field: 'race.race_number', message: 'レース番号は1〜12の範囲で入力してください' });
  }

  if (!race.distance || race.distance < 800 || race.distance > 4000) {
    errors.push({ field: 'race.distance', message: '距離は800〜4000mの範囲で入力してください' });
  }

  if (!race.surface || !SURFACES.includes(race.surface)) {
    errors.push({ field: 'race.surface', message: `馬場は${SURFACES.join('/')}のいずれかを選択してください` });
  }

  if (race.track_condition && !TRACK_CONDITIONS.includes(race.track_condition)) {
    errors.push({ field: 'race.track_condition', message: `馬場状態は${TRACK_CONDITIONS.join('/')}のいずれかを選択してください` });
  }

  return errors;
}

/** 出走馬情報のバリデーション */
export function validateHorses(horses: ManualHorseInput[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!horses || horses.length === 0) {
    errors.push({ field: 'horses', message: '出走馬を1頭以上入力してください' });
    return errors;
  }

  if (horses.length > 18) {
    errors.push({ field: 'horses', message: '出走馬は18頭以下にしてください' });
  }

  const horseNumbers = new Set<number>();
  horses.forEach((horse, i) => {
    const prefix = `horses[${i}]`;

    if (!horse.horse_number || horse.horse_number < 1 || horse.horse_number > 18) {
      errors.push({ field: `${prefix}.horse_number`, message: `馬番は1〜18の範囲で入力してください` });
    }

    if (horseNumbers.has(horse.horse_number)) {
      errors.push({ field: `${prefix}.horse_number`, message: `馬番${horse.horse_number}が重複しています` });
    }
    horseNumbers.add(horse.horse_number);

    if (!horse.frame_number || horse.frame_number < 1 || horse.frame_number > 8) {
      errors.push({ field: `${prefix}.frame_number`, message: `枠番は1〜8の範囲で入力してください` });
    }

    if (!horse.horse_name || horse.horse_name.trim().length === 0) {
      errors.push({ field: `${prefix}.horse_name`, message: '馬名を入力してください' });
    }

    if (!horse.jockey || horse.jockey.trim().length === 0) {
      errors.push({ field: `${prefix}.jockey`, message: '騎手名を入力してください' });
    }

    if (horse.age !== null && horse.age !== undefined && (horse.age < 2 || horse.age > 12)) {
      errors.push({ field: `${prefix}.age`, message: '馬齢は2〜12の範囲で入力してください' });
    }

    if (horse.weight !== null && horse.weight !== undefined && (horse.weight < 300 || horse.weight > 600)) {
      errors.push({ field: `${prefix}.weight`, message: '馬体重は300〜600kgの範囲で入力してください' });
    }

    if (horse.odds !== null && horse.odds !== undefined && horse.odds <= 0) {
      errors.push({ field: `${prefix}.odds`, message: 'オッズは正の数で入力してください' });
    }
  });

  return errors;
}

/** レース結果のバリデーション */
export function validateResults(
  results: ManualResultInput[],
  horseNumbers: number[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!results || results.length === 0) {
    return errors; // 結果は任意
  }

  const positions = new Set<number>();
  results.forEach((result, i) => {
    const prefix = `results[${i}]`;

    if (!horseNumbers.includes(result.horse_number)) {
      errors.push({
        field: `${prefix}.horse_number`,
        message: `馬番${result.horse_number}は出走馬に存在しません`,
      });
    }

    if (!result.finish_position || result.finish_position < 1) {
      errors.push({ field: `${prefix}.finish_position`, message: '着順は1以上で入力してください' });
    }

    if (positions.has(result.finish_position)) {
      errors.push({ field: `${prefix}.finish_position`, message: `着順${result.finish_position}が重複しています` });
    }
    positions.add(result.finish_position);

    if (result.finish_time && !/^\d{1}:\d{2}\.\d{1}$/.test(result.finish_time)) {
      errors.push({ field: `${prefix}.finish_time`, message: 'タイムはM:SS.S形式で入力してください（例: 1:35.2）' });
    }

    if (result.last_3f !== null && result.last_3f !== undefined && (result.last_3f < 30 || result.last_3f > 45)) {
      errors.push({ field: `${prefix}.last_3f`, message: '上り3Fは30.0〜45.0秒の範囲で入力してください' });
    }
  });

  return errors;
}

/** 入力全体のバリデーション */
export function validateManualInput(input: ManualInputRequest): ValidationResult {
  const errors: ValidationError[] = [
    ...validateRace(input.race),
    ...validateHorses(input.horses),
  ];

  if (input.results && input.results.length > 0) {
    const horseNumbers = input.horses.map((h) => h.horse_number);
    errors.push(...validateResults(input.results, horseNumbers));
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
