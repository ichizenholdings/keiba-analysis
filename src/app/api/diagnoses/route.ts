/**
 * GET  /api/diagnoses        — 診断一覧取得
 * POST /api/diagnoses        — 新規診断保存
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/connection';
import type { DiagnosisRequest, DiagnosisListItem } from '@/types/diagnosis';

const VALID_RANKS = ['A', 'B', 'C', 'D', 'E'];
const VALID_VENUES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'];

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const date = searchParams.get('date');
    const venue = searchParams.get('venue');

    let sql = `
      SELECT d.diagnosis_id, d.race_date, d.venue, d.race_number, d.race_name,
             d.overall_comment, d.created_at, d.updated_at,
             COUNT(dd.detail_id) as horses_count
      FROM diagnoses d
      LEFT JOIN diagnosis_details dd ON d.diagnosis_id = dd.diagnosis_id
      WHERE 1=1
    `;
    const values: unknown[] = [];

    if (date) {
      sql += ' AND d.race_date = ?';
      values.push(date);
    }
    if (venue) {
      sql += ' AND d.venue = ?';
      values.push(venue);
    }

    sql += ' GROUP BY d.diagnosis_id ORDER BY d.race_date DESC, d.race_number ASC';
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const items = db.prepare(sql).all(...values) as DiagnosisListItem[];

    const totalRow = db.prepare(
      'SELECT COUNT(*) as c FROM diagnoses' +
        (date ? ' WHERE race_date = ?' : '') +
        (venue ? (date ? ' AND' : ' WHERE') + ' venue = ?' : '')
    ).get(...(date && venue ? [date, venue] : date ? [date] : venue ? [venue] : [])) as { c: number };

    return NextResponse.json({ diagnoses: items, total: totalRow.c });
  } catch (err) {
    console.error('[diagnoses] GET error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: '診断一覧の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: DiagnosisRequest = await request.json();

    // バリデーション
    const errors: { field: string; message: string }[] = [];

    if (!body.race_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.race_date)) {
      errors.push({ field: 'race_date', message: '日付はYYYY-MM-DD形式で入力してください' });
    }
    if (!body.venue || !VALID_VENUES.includes(body.venue)) {
      errors.push({ field: 'venue', message: '有効な開催場を選択してください' });
    }
    if (!body.race_number || body.race_number < 1 || body.race_number > 12) {
      errors.push({ field: 'race_number', message: 'レース番号は1〜12で入力してください' });
    }
    if (!body.diagnoses || body.diagnoses.length === 0) {
      errors.push({ field: 'diagnoses', message: '少なくとも1頭の診断が必要です' });
    }

    // 各馬のバリデーション
    if (body.diagnoses) {
      const horseNumbers = new Set<number>();
      for (let i = 0; i < body.diagnoses.length; i++) {
        const d = body.diagnoses[i];
        if (!d.horse_name || d.horse_name.trim() === '') {
          errors.push({ field: `diagnoses[${i}].horse_name`, message: `${i + 1}番目の馬名が未入力です` });
        }
        if (!VALID_RANKS.includes(d.rank)) {
          errors.push({ field: `diagnoses[${i}].rank`, message: `${i + 1}番目の評価ランクが不正です` });
        }
        if (d.horse_number < 1 || d.horse_number > 18) {
          errors.push({ field: `diagnoses[${i}].horse_number`, message: `馬番は1〜18で入力してください` });
        }
        if (horseNumbers.has(d.horse_number)) {
          errors.push({ field: `diagnoses[${i}].horse_number`, message: `馬番${d.horse_number}が重複しています` });
        }
        horseNumbers.add(d.horse_number);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'validation_error', message: 'バリデーションエラーがあります', details: errors },
        { status: 400 }
      );
    }

    // DB保存
    const db = getDb();

    const insertDiag = db.prepare(`
      INSERT INTO diagnoses (race_date, venue, race_number, race_name, overall_comment)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertDiag.run(
      body.race_date,
      body.venue,
      body.race_number,
      body.race_name || '',
      body.overall_comment || ''
    );
    const diagnosisId = Number(result.lastInsertRowid);

    const insertDetail = db.prepare(`
      INSERT INTO diagnosis_details
        (diagnosis_id, horse_number, horse_name, rank, speed_rating, stamina_rating,
         condition_rating, jockey_rating, comment, is_honmei, is_taikou, is_tanana, is_renka)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const d of body.diagnoses) {
      insertDetail.run(
        diagnosisId,
        d.horse_number,
        d.horse_name,
        d.rank,
        d.speed_rating,
        d.stamina_rating,
        d.condition_rating,
        d.jockey_rating,
        d.comment || '',
        d.is_honmei ? 1 : 0,
        d.is_taikou ? 1 : 0,
        d.is_tanana ? 1 : 0,
        d.is_renka ? 1 : 0
      );
    }

    return NextResponse.json({
      success: true,
      diagnosis_id: diagnosisId,
      horses_count: body.diagnoses.length,
      message: `診断データを保存しました（${body.diagnoses.length}頭）`,
    });
  } catch (err) {
    console.error('[diagnoses] POST error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: '診断の保存中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
