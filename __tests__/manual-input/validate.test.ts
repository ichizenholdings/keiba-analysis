import {
  validateRace,
  validateHorses,
  validateResults,
  validateManualInput,
} from '@/lib/manual-input/validate';
import type {
  ManualRaceInput,
  ManualHorseInput,
  ManualResultInput,
  ManualInputRequest,
} from '@/types/manual-input';

const validRace: ManualRaceInput = {
  race_date: '2024-12-22',
  venue: '中山',
  race_number: 11,
  race_name: '有馬記念',
  distance: 2500,
  surface: '芝',
  track_condition: '良',
  grade: 'G1',
  weather: '晴',
};

const validHorse: ManualHorseInput = {
  horse_number: 1,
  frame_number: 1,
  horse_name: 'テスト馬',
  sex: '牡',
  age: 4,
  weight: 480,
  weight_diff: 2,
  jockey: 'テスト騎手',
  trainer: 'テスト調教師',
  odds: 3.5,
  popularity: 1,
};

describe('validateRace', () => {
  it('正常なレース情報はエラーなし', () => {
    expect(validateRace(validRace)).toHaveLength(0);
  });

  it('不正な日付形式はエラー', () => {
    const errors = validateRace({ ...validRace, race_date: '20241222' });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('race.race_date');
  });

  it('不正な開催場はエラー', () => {
    const errors = validateRace({ ...validRace, venue: '名古屋' });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('race.venue');
  });

  it('レース番号0はエラー', () => {
    const errors = validateRace({ ...validRace, race_number: 0 });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('race.race_number');
  });

  it('レース番号13はエラー', () => {
    const errors = validateRace({ ...validRace, race_number: 13 });
    expect(errors).toHaveLength(1);
  });

  it('距離700mはエラー', () => {
    const errors = validateRace({ ...validRace, distance: 700 });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('race.distance');
  });
});

describe('validateHorses', () => {
  it('正常な馬情報はエラーなし', () => {
    expect(validateHorses([validHorse])).toHaveLength(0);
  });

  it('空配列はエラー', () => {
    const errors = validateHorses([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('horses');
  });

  it('馬番重複はエラー', () => {
    const errors = validateHorses([validHorse, { ...validHorse }]);
    expect(errors.some((e) => e.message.includes('重複'))).toBe(true);
  });

  it('馬名空はエラー', () => {
    const errors = validateHorses([{ ...validHorse, horse_name: '' }]);
    expect(errors.some((e) => e.field.includes('horse_name'))).toBe(true);
  });

  it('騎手名空はエラー', () => {
    const errors = validateHorses([{ ...validHorse, jockey: '' }]);
    expect(errors.some((e) => e.field.includes('jockey'))).toBe(true);
  });

  it('馬体重範囲外はエラー', () => {
    const errors = validateHorses([{ ...validHorse, horse_number: 1, weight: 200 }]);
    expect(errors.some((e) => e.field.includes('weight'))).toBe(true);
  });
});

describe('validateResults', () => {
  const validResult: ManualResultInput = {
    horse_number: 1,
    finish_position: 1,
    finish_time: '2:32.4',
    margin: null,
    last_3f: 35.8,
    passing_order: '05-05-04-02',
  };

  it('正常な結果はエラーなし', () => {
    expect(validateResults([validResult], [1])).toHaveLength(0);
  });

  it('空配列はエラーなし（結果は任意）', () => {
    expect(validateResults([], [1])).toHaveLength(0);
  });

  it('存在しない馬番はエラー', () => {
    const errors = validateResults([validResult], [2, 3]);
    expect(errors.some((e) => e.message.includes('存在しません'))).toBe(true);
  });

  it('着順重複はエラー', () => {
    const r2 = { ...validResult, horse_number: 2 };
    const errors = validateResults([validResult, r2], [1, 2]);
    expect(errors.some((e) => e.message.includes('重複'))).toBe(true);
  });

  it('不正なタイム形式はエラー', () => {
    const errors = validateResults(
      [{ ...validResult, finish_time: '152.4' }],
      [1]
    );
    expect(errors.some((e) => e.field.includes('finish_time'))).toBe(true);
  });
});

describe('validateManualInput', () => {
  it('正常な入力全体はvalid', () => {
    const input: ManualInputRequest = {
      source: 'manual',
      race: validRace,
      horses: [validHorse],
    };
    const result = validateManualInput(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('複数エラーをまとめて返す', () => {
    const input: ManualInputRequest = {
      source: 'manual',
      race: { ...validRace, race_date: 'invalid', distance: 0 },
      horses: [],
    };
    const result = validateManualInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
