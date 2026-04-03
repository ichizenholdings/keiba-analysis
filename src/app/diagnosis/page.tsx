'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DiagnosisRank,
  HorseDiagnosis,
  DiagnosisRequest,
  DiagnosisListItem,
  DiagnosisDetailResponse,
} from '@/types/diagnosis';
import type { ValidationError } from '@/types/manual-input';

const VENUES = ['札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'] as const;
const RANKS: DiagnosisRank[] = ['A', 'B', 'C', 'D', 'E'];

const RANK_COLORS: Record<DiagnosisRank, string> = {
  A: 'bg-red-100 text-red-800 border-red-300',
  B: 'bg-orange-100 text-orange-800 border-orange-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-blue-100 text-blue-800 border-blue-300',
  E: 'bg-gray-100 text-gray-600 border-gray-300',
};

const RANK_LABELS: Record<DiagnosisRank, string> = {
  A: 'A (最高評価)',
  B: 'B (高評価)',
  C: 'C (標準)',
  D: 'D (低評価)',
  E: 'E (見送り)',
};

function emptyDiagnosis(num: number): HorseDiagnosis {
  return {
    horse_number: num,
    horse_name: '',
    rank: 'C',
    speed_rating: null,
    stamina_rating: null,
    condition_rating: null,
    jockey_rating: null,
    comment: '',
    is_honmei: false,
    is_taikou: false,
    is_tanana: false,
    is_renka: false,
  };
}

type ViewMode = 'input' | 'list';

