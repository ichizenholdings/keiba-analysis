'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TrackBiasInput, BiasInnerOuter, BiasPace, ValidationError } from '@/types/manual-input';

const VENUES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'] as const;
const SURFACES = ['芝', 'ダート', '障害'] as const;
const CONDITIONS = ['良', '稍重', '重', '不良'] as const;
const INNER_OUTER_OPTIONS: BiasInnerOuter[] = ['内有利', 'やや内有利', 'フラット', 'やや外有利', '外有利'];
const PACE_OPTIONS: BiasPace[] = ['前有利', 'やや前有利', 'フラット', 'やや差し有利', '差し有利', '追込有利'];

type SavedBias = TrackBiasInput & { bias_id: number; created_at: string };

function defaultBias(): TrackBiasInput {
  return {
    race_id: null,
    race_date: new Date().toISOString().split('T')[0],
    venue: '東京',
    race_number: null,
    surface: '芝',
    track_condition: '良',
    moisture_level: null,
    inner_outer: 'フラット',
    pace_bias: 'フラット',
    rail_position: null,
    course_condition_detail: null,
    winning_positions: null,
    notes: null,
  };
}

/** 内外バイアスの視覚表示 */
function InnerOuterIndicator({ value }: { value: BiasInnerOuter }) {
  const levels: Record<BiasInnerOuter, number> = {
    '内有利': 0, 'やや内有利': 1, 'フラット': 2, 'やや外有利': 3, '外有利': 4,
  };
  const level = levels[value];
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-gray-500">内</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-6 h-3 rounded-sm ${i === level ? 'bg-blue-600' : 'bg-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-500">外</span>
    </div>
  );
}

/** 前後バイアスの視覚表示 */
function PaceBiasIndicator({ value }: { value: BiasPace }) {
  const levels: Record<BiasPace, number> = {
    '前有利': 0, 'やや前有利': 1, 'フラット': 2, 'やや差し有利': 3, '差し有利': 4, '追込有利': 5,
  };
  const level = levels[value];
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-gray-500">前</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-5 h-3 rounded-sm ${i === level ? 'bg-green-600' : 'bg-gray-200'}`}
        />
      ))}
      <span className="text-xs text-gray-500">追</span>
    </div>
  );
}

