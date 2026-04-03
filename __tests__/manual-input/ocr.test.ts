import { parseRaceCardText, parseResultText } from '@/lib/manual-input/ocr';

describe('parseRaceCardText', () => {
  it('距離・馬場を抽出する', () => {
    const text = '中山11R 有馬記念 芝2500m 良';
    const result = parseRaceCardText(text);
    expect(result.race?.surface).toBe('芝');
    expect(result.race?.distance).toBe(2500);
    expect(result.race?.venue).toBe('中山');
    expect(result.race?.race_number).toBe(11);
    expect(result.race?.track_condition).toBe('良');
  });

  it('ダートも正しく抽出', () => {
    const text = '東京 ダート1600m';
    const result = parseRaceCardText(text);
    expect(result.race?.surface).toBe('ダート');
    expect(result.race?.distance).toBe(1600);
  });

  it('出走馬行をパースする', () => {
    const text = `中山11R 芝2500m
1  1 ドウデュース 牡5 57.0 武豊
2  3 レガレイラ   牝4 55.0 ルメール`;
    const result = parseRaceCardText(text);
    expect(result.horses).toHaveLength(2);
    expect(result.horses?.[0].horse_name).toBe('ドウデュース');
    expect(result.horses?.[0].frame_number).toBe(1);
    expect(result.horses?.[0].horse_number).toBe(1);
    expect(result.horses?.[0].sex).toBe('牡');
    expect(result.horses?.[0].age).toBe(5);
  });

  it('sourceがocrであること', () => {
    const result = parseRaceCardText('テスト');
    expect(result.source).toBe('ocr');
  });
});

describe('parseResultText', () => {
  it('結果行をパースする', () => {
    const text = `着 馬番 タイム
 1  3 2:32.4
 2  6 2:32.6
 3 10 2:32.8`;
    const results = parseResultText(text);
    expect(results).toHaveLength(3);
    expect(results[0].finish_position).toBe(1);
    expect(results[0].horse_number).toBe(3);
    expect(results[0].finish_time).toBe('2:32.4');
    expect(results[2].finish_position).toBe(3);
  });

  it('空テキストは空配列', () => {
    expect(parseResultText('')).toHaveLength(0);
  });
});
