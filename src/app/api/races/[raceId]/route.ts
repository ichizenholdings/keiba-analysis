import { NextRequest, NextResponse } from 'next/server';
import { getDb, tableExists } from '@/lib/db';
import type { Race, Horse, Odds, RaceResult, RaceDetailResponse, ApiErrorResponse } from '@/types';

/**
 * GET /api/races/[raceId] - レース詳細取得（馬情報・オッズ・結果含む）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { raceId: string } }
): Promise<NextResponse<RaceDetailResponse | ApiErrorResponse>> {
  try {
    if (!tableExists('races')) {
      return NextResponse.json(
        { error: 'not_initialized', message: 'データベースが初期化されていません。init-dbを実行してください。' },
        { status: 503 }
      );
    }

    const { raceId } = params;

    // raceId バリデーション（英数字とハイフンのみ許可）
    if (!raceId || !/^[\w-]+$/.test(raceId)) {
      return NextResponse.json(
        { error: 'invalid_parameter', message: 'raceIdが不正です' },
        { status: 400 }
      );
    }

    const db = getDb();

    // レース情報取得
    const race = db.prepare(
      `SELECT id, race_name, race_date, venue, race_number, grade, distance, surface, weather, track_condition, horse_count
       FROM races WHERE id = ?`
    ).get(raceId) as Race | undefined;

    if (!race) {
      return NextResponse.json(
        { error: 'not_found', message: `レースが見つかりません: ${raceId}` },
        { status: 404 }
      );
    }

    // 馬情報取得
    const horses = db.prepare(
      `SELECT id, horse_name, horse_number, frame_number, sex, age, weight, jockey, trainer, father, mother
       FROM horses WHERE race_id = ? ORDER BY horse_number`
    ).all(raceId) as Horse[];

    // オッズ情報取得
    const odds = tableExists('odds')
      ? (db.prepare(
          `SELECT horse_number, win, place_min, place_max, popularity
           FROM odds WHERE race_id = ? ORDER BY horse_number`
        ).all(raceId) as Odds[])
      : [];

    // レース結果取得
    const results = tableExists('results')
      ? (db.prepare(
          `SELECT horse_number, finish_position, finish_time, margin, last_3f, passing_order
           FROM results WHERE race_id = ? ORDER BY finish_position`
        ).all(raceId) as RaceResult[])
      : [];

    return NextResponse.json({
      race,
      horses,
      odds,
      results,
    });
  } catch (error) {
    console.error(`[GET /api/races/${params?.raceId}] Error:`, error);
    return NextResponse.json(
      { error: 'internal_error', message: 'レース詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}
