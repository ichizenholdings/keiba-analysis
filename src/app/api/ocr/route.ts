/**
 * POST /api/ocr
 *
 * 画像ファイルをアップロードしてOCRを実行し、
 * レースデータとして解析した結果を返す。
 *
 * ⚠️ tesseract.js / sharp が未インストールの場合は503を返す。
 */
import { NextRequest, NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/types/race';
import { processOcrImage } from '@/lib/manual-input/ocr';

/** アップロード画像の最大サイズ (10MB) */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/** 許可するMIMEタイプ */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'bad_request', message: '画像ファイルが必要です' } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'bad_request',
          message: `対応画像形式: ${ALLOWED_TYPES.join(', ')}`,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: 'bad_request', message: '画像サイズは10MB以下にしてください' } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const ocrType = (type === 'result' || type === 'odds') ? type : 'race_card';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processOcrImage(buffer, ocrType);

    if (result.status === 'failed') {
      return NextResponse.json(
        {
          error: 'ocr_failed',
          message: result.error || 'OCR処理に失敗しました。tesseract.jsがインストールされているか確認してください。',
        } satisfies ApiErrorResponse,
        { status: 503 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[ocr] POST error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'OCR処理中にエラーが発生しました' } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
