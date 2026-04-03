/**
 * /api/track-bias
 *
 * 馬場バイアス情報のCRUDエンドポイント
 * POST: 新規登録
 * GET: 一覧取得（date, venue でフィルタ可能）
 */
import { NextRequest, NextResponse } from 'next/server';
import type { TrackBiasInput } from '@/types/manual-input';
import type { ApiErrorResponse } from '@/types/race';
import { validateTrackBias } from '@/lib/track-bias/validate';
import { getDb } from '@/lib/db/connection';

export async function POST(request: NextRequest) {
  try {
    const body: TrackBiasInput = await request.json();

    // バリデーション
    const validation = validateTrackBias(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'バリデーションエラーがあります',
          details: validation.errors,
        } satisfies ApiErrorResponse & { details: unknown },
        { status: 400 }
      );
    }

    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO track_biases (
        race_id, race_date, venue, race_number, surface,
        track_condition, moisture_level, inner_outer, pace_bias,
        rail_position, course_condition_detail, winning_positions, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      body.race_id || null,
      body.race_date.replace(/-/g, ''),
      body.venue,
      body.race_number,
      body.surface,
      body.track_condition,
      body.moisture_level,
      body.inner_outer,
      body.pace_bias,
      body.rail_position,
      body.course_condition_detail,
      body.winning_positions,
      body.notes
    );

    // 最後に挿入されたIDを取得
    const lastRow = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number } | undefined;
    const biasId = lastRow?.id ?? 0;

    return NextResponse.json({
      success: true,
      bias_id: biasId,
      message: `馬場バイアス情報を登録しました（ID: ${biasId}）`,
    });
  } catch (err) {
    console.error('[track-bias] POST error:', err);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: '馬場バイアスの登録中にエラーが発生しました',
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const venue = searchParams.get('venue');
    const raceId = searchParams.get('race_id');

    const db = getDb();

    let sql = 'SELECT * FROM track_biases WHERE 1=1';
    const params: unknown[] = [];

    if (date) {
      sql += ' AND race_date = ?';
      params.push(date.replace(/-/g, ''));
    }

    if (venue) {
      sql += ' AND venue = ?';
      params.push(venue);
    }

    if (raceId) {
      sql += ' AND race_id = ?';
      params.push(raceId);
    }

    sql += ' ORDER BY race_date DESC, race_number ASC';

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return NextResponse.json({
      biases: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error('[track-bias] GET error:', err);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: '馬場バイアスの取得中にエラーが発生しました',
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
