'use client';

import { useState } from 'react';
import type {
  ManualRaceInput,
  ManualHorseInput,
  ManualInputRequest,
  ValidationError,
} from '@/types/manual-input';

const VENUES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'] as const;
const SURFACES = ['芝', 'ダート', '障害'] as const;
const CONDITIONS = ['良', '稍重', '重', '不良'] as const;

function emptyHorse(num: number): ManualHorseInput {
  return {
    horse_number: num,
    frame_number: Math.ceil(num / 2.25),
    horse_name: '',
    sex: null,
    age: null,
    weight: null,
    weight_diff: null,
    jockey: '',
    trainer: null,
    odds: null,
    popularity: null,
  };
}

export default function ManualInputPage() {
  const [race, setRace] = useState<ManualRaceInput>({
    race_date: new Date().toISOString().split('T')[0],
    venue: '東京',
    race_number: 1,
    race_name: '',
    distance: 1600,
    surface: '芝',
    track_condition: '良',
    grade: null,
    weather: null,
  });

  const [horses, setHorses] = useState<ManualHorseInput[]>([
    emptyHorse(1),
    emptyHorse(2),
    emptyHorse(3),
  ]);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // OCR状態
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const addHorse = () => {
    setHorses((prev) => [...prev, emptyHorse(prev.length + 1)]);
  };

  const removeHorse = (index: number) => {
    setHorses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateHorse = (index: number, field: keyof ManualHorseInput, value: string | number | null) => {
    setHorses((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    setResult(null);

    const payload: ManualInputRequest = {
      source: 'manual',
      race,
      horses,
    };

    try {
      const res = await fetch('/api/manual-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setErrors([{ field: 'general', message: data.message }]);
        }
      } else {
        setResult(data.message);
      }
    } catch (err) {
      setErrors([{ field: 'general', message: '送信中にエラーが発生しました' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOcr = async () => {
    if (!ocrFile) return;
    setOcrProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', ocrFile);
      formData.append('type', 'race_card');

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.parsed_data) {
        // OCR結果をフォームに反映
        if (data.parsed_data.race) {
          setRace((prev) => ({ ...prev, ...data.parsed_data.race }));
        }
        if (data.parsed_data.horses && data.parsed_data.horses.length > 0) {
          setHorses(data.parsed_data.horses);
        }
        setResult(`OCR解析完了（信頼度: ${Math.round(data.confidence)}%）。内容を確認・修正してください。`);
      } else {
        setErrors([{ field: 'ocr', message: data.message || 'OCR処理に失敗しました' }]);
      }
    } catch {
      setErrors([{ field: 'ocr', message: 'OCRリクエスト送信中にエラーが発生しました' }]);
    } finally {
      setOcrProcessing(false);
    }
  };

  const getFieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">レースデータ手動入力</h1>

        {/* OCRセクション */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">画像からOCR読み取り（オプション）</h2>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/tiff"
              onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            <button
              onClick={handleOcr}
              disabled={!ocrFile || ocrProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {ocrProcessing ? '解析中...' : 'OCR解析'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            出馬表の画像をアップロードすると、自動で読み取りフォームに反映します。
          </p>
        </section>

        {/* レース情報 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">レース情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">日付</label>
              <input
                type="date"
                value={race.race_date}
                onChange={(e) => setRace({ ...race, race_date: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {getFieldError('race.race_date') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('race.race_date')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">開催場</label>
              <select
                value={race.venue}
                onChange={(e) => setRace({ ...race, venue: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {VENUES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">レース番号</label>
              <select
                value={race.race_number}
                onChange={(e) => setRace({ ...race, race_number: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}R</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">レース名</label>
              <input
                type="text"
                value={race.race_name}
                onChange={(e) => setRace({ ...race, race_name: e.target.value })}
                placeholder="例: 有馬記念"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">距離(m)</label>
              <input
                type="number"
                value={race.distance}
                onChange={(e) => setRace({ ...race, distance: parseInt(e.target.value) || 0 })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {getFieldError('race.distance') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('race.distance')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">馬場</label>
              <select
                value={race.surface}
                onChange={(e) => setRace({ ...race, surface: e.target.value as ManualRaceInput['surface'] })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {SURFACES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">馬場状態</label>
              <select
                value={race.track_condition || ''}
                onChange={(e) => setRace({ ...race, track_condition: (e.target.value || null) as ManualRaceInput['track_condition'] })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">未定</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">グレード</label>
              <input
                type="text"
                value={race.grade || ''}
                onChange={(e) => setRace({ ...race, grade: e.target.value || null })}
                placeholder="例: G1"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        {/* 出走馬情報 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">出走馬情報</h2>
            <button
              onClick={addHorse}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              + 馬を追加
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-2 py-2 text-left">枠</th>
                  <th className="px-2 py-2 text-left">馬番</th>
                  <th className="px-2 py-2 text-left">馬名</th>
                  <th className="px-2 py-2 text-left">性</th>
                  <th className="px-2 py-2 text-left">齢</th>
                  <th className="px-2 py-2 text-left">騎手</th>
                  <th className="px-2 py-2 text-left">オッズ</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {horses.map((horse, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={horse.frame_number}
                        onChange={(e) => updateHorse(i, 'frame_number', parseInt(e.target.value) || 0)}
                        className="w-12 border rounded px-1 py-1 text-center"
                        min={1}
                        max={8}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={horse.horse_number}
                        onChange={(e) => updateHorse(i, 'horse_number', parseInt(e.target.value) || 0)}
                        className="w-12 border rounded px-1 py-1 text-center"
                        min={1}
                        max={18}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={horse.horse_name}
                        onChange={(e) => updateHorse(i, 'horse_name', e.target.value)}
                        placeholder="馬名"
                        className="w-32 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={horse.sex || ''}
                        onChange={(e) => updateHorse(i, 'sex', e.target.value || null)}
                        className="w-14 border rounded px-1 py-1"
                      >
                        <option value="">-</option>
                        <option value="牡">牡</option>
                        <option value="牝">牝</option>
                        <option value="セ">セ</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={horse.age ?? ''}
                        onChange={(e) => updateHorse(i, 'age', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-12 border rounded px-1 py-1 text-center"
                        min={2}
                        max={12}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={horse.jockey}
                        onChange={(e) => updateHorse(i, 'jockey', e.target.value)}
                        placeholder="騎手名"
                        className="w-24 border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        value={horse.odds ?? ''}
                        onChange={(e) => updateHorse(i, 'odds', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-16 border rounded px-1 py-1 text-right"
                        step="0.1"
                        min="1.0"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => removeHorse(i)}
                        className="text-red-500 hover:text-red-700 text-xs"
                        title="削除"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {getFieldError('horses') && (
            <p className="text-red-500 text-xs mt-2">{getFieldError('horses')}</p>
          )}
        </section>

        {/* エラー表示 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold text-sm mb-2">入力エラー</h3>
            <ul className="text-red-700 text-xs space-y-1">
              {errors.map((e, i) => (
                <li key={i}>{e.field}: {e.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 成功メッセージ */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">{result}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '送信中...' : 'レースデータを登録'}
        </button>
      </div>
    </div>
  );
}
