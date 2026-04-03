/** メモ馬タグ定義 */
export const MEMO_TAGS = [
  { id: 'honmei', label: '◎ 本命', color: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'taikou', label: '○ 対抗', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'tanana', label: '▲ 単穴', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'renka', label: '△ 連下', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'osae', label: '★ 押さえ', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'keikai', label: '⚠ 警戒', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'joutai_good', label: '↑ 状態良', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'joutai_bad', label: '↓ 状態悪', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { id: 'pace_nige', label: '逃げ', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { id: 'pace_senkou', label: '先行', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'pace_sashi', label: '差し', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'pace_oikomi', label: '追込', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { id: 'baba_toku', label: '馬場得意', color: 'bg-lime-100 text-lime-800 border-lime-300' },
  { id: 'kyori_toku', label: '距離得意', color: 'bg-teal-100 text-teal-800 border-teal-300' },
] as const;

/** タグIDの型 */
export type MemoTagId = typeof MEMO_TAGS[number]['id'];

/** メモ馬1頭分のデータ */
export interface MemoHorse {
  /** ユニークID (crypto.randomUUID等) */
  id: string;
  /** 馬名 */
  horseName: string;
  /** 選択されたタグIDの配列 */
  tags: MemoTagId[];
  /** フリーテキストメモ */
  memo: string;
  /** 対象レースID (任意) */
  raceId?: string;
  /** 対象レース名 (表示用、任意) */
  raceName?: string;
  /** 作成日時 ISO */
  createdAt: string;
  /** 更新日時 ISO */
  updatedAt: string;
}

/** メモ馬ストレージのレスポンス型 */
export interface MemoHorseListResponse {
  memos: MemoHorse[];
  total: number;
}