export default function DiagnosisPage() {
  // --- 表示切替 ---
  const [viewMode, setViewMode] = useState<ViewMode>('input');

  // --- 入力フォーム状態 ---
  const [raceDate, setRaceDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState('東京');
  const [raceNumber, setRaceNumber] = useState(1);
  const [raceName, setRaceName] = useState('');
  const [overallComment, setOverallComment] = useState('');
  const [diagnoses, setDiagnoses] = useState<HorseDiagnosis[]>(
    Array.from({ length: 3 }, (_, i) => emptyDiagnosis(i + 1))
  );

  // --- 状態 ---
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- 一覧 ---
  const [diagList, setDiagList] = useState<DiagnosisListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // --- 馬の追加・削除・更新 ---
  const addHorse = () => {
    setDiagnoses((prev) => [...prev, emptyDiagnosis(prev.length + 1)]);
  };

  const removeHorse = (index: number) => {
    setDiagnoses((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDiagnosis = (
    index: number,
    field: keyof HorseDiagnosis,
    value: string | number | boolean | null
  ) => {
    setDiagnoses((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  // --- 印の排他制御 ---
  const setMark = (index: number, mark: 'is_honmei' | 'is_taikou' | 'is_tanana' | 'is_renka') => {
    setDiagnoses((prev) =>
      prev.map((d, i) => {
        if (i !== index) {
          // 本命・対抗は1頭のみ
          if (mark === 'is_honmei' || mark === 'is_taikou') {
            return { ...d, [mark]: false };
          }
          return d;
        }
        return { ...d, [mark]: !d[mark] };
      })
    );
  };

  // --- 一覧読み込み ---
  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/diagnoses?limit=50');
      if (res.ok) {
        const data = await res.json();
        setDiagList(data.diagnoses);
      }
    } catch {
      // silent
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'list') {
      loadList();
    }
  }, [viewMode, loadList]);

  // --- 編集モード ---
  const loadForEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/diagnoses/${id}`);
      if (!res.ok) return;
      const data: DiagnosisDetailResponse = await res.json();

      setRaceDate(data.race_date);
      setVenue(data.venue);
      setRaceNumber(data.race_number);
      setRaceName(data.race_name);
      setOverallComment(data.overall_comment);
      setDiagnoses(
        data.horses.map((h) => ({
          horse_number: h.horse_number,
          horse_name: h.horse_name,
          rank: h.rank as DiagnosisRank,
          speed_rating: h.speed_rating as number | null,
          stamina_rating: h.stamina_rating as number | null,
          condition_rating: h.condition_rating as number | null,
          jockey_rating: h.jockey_rating as number | null,
          comment: h.comment as string,
          is_honmei: h.is_honmei,
          is_taikou: h.is_taikou,
          is_tanana: h.is_tanana,
          is_renka: h.is_renka,
        }))
      );
      setEditingId(id);
      setViewMode('input');
      setSuccessMsg(null);
      setErrors([]);
    } catch {
      // silent
    }
  };

  // --- 削除 ---
  const deleteDiagnosis = async (id: number) => {
    if (!confirm('この診断データを削除しますか？')) return;
    try {
      const res = await fetch(`/api/diagnoses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadList();
      }
    } catch {
      // silent
    }
  };

  // --- 新規作成モードへリセット ---
  const resetForm = () => {
    setRaceDate(new Date().toISOString().split('T')[0]);
    setVenue('東京');
    setRaceNumber(1);
    setRaceName('');
    setOverallComment('');
    setDiagnoses(Array.from({ length: 3 }, (_, i) => emptyDiagnosis(i + 1)));
    setEditingId(null);
    setErrors([]);
    setSuccessMsg(null);
  };

  // --- 送信 ---
  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    setSuccessMsg(null);

    const payload: DiagnosisRequest = {
      race_date: raceDate,
      venue,
      race_number: raceNumber,
      race_name: raceName,
      overall_comment: overallComment,
      diagnoses,
    };

    const url = editingId ? `/api/diagnoses/${editingId}` : '/api/diagnoses';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
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
        setSuccessMsg(data.message);
        if (!editingId) {
          setEditingId(data.diagnosis_id);
        }
      }
    } catch {
      setErrors([{ field: 'general', message: '送信中にエラーが発生しました' }]);
    } finally {
      setSubmitting(false);
    }
  };

  const getFieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  // ========== レンダリング ==========

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">全頭診断</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setViewMode('input'); resetForm(); }}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewMode === 'input'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              新規入力
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              一覧表示
            </button>
          </div>
        </div>

        {/* ========== 一覧表示 ========== */}
        {viewMode === 'list' && (
          <section className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">診断データ一覧</h2>
              {listLoading ? (
                <p className="text-gray-500 text-sm">読み込み中...</p>
              ) : diagList.length === 0 ? (
                <p className="text-gray-500 text-sm">診断データがありません。「新規入力」から作成してください。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-3 py-2 text-left">日付</th>
                        <th className="px-3 py-2 text-left">開催場</th>
                        <th className="px-3 py-2 text-left">R</th>
                        <th className="px-3 py-2 text-left">レース名</th>
                        <th className="px-3 py-2 text-center">頭数</th>
                        <th className="px-3 py-2 text-left">コメント</th>
                        <th className="px-3 py-2 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagList.map((item) => (
                        <tr key={item.diagnosis_id} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2">{item.race_date}</td>
                          <td className="px-3 py-2">{item.venue}</td>
                          <td className="px-3 py-2">{item.race_number}R</td>
                          <td className="px-3 py-2">{item.race_name || '-'}</td>
                          <td className="px-3 py-2 text-center">{item.horses_count}頭</td>
                          <td className="px-3 py-2 text-gray-500 truncate max-w-[200px]">
                            {item.overall_comment || '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => loadForEdit(item.diagnosis_id)}
                              className="text-blue-600 hover:text-blue-800 text-xs mr-2"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => deleteDiagnosis(item.diagnosis_id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========== 入力フォーム ========== */}
        {viewMode === 'input' && (
          <>
            {editingId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">
                  編集モード（ID: {editingId}）
                  <button
                    onClick={resetForm}
                    className="ml-3 text-blue-600 hover:text-blue-800 underline text-xs"
                  >
                    新規作成に切替
                  </button>
                </p>
              </div>
            )}

            {/* レース情報 */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">レース情報</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">日付</label>
                  <input
                    type="date"
                    value={raceDate}
                    onChange={(e) => setRaceDate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  {getFieldError('race_date') && (
                    <p className="text-red-500 text-xs mt-1">{getFieldError('race_date')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">開催場</label>
                  <select
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
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
                    value={raceNumber}
                    onChange={(e) => setRaceNumber(parseInt(e.target.value))}
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
                    value={raceName}
                    onChange={(e) => setRaceName(e.target.value)}
                    placeholder="例: 有馬記念"
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* 全頭診断入力 */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">全頭診断</h2>
                <button
                  onClick={addHorse}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  + 馬を追加
                </button>
              </div>

              <div className="space-y-4">
                {diagnoses.map((diag, i) => (
                  <div
                    key={i}
                    className={`border rounded-lg p-4 ${RANK_COLORS[diag.rank].split(' ').filter(c => c.startsWith('border-')).join(' ')} border-l-4`}
                  >
                    {/* 馬番・馬名・ランク・印 行 */}
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">馬番</label>
                        <input
                          type="number"
                          value={diag.horse_number}
                          onChange={(e) => updateDiagnosis(i, 'horse_number', parseInt(e.target.value) || 0)}
                          className="w-14 border rounded px-2 py-1 text-center text-sm"
                          min={1}
                          max={18}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                        <label className="text-xs text-gray-500">馬名</label>
                        <input
                          type="text"
                          value={diag.horse_name}
                          onChange={(e) => updateDiagnosis(i, 'horse_name', e.target.value)}
                          placeholder="馬名を入力"
                          className="flex-1 border rounded px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">評価</label>
                        <select
                          value={diag.rank}
                          onChange={(e) => updateDiagnosis(i, 'rank', e.target.value)}
                          className={`border rounded px-2 py-1 text-sm font-bold ${RANK_COLORS[diag.rank]}`}
                        >
                          {RANKS.map((r) => (
                            <option key={r} value={r}>{RANK_LABELS[r]}</option>
                          ))}
                        </select>
                      </div>
                      {/* 印ボタン */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMark(i, 'is_honmei')}
                          className={`w-8 h-8 rounded text-xs font-bold border ${
                            diag.is_honmei
                              ? 'bg-red-600 text-white border-red-700'
                              : 'bg-white text-gray-400 border-gray-300 hover:border-red-400'
                          }`}
                          title="本命"
                        >
                          ◎
                        </button>
                        <button
                          type="button"
                          onClick={() => setMark(i, 'is_taikou')}
                          className={`w-8 h-8 rounded text-xs font-bold border ${
                            diag.is_taikou
                              ? 'bg-blue-600 text-white border-blue-700'
                              : 'bg-white text-gray-400 border-gray-300 hover:border-blue-400'
                          }`}
                          title="対抗"
                        >
                          ○
                        </button>
                        <button
                          type="button"
                          onClick={() => setMark(i, 'is_tanana')}
                          className={`w-8 h-8 rounded text-xs font-bold border ${
                            diag.is_tanana
                              ? 'bg-yellow-500 text-white border-yellow-600'
                              : 'bg-white text-gray-400 border-gray-300 hover:border-yellow-400'
                          }`}
                          title="単穴"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => setMark(i, 'is_renka')}
                          className={`w-8 h-8 rounded text-xs font-bold border ${
                            diag.is_renka
                              ? 'bg-green-600 text-white border-green-700'
                              : 'bg-white text-gray-400 border-gray-300 hover:border-green-400'
                          }`}
                          title="連下"
                        >
                          △
                        </button>
                      </div>
                      <button
                        onClick={() => removeHorse(i)}
                        className="text-red-400 hover:text-red-600 text-sm ml-auto"
                        title="この馬を削除"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 指数入力行 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">スピード指数</label>
                        <input
                          type="number"
                          value={diag.speed_rating ?? ''}
                          onChange={(e) => updateDiagnosis(i, 'speed_rating', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border rounded px-2 py-1 text-sm text-center"
                          min={0}
                          max={100}
                          placeholder="0-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">スタミナ指数</label>
                        <input
                          type="number"
                          value={diag.stamina_rating ?? ''}
                          onChange={(e) => updateDiagnosis(i, 'stamina_rating', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border rounded px-2 py-1 text-sm text-center"
                          min={0}
                          max={100}
                          placeholder="0-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">調子</label>
                        <input
                          type="number"
                          value={diag.condition_rating ?? ''}
                          onChange={(e) => updateDiagnosis(i, 'condition_rating', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border rounded px-2 py-1 text-sm text-center"
                          min={0}
                          max={100}
                          placeholder="0-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">騎手評価</label>
                        <input
                          type="number"
                          value={diag.jockey_rating ?? ''}
                          onChange={(e) => updateDiagnosis(i, 'jockey_rating', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full border rounded px-2 py-1 text-sm text-center"
                          min={0}
                          max={100}
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    {/* コメント */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">診断コメント</label>
                      <textarea
                        value={diag.comment}
                        onChange={(e) => updateDiagnosis(i, 'comment', e.target.value)}
                        placeholder="この馬の診断コメントを入力..."
                        className="w-full border rounded px-3 py-2 text-sm resize-y"
                        rows={2}
                      />
                    </div>

                    {/* 馬ごとのエラー */}
                    {errors
                      .filter((e) => e.field.startsWith(`diagnoses[${i}]`))
                      .map((e, ei) => (
                        <p key={ei} className="text-red-500 text-xs mt-1">{e.message}</p>
                      ))}
                  </div>
                ))}
              </div>

              {getFieldError('diagnoses') && (
                <p className="text-red-500 text-xs mt-2">{getFieldError('diagnoses')}</p>
              )}
            </section>

            {/* レース全体コメント */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-3">レース全体コメント</h2>
              <textarea
                value={overallComment}
                onChange={(e) => setOverallComment(e.target.value)}
                placeholder="レース全体の見解・展開予想などを入力..."
                className="w-full border rounded px-3 py-2 text-sm resize-y"
                rows={4}
              />
            </section>

            {/* エラー表示 */}
            {errors.filter((e) => !e.field.startsWith('diagnoses[')).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-red-800 font-semibold text-sm mb-2">入力エラー</h3>
                <ul className="text-red-700 text-xs space-y-1">
                  {errors
                    .filter((e) => !e.field.startsWith('diagnoses['))
                    .map((e, i) => (
                      <li key={i}>{e.message}</li>
                    ))}
                </ul>
              </div>
            )}

            {/* 成功メッセージ */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">{successMsg}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? '保存中...'
                : editingId
                  ? '診断データを更新'
                  : '診断データを保存'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
