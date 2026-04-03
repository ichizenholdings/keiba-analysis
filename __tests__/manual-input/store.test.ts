import { generateRaceId, generateHorseId, VENUE_CODE_MAP } from '@/lib/manual-input/store';

describe('generateRaceId', () => {
  it('中山 2024-12-22 11R → 0620241222 11', () => {
    const id = generateRaceId('中山', '2024-12-22', 11);
    expect(id).toBe('062024122211');
  });

  it('東京 2024-05-26 11R → 052024052611', () => {
    const id = generateRaceId('東京', '2024-05-26', 11);
    expect(id).toBe('052024052611');
  });

  it('1Rは01にゼロパディング', () => {
    const id = generateRaceId('阪神', '2024-01-01', 1);
    expect(id).toBe('092024010101');
  });

  it('不明な開催場は99', () => {
    const id = generateRaceId('名古屋', '2024-01-01', 1);
    expect(id).toBe('992024010101');
  });
});

describe('generateHorseId', () => {
  it('同じ馬名で同じIDを返す', () => {
    const id1 = generateHorseId('ドウデュース');
    const id2 = generateHorseId('ドウデュース');
    expect(id1).toBe(id2);
  });

  it('異なる馬名で異なるIDを返す', () => {
    const id1 = generateHorseId('ドウデュース');
    const id2 = generateHorseId('レガレイラ');
    expect(id1).not.toBe(id2);
  });

  it('Mで始まる10桁文字列', () => {
    const id = generateHorseId('テスト馬');
    expect(id).toMatch(/^M\d{10}$/);
  });
});

describe('VENUE_CODE_MAP', () => {
  it('全10場が定義されている', () => {
    expect(Object.keys(VENUE_CODE_MAP)).toHaveLength(10);
  });

  it('中山は06', () => {
    expect(VENUE_CODE_MAP['中山']).toBe('06');
  });
});
