/**
 * 馬場バイアス入力のバリデーション
 */
import type {
  TrackBiasInput,
  ValidationResult,
  ValidationError,
} from '@/types/manual-input';

const VENUES = [
  '札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉',
] as const;

const SURFACES = ['芝', 'ダート', '障害'] as const;
const TRACK_CONDITIONS = ['良', '稍重', '重', '不良'] as const;
const INNER_OUTER_OPTIONS = ['内有利', 'やや内有利', 'フラット', 'やや外有利', '外有利'] as const;
const PACE_OPTIONS = ['前有利', 'やや前有利', 'フラット', 'やや差し有利', '差し有利', '追込有利'] as const;

/** 馬場バイアス入力のバリデーション */
export function validateTrackBias(input: TrackBiasInput): ValidationResult {
  const errors: ValidationError[] = [];

  // 日付
  if (!input.race_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.race_date)) {
    errors.push({ field: 'race_date', message: '日付はYYYY-MM-DD形式で入力してください' });
  }

  // 開催場
  if (!input.venue || !VENUES.includes(input.venue as typeof VENUES[number])) {
    errors.push({ field: 'venue', message: `開催場は${VENUES.join('/')}のいずれかを選択してください` });
  }

  // レース番号（任意だが指定時は1-12）
  if (input.race_number !== null && input.race_number !== undefined) {
    if (input.race_number < 1 || input.race_number > 12) {
      errors.push({ field: 'race_number', message: 'レース番号は1〜12の範囲で入力してください' });
    }
  }

  // 馬場
  if (!input.surface || !SURFACES.includes(input.surface as typeof SURFACES[number])) {
    errors.push({ field: 'surface', message: `馬場は${SURFACES.join('/')}のいずれかを選択してください` });
  }

  // 馬場状態
  if (!input.track_condition || !TRACK_CONDITIONS.includes(input.track_condition as typeof TRACK_CONDITIONS[number])) {
    errors.push({ field: 'track_condition', message: `馬場状態は${TRACK_CONDITIONS.join('/')}のいずれかを選択してください` });
  }

  // 含水率（任意だが指定時は0-100）
  if (input.moisture_level !== null && input.moisture_level !== undefined) {
    if (input.moisture_level < 0 || input.moisture_level > 100) {
      errors.push({ field: 'moisture_level', message: '含水率は0〜100%の範囲で入力してください' });
    }
  }

  // 内外バイアス
  if (!input.inner_outer || !INNER_OUTER_OPTIONS.includes(input.inner_outer as typeof INNER_OUTER_OPTIONS[number])) {
    errors.push({ field: 'inner_outer', message: `内外バイアスは${INNER_OUTER_OPTIONS.join('/')}のいずれかを選択してください` });
  }

  // 前後バイアス
  if (!input.pace_bias || !PACE_OPTIONS.includes(input.pace_bias as typeof PACE_OPTIONS[number])) {
    errors.push({ field: 'pace_bias', message: `前後バイアスは${PACE_OPTIONS.join('/')}のいずれかを選択してください` });
  }

  // 仮柵位置（任意だが指定時は0-10）
  if (input.rail_position !== null && input.rail_position !== undefined) {
    if (input.rail_position < 0 || input.rail_position > 10) {
      errors.push({ field: 'rail_position', message: '仮柵位置は0〜10mの範囲で入力してください' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
