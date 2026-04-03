/** 手動入力ソースの種別 */
export type InputSource = 'manual' | 'ocr' | 'csv';

/** OCR処理ステータス */
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** 手動入力フォームのフィールド定義 */
export interface ManualRaceInput {
  race_date: string;
  venue: string;
  race_number: number;
  race_name: string;
  distance: number;
  surface: '芝' | 'ダート' | '障害';
  track_condition: '良' | '稍重' | '重' | '不良' | null;
  grade: string | null;
  weather: string | null;
}

/** 手動入力: 出走馬情報 */
export interface ManualHorseInput {
  horse_number: number;
  frame_number: number;
  horse_name: string;
  sex: string | null;
  age: number | null;
  weight: number | null;
  weight_diff: number | null;
  jockey: string;
  trainer: string | null;
  odds: number | null;
  popularity: number | null;
}

/** 手動入力: レース結果 */
export interface ManualResultInput {
  horse_number: number;
  finish_position: number;
  finish_time: string | null;
  margin: string | null;
  last_3f: number | null;
  passing_order: string | null;
}

/** 手動入力リクエスト全体 */
export interface ManualInputRequest {
  source: InputSource;
  race: ManualRaceInput;
  horses: ManualHorseInput[];
  results?: ManualResultInput[];
}

/** 手動入力レスポンス */
export interface ManualInputResponse {
  success: boolean;
  race_id: string;
  horses_count: number;
  results_count: number;
  message: string;
}

/** OCRアップロードリクエスト */
export interface OcrUploadRequest {
  image: File;
  type: 'race_card' | 'result' | 'odds';
}

/** OCR解析結果 */
export interface OcrResult {
  id: string;
  status: OcrStatus;
  raw_text: string | null;
  parsed_data: Partial<ManualInputRequest> | null;
  confidence: number;
  error: string | null;
  created_at: string;
}

/** 馬場バイアス: 内外傾向 */
export type BiasInnerOuter = '内有利' | 'やや内有利' | 'フラット' | 'やや外有利' | '外有利';

/** 馬場バイアス: 前後傾向 */
export type BiasPace = '前有利' | 'やや前有利' | 'フラット' | 'やや差し有利' | '差し有利' | '追込有利';

/** 馬場バイアス入力 */
export interface TrackBiasInput {
  race_id: string | null;
  race_date: string;
  venue: string;
  race_number: number | null;
  surface: '芝' | 'ダート' | '障害';
  track_condition: '良' | '稍重' | '重' | '不良';
  moisture_level: number | null;
  inner_outer: BiasInnerOuter;
  pace_bias: BiasPace;
  rail_position: number | null;
  course_condition_detail: string | null;
  winning_positions: string | null;
  notes: string | null;
}

/** 馬場バイアス保存レスポンス */
export interface TrackBiasResponse {
  success: boolean;
  bias_id: number;
  message: string;
}

/** 馬場バイアス一覧レスポンス */
export interface TrackBiasListResponse {
  biases: (TrackBiasInput & { bias_id: number; created_at: string })[];
  total: number;
}

/** バリデーションエラー */
export interface ValidationError {
  field: string;
  message: string;
}

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