export default function TrackBiasPage() {
  const [bias, setBias] = useState<TrackBiasInput>(defaultBias);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // 履歴表示
  const [savedBiases, setSavedBiases] = useState<SavedBias[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getFieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  const fetchHistory = useCallback(async (date?: string, venue?: string) => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (venue) params.set('venue', venue);
      const res = await fetch(`/api/track-bias?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSavedBiases(data.biases || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    setResult(null);

    try {
      const res = await fetch('/api/track-bias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bias),
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
        setBias(defaultBias());
        fetchHistory();
      }
    } catch {
      setErrors([{ field: 'general', message: '送信中にエラーが発生しました' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterHistory = () => {
    fetchHistory(bias.race_date, bias.venue);
  };

  /** 日付をYYYYMMDD → YYYY/MM/DD形式に変換 */
  const formatDate = (d: string) => {
    if (d.length === 8) return `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)}`;
    return d;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">馬場バイアス入力</h1>
        <p className="text-sm text-gray-600 mb-6">
          レースごとの馬場状態・内外バイアス・前後傾向を記録します。診断データと連携して予測精度を向上させます。
        </p>

        {/* 基本情報セクション */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">開催・馬場情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">日付 *</label>
              <input
                type="date"
                value={bias.race_date}
                onChange={(e) => setBias({ ...bias, race_date: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              {getFieldError('race_date') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('race_date')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">開催場 *</label>
              <select
                value={bias.venue}
                onChange={(e) => setBias({ ...bias, venue: e.target.value })}
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
                value={bias.race_number ?? ''}
                onChange={(e) => setBias({ ...bias, race_number: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">全体</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}R</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">未選択でその日全体の傾向</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">レースID</label>
              <input
                type="text"
                value={bias.race_id || ''}
                onChange={(e) => setBias({ ...bias, race_id: e.target.value || null })}
                placeholder="例: 0520260403"
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">既存レースと紐付ける場合</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">馬場 *</label>
              <select
                value={bias.surface}
                onChange={(e) => setBias({ ...bias, surface: e.target.value as TrackBiasInput['surface'] })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {SURFACES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">馬場状態 *</label>
              <select
                value={bias.track_condition}
                onChange={(e) => setBias({ ...bias, track_condition: e.target.value as TrackBiasInput['track_condition'] })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">含水率 (%)</label>
              <input
                type="number"
                value={bias.moisture_level ?? ''}
                onChange={(e) => setBias({ ...bias, moisture_level: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="例: 12"
                className="w-full border rounded px-3 py-2 text-sm"
                min={0}
                max={100}
              />
              {getFieldError('moisture_level') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('moisture_level')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">仮柵位置 (m)</label>
              <input
                type="number"
                value={bias.rail_position ?? ''}
                onChange={(e) => setBias({ ...bias, rail_position: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="例: 3"
                className="w-full border rounded px-3 py-2 text-sm"
                min={0}
                max={10}
              />
              {getFieldError('rail_position') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('rail_position')}</p>
              )}
            </div>
          </div>
        </section>

        {/* バイアス入力セクション */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">バイアス傾向</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 内外バイアス */}
            <div>
              <label className="block text-sm font-medium mb-2">内外バイアス *</label>
              <div className="flex flex-wrap gap-2">
                {INNER_OUTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBias({ ...bias, inner_outer: opt })}
                    className={`px-3 py-2 rounded text-sm border transition-colors ${
                      bias.inner_outer === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <InnerOuterIndicator value={bias.inner_outer} />
              {getFieldError('inner_outer') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('inner_outer')}</p>
              )}
            </div>

            {/* 前後バイアス */}
            <div>
              <label className="block text-sm font-medium mb-2">前後バイアス（脚質傾向） *</label>
              <div className="flex flex-wrap gap-2">
                {PACE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setBias({ ...bias, pace_bias: opt })}
                    className={`px-3 py-2 rounded text-sm border transition-colors ${
                      bias.pace_bias === opt
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <PaceBiasIndicator value={bias.pace_bias} />
              {getFieldError('pace_bias') && (
                <p className="text-red-500 text-xs mt-1">{getFieldError('pace_bias')}</p>
              )}
            </div>
          </div>
        </section>

        {/* 詳細情報セクション */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">詳細情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">コース状態の詳細</label>
              <input
                type="text"
                value={bias.course_condition_detail || ''}
                onChange={(e) => setBias({ ...bias, course_condition_detail: e.target.value || null })}
                placeholder="例: 内側が荒れ気味、3〜4角の外側は良好"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">好走ポジション傾向</label>
              <input
                type="text"
                value={bias.winning_positions || ''}
                onChange={(e) => setBias({ ...bias, winning_positions: e.target.value || null })}
                placeholder="例: 3-5番手の中団好位が有利、大外一気は厳しい"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">メモ・備考</label>
              <textarea
                value={bias.notes || ''}
                onChange={(e) => setBias({ ...bias, notes: e.target.value || null })}
                placeholder="例: 前日の雨の影響で内側がやや柔らかい。後半レースほど外差しが決まりやすくなった。"
                className="w-full border rounded px-3 py-2 text-sm h-24 resize-y"
              />
            </div>
          </div>
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
          {submitting ? '登録中...' : '馬場バイアスを登録'}
        </button>

        {/* 履歴セクション */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">登録済みバイアス履歴</h2>
            <button
              onClick={handleFilterHistory}
              className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              現在の日付・開催場で絞り込み
            </button>
          </div>

          {loadingHistory ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : savedBiases.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
              登録済みのバイアスデータはありません
            </div>
          ) : (
            <div className="space-y-3">
              {savedBiases.map((b) => (
                <div key={b.bias_id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {formatDate(b.race_date)} {b.venue}
                        {b.race_number ? ` ${b.race_number}R` : ' (全体)'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        b.surface === '芝' ? 'bg-green-100 text-green-800' :
                        b.surface === 'ダート' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {b.surface}
                      </span>
                      <span className="text-xs text-gray-500">{b.track_condition}</span>
                    </div>
                    <span className="text-xs text-gray-400">ID: {b.bias_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">内外: </span>
                      <span className="font-medium">{b.inner_outer}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">前後: </span>
                      <span className="font-medium">{b.pace_bias}</span>
                    </div>
                  </div>
                  {(b.moisture_level !== null || b.rail_position !== null) && (
                    <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                      {b.moisture_level !== null && (
                        <div>
                          <span className="text-gray-600">含水率: </span>
                          <span>{b.moisture_level}%</span>
                        </div>
                      )}
                      {b.rail_position !== null && (
                        <div>
                          <span className="text-gray-600">仮柵: </span>
                          <span>{b.rail_position}m</span>
                        </div>
                      )}
                    </div>
                  )}
                  {b.notes && (
                    <p className="text-xs text-gray-500 mt-2 border-t pt-2">{b.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
