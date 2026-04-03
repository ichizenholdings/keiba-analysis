/**
 * GET    /api/diagnoses/[id]  — 診断詳細取得
 * PUT    /api/diagnoses/[id]  — 診断更新
 * DELETE /api/diagnoses/[id]  — 診断削除
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/connection';
import type { DiagnosisRequest } from '@/types/diagnosis';

const VALID_RANKS = ['A', 'B', 'C', 'D', 'E'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const diag = db.prepare(
      'SELECT * FROM diagnoses WHERE diagnosis_id = ?'
    ).get(Number(id)) as Record<string, unknown> | undefined;

    if (!diag) {
      return NextResponse.json(
        { error: 'not_found', message: '指定された診断が見つかりません' },
        { status: 404 }
      );
    }

    const details = db.prepare(
      'SELECT * FROM diagnosis_details WHERE diagnosis_id = ? ORDER BY horse_number ASC'
    ).all(Number(id)) as Record<string, unknown>[];

    const horses = details.map((d) => ({
      detail_id: d.detail_id,
      horse_number: d.horse_number,
      horse_name: d.horse_name,
      rank: d.rank,
      speed_rating: d.speed_rating,
      stamina_rating: d.stamina_rating,
      condition_rating: d.condition_rating,
      jockey_rating: d.jockey_rating,
      comment: d.comment,
      is_honmei: d.is_honmei === 1,
      is_taikou: d.is_taikou === 1,
      is_tanana: d.is_tanana === 1,
      is_renka: d.is_renka === 1,
    }));

    return NextResponse.json({
      diagnosis_id: diag.diagnosis_id,
      race_date: diag.race_date,
      venue: diag.venue,
      race_number: diag.race_number,
      race_name: diag.race_name,
      overall_comment: diag.overall_comment,
      horses,
      created_at: diag.created_at,
      updated_at: diag.updated_at,
    });
  } catch (err) {
    console.error('[diagnoses/id] GET error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: '診断の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const diagId = Number(id);

    const existing = db.prepare(
      'SELECT diagnosis_id FROM diagnoses WHERE diagnosis_id = ?'
    ).get(diagId);

    if (!existing) {
      return NextResponse.json(
        { error: 'not_found', message: '指定された診断が見つかりません' },
        { status: 404 }
      );
    }

    const body: DiagnosisRequest = await request.json();

    // バリデーション
    const errors: { field: string; message: string }[] = [];
    if (!body.diagnoses || body.diagnoses.length === 0) {
      errors.push({ field: 'diagnoses', message: '少なくとも1頭の診断が必要です' });
    }
    if (body.diagnoses) {
      for (let i = 0; i < body.diagnoses.length; i++) {
        const d = body.diagnoses[i];
        if (!d.horse_name || d.horse_name.trim() === '') {
          errors.push({ field: `diagnoses[${i}].horse_name`, message: `${i + 1}番目の馬名が未入力です` });
        }
        if (!VALID_RANKS.includes(d.rank)) {
          errors.push({ field: `diagnoses[${i}].rank`, message: `${i + 1}番目の評価ランクが不正です` });
        }
      }
    }
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'バリデーションエラーがあります', details: errors },
        { status: 400 }
      );
    }

    // ヘッダー更新
    db.prepare(`
      UPDATE diagnoses
      SET race_date = ?, venue = ?, race_number = ?, race_name = ?,
          overall_comment = ?, updated_at = datetime('now')
      WHERE diagnosis_id = ?
    `).run(body.race_date, body.venue, body.race_number, body.race_name || '', body.overall_comment || '', diagId);

    // 明細は全削除 → 再挿入
    db.prepare('DELETE FROM diagnosis_details WHERE diagnosis_id = ?').run(diagId);

    const insertDetail = db.prepare(`
      INSERT INTO diagnosis_details
        (diagnosis_id, horse_number, horse_name, rank, speed_rating, stamina_rating,
         condition_rating, jockey_rating, comment, is_honmei, is_taikou, is_tanana, is_renka)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const d of body.diagnoses) {
      insertDetail.run(
        diagId, d.horse_number, d.horse_name, d.rank,
        d.speed_rating, d.stamina_rating, d.condition_rating, d.jockey_rating,
        d.comment || '',
        d.is_honmei ? 1 : 0, d.is_taikou ? 1 : 0, d.is_tanana ? 1 : 0, d.is_renka ? 1 : 0
      );
    }

    return NextResponse.json({
      success: true,
      diagnosis_id: diagId,
      horses_count: body.diagnoses.length,
      message: `診断データを更新しました（${body.diagnoses.length}頭）`,
    });
  } catch (err) {
    console.error('[diagnoses/id] PUT error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: '診断の更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const diagId = Number(id);

    const existing = db.prepare(
      'SELECT diagnosis_id FROM diagnoses WHERE diagnosis_id = ?'
    ).get(diagId);

    if (!existing) {
      return NextResponse.json(
        { error: 'not_found', message: '指定された診断が見つかりません' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM diagnosis_details WHERE diagnosis_id = ?').run(diagId);
    db.prepare('DELETE FROM diagnoses WHERE diagnosis_id = ?').run(diagId);

    return NextResponse.json({
      success: true,
      message: '診断データを削除しました',
    });
  } catch (err) {
    console.error('[diagnoses/id] DELETE error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: '診断の削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
