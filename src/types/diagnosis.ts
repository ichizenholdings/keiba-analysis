/** 診断評価ランク（A~E の5段階） */
export type DiagnosisRank = 'A' | 'B' | 'C' | 'D' | 'E';

/** 個別馬の診断入力 */
export interface HorseDiagnosis {
  horse_number: number;
  horse_name: string;
  rank: DiagnosisRank;
  speed_rating: number | null;      // スピード指数 (0-100)
  stamina_rating: number | null;    // スタミナ指数 (0-100)
  condition_rating: number | null;  // 調子 (0-100)
  jockey_rating: number | null;     // 騎手評価 (0-100)
  comment: string;                  // 診断コメント（自由記述）
  is_honmei: boolean;               // 本命フラグ
  is_taikou: boolean;               // 対抗フラグ
  is_tanana: boolean;               // 単穴フラグ
  is_renka: boolean;                // 連下フラグ
}

/** 全頭診断リクエスト */
export interface DiagnosisRequest {
  race_date: string;                // YYYY-MM-DD
  venue: string;                    // 開催場
  race_number: number;              // 1-12
  race_name: string;                // レース名
  diagnoses: HorseDiagnosis[];      // 全頭分の診断
  overall_comment: string;          // レース全体コメント
}

/** 診断保存レスポンス */
export interface DiagnosisResponse {
  success: boolean;
  diagnosis_id: number;
  horses_count: number;
  message: string;
}

/** 診断一覧アイテム */
export interface DiagnosisListItem {
  diagnosis_id: number;
  race_date: string;
  venue: string;
  race_number: number;
  race_name: string;
  horses_count: number;
  overall_comment: string;
  created_at: string;
  updated_at: string;
}

/** 診断一覧レスポンス */
export interface DiagnosisListResponse {
  diagnoses: DiagnosisListItem[];
  total: number;
}

/** 診断詳細レスポンス（全頭含む） */
export interface DiagnosisDetailResponse {
  diagnosis_id: number;
  race_date: string;
  venue: string;
  race_number: number;
  race_name: string;
  overall_comment: string;
  horses: (HorseDiagnosis & { detail_id: number })[];
  created_at: string;
  updated_at: string;
}
