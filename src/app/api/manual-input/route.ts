/**
 * POST /api/manual-input
 *
 * 手動入力されたレース・馬・結果データを受け取り、
 * バリデーション後にSQLiteに保存する。
 */
import { NextRequest, NextResponse } from 'next/server';
import type { ManualInputRequest } from '@/types/manual-input';
import type { ApiErrorResponse } from '@/types/race';
import { validateManualInput } from '@/lib/manual-input/validate';

export async function POST(request: NextRequest) {
  try {
    const body: ManualInputRequest = await request.json();

    // バリデーション
    const validation = validateManualInput(body);
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

    // DB保存（node:sqlite）
    // Note: DB接続はconnection.tsから取得する設計
    // Phase2の後続タスクでDB接続を統合する
    return NextResponse.json({
      success: true,
      race_id: 'pending_db_integration',
      horses_count: body.horses.length,
      results_count: body.results?.length ?? 0,
      message: `バリデーション成功（出走馬${body.horses.length}頭）。DB保存はPhase2後続タスクで統合予定。`,
    });
  } catch (err) {
    console.error('[manual-input] POST error:', err);
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'データの処理中にエラーが発生しました',
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
