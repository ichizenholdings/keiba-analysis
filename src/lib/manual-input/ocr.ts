/**
 * OCR処理モジュール
 *
 * 出馬表・レース結果の画像からテキストを抽出し、
 * 構造化データにパースする。
 *
 * ⚠️ 依存パッケージ未インストール:
 *   - tesseract.js: ブラウザ/Node.js用OCRエンジン
 *   - sharp: 画像前処理（リサイズ・グレースケール変換等）
 *
 * インストールコマンド（実行が承認された後）:
 *   npm install tesseract.js sharp
 *   npm install -D @types/sharp
 */
import type {
  OcrResult,
  ManualRaceInput,
  ManualHorseInput,
  ManualResultInput,
  ManualInputRequest,
} from '@/types/manual-input';

/** OCR処理のオプション */
interface OcrOptions {
  language?: 'jpn' | 'eng' | 'jpn+eng';
  preprocess?: boolean;
}

/**
 * 画像バッファからOCRテキストを抽出する
 *
 * tesseract.js がインストールされていない場合はエラーを返す。
 * sharp がインストールされている場合は画像前処理を行う。
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  options: OcrOptions = {}
): Promise<{ text: string; confidence: number }> {
  const { language = 'jpn+eng', preprocess = true } = options;

  let processedBuffer = imageBuffer;

  // sharp による前処理（インストール済みの場合）
  if (preprocess) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require('sharp');
      processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .resize({ width: 2000, withoutEnlargement: true })
        .toBuffer();
    } catch {
      // sharp未インストール → 前処理スキップ
      console.warn('[OCR] sharp未インストール: 画像前処理をスキップします');
    }
  }

  // tesseract.js によるOCR実行
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tesseract = require('tesseract.js');
    const result = await Tesseract.recognize(processedBuffer, language, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] 進捗: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  } catch (err) {
    throw new Error(
      `OCR処理に失敗しました。tesseract.jsがインストールされているか確認してください: ${err}`
    );
  }
}

/** OCRテキストから出馬表データをパースする */
export function parseRaceCardText(text: string): Partial<ManualInputRequest> {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const horses: ManualHorseInput[] = [];

  // ヘッダー行からレース情報を抽出
  const race: Partial<ManualRaceInput> = {};

  // 距離パターン: "芝1600m" or "ダート1200m"
  const distanceMatch = text.match(/(芝|ダート|障害)\s*(\d{3,4})\s*m/);
  if (distanceMatch) {
    race.surface = distanceMatch[1] as ManualRaceInput['surface'];
    race.distance = parseInt(distanceMatch[2], 10);
  }

  // 開催場パターン
  const venueMatch = text.match(/(札幌|函館|福島|新潟|東京|中山|中京|京都|阪神|小倉)/);
  if (venueMatch) {
    race.venue = venueMatch[1];
  }

  // レース番号パターン: "11R" or "第11レース"
  const raceNumMatch = text.match(/(\d{1,2})\s*R|第\s*(\d{1,2})\s*レース/);
  if (raceNumMatch) {
    race.race_number = parseInt(raceNumMatch[1] || raceNumMatch[2], 10);
  }

  // 馬場状態パターン
  const conditionMatch = text.match(/(良|稍重|重|不良)/);
  if (conditionMatch) {
    race.track_condition = conditionMatch[1] as ManualRaceInput['track_condition'];
  }

  // 出走馬行のパース: "枠 馬番 馬名 性齢 斤量 騎手"
  // 数字で始まる行を出走馬行として処理
  const horseLinePattern = /^\s*(\d)\s+(\d{1,2})\s+(.+?)\s+(牡|牝|セ)(\d)\s/;
  for (const line of lines) {
    const match = line.match(horseLinePattern);
    if (match) {
      horses.push({
        frame_number: parseInt(match[1], 10),
        horse_number: parseInt(match[2], 10),
        horse_name: match[3].trim(),
        sex: match[4],
        age: parseInt(match[5], 10),
        weight: null,
        weight_diff: null,
        jockey: '', // 後続のパースで補完
        trainer: null,
        odds: null,
        popularity: null,
      });
    }
  }

  return {
    source: 'ocr',
    race: race as ManualRaceInput,
    horses,
  };
}

/** OCRテキストからレース結果データをパースする */
export function parseResultText(text: string): ManualResultInput[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const results: ManualResultInput[] = [];

  // 結果行パターン: "着順 馬番 タイム 着差 上3F 通過順"
  const resultLinePattern = /^\s*(\d{1,2})\s+(\d{1,2})\s+(\d:\d{2}\.\d)/;
  for (const line of lines) {
    const match = line.match(resultLinePattern);
    if (match) {
      results.push({
        finish_position: parseInt(match[1], 10),
        horse_number: parseInt(match[2], 10),
        finish_time: match[3],
        margin: null,
        last_3f: null,
        passing_order: null,
      });
    }
  }

  return results;
}

/** OCR処理の全体フロー */
export async function processOcrImage(
  imageBuffer: Buffer,
  type: 'race_card' | 'result' | 'odds'
): Promise<OcrResult> {
  const id = `ocr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { text, confidence } = await extractTextFromImage(imageBuffer);

    let parsedData: Partial<ManualInputRequest> | null = null;
    if (type === 'race_card') {
      parsedData = parseRaceCardText(text);
    } else if (type === 'result') {
      const results = parseResultText(text);
      parsedData = { results };
    }
    // odds は今後実装

    return {
      id,
      status: 'completed',
      raw_text: text,
      parsed_data: parsedData,
      confidence,
      error: null,
      created_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      id,
      status: 'failed',
      raw_text: null,
      parsed_data: null,
      confidence: 0,
      error: err instanceof Error ? err.message : String(err),
      created_at: new Date().toISOString(),
    };
  }
}
