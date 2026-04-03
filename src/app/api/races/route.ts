import { NextRequest, NextResponse } from 'next/server';
import { getDb, tableExists } from '@/lib/db';
import type { Race, RaceListResponse, ApiErrorResponse } from '@/types';

/**
 * GET /api/races - レース一覧取得
 *
 * クエリパラメータ:
 *   page: ページ番号（デフォルト: 1）
 *   per_page: 1ページあたり件数（デフォルト: 20, 最大: 100）
 *   venue: 開催場でフィルタ
 *   date_from: 開始日（YYYY-MM-DD）
 *   date_to: 終了日（YYYY-MM-DD）
 *   surface: 芝/ダート
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<RaceListResponse | ApiErrorResponse>> {
  try {
    if (!tableExists('races')) {
      return NextResponse.json(
        { error: 'not_initialized', message: 'データベースが初期化されていません。init-dbを実行してください。' },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // ページネーション
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10) || 20));
    const offset = (page - 1) * perPage;

    // フィルタ条件の構築
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    const venue = searchParams.get('venue');
    if (venue) {
      conditions.push('venue = ?');
      params.push(venue);
    }

    const dateFrom = searchParams.get('date_from');
    if (dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      conditions.push('race_date >= ?');
      params.push(dateFrom);
    }

    const dateTo = searchParams.get('date_to');
    if (dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      conditions.push('race_date <= ?');
      params.push(dateTo);
    }

    const surface = searchParams.get('surface');
    if (surface) {
      conditions.push('surface = ?');
      params.push(surface);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const db = getDb();

    // 総件数取得
    const countRow = db.prepare(
      `SELECT COUNT(*) as total FROM races ${whereClause}`
    ).get(...params) as { total: number };

    // データ取得
    const races = db.prepare(
      `SELECT id, race_name, race_date, venue, race_number, grade, distance, surface, weather, track_condition, horse_count
       FROM races ${whereClause}
       ORDER BY race_date DESC, venue, race_number
       LIMIT ? OFFSET ?`
    ).all(...params, perPage, offset) as Race[];

    return NextResponse.json({
      races,
      total: countRow.total,
      page,
      per_page: perPage,
    });
  } catch (error) {
    console.error('[GET /api/races] Error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'レース一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
