/** レース基本情報 */
export interface Race {
  id: string;
  race_name: string;
  race_date: string;
  venue: string;
  race_number: number;
  grade: string | null;
  distance: number;
  surface: string;
  weather: string | null;
  track_condition: string | null;
  horse_count: number;
}

/** レース一覧APIレスポンス */
export interface RaceListResponse {
  races: Race[];
  total: number;
  page: number;
  per_page: number;
}

/** 馬情報 */
export interface Horse {
  id: string;
  horse_name: string;
  horse_number: number;
  frame_number: number;
  sex: string | null;
  age: number | null;
  weight: number | null;
  jockey: string | null;
  trainer: string | null;
  father: string | null;
  mother: string | null;
}

/** オッズ情報 */
export interface Odds {
  horse_number: number;
  win: number | null;
  place_min: number | null;
  place_max: number | null;
  popularity: number | null;
}

/** レース結果（着順） */
export interface RaceResult {
  horse_number: number;
  finish_position: number | null;
  finish_time: string | null;
  margin: string | null;
  last_3f: number | null;
  passing_order: string | null;
}

/** レース詳細APIレスポンス */
export interface RaceDetailResponse {
  race: Race;
  horses: Horse[];
  odds: Odds[];
  results: RaceResult[];
}

/** APIエラーレスポンス */
export interface ApiErrorResponse {
  error: string;
  message: string;
}
