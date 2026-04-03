'use client';

import { useEffect, useState, useCallback } from 'react';
import { MEMO_TAGS, type MemoTagId, type MemoHorse } from '@/types/memo-horse';
import {
  loadMemoHorses,
  addMemoHorse,
  updateMemoHorse,
  deleteMemoHorse,
} from '@/lib/memo-horse-storage';

export default function MemoHorsePage() {
  // --- 一覧 state ---
  const [memos, setMemos] = useState<MemoHorse[]>([]);

  // --- 入力フォーム state ---
  const [horseName, setHorseName] = useState('');
  const [selectedTags, setSelectedTags] = useState<MemoTagId[]>([]);
  const [memoText, setMemoText] = useState('');
  const [raceId, setRaceId] = useState('');
  const [raceName, setRaceName] = useState('');

  // --- 編集モード ---
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- バリデーション ---
  const [errors, setErrors] = useState<string[]>([]);

  // --- フィルタ ---
  const [filterTag, setFilterTag] = useState<MemoTagId | ''>('');
  const [searchText, setSearchText] = useState('');

  // 初回読み込み
  useEffect(() => {
    setMemos(loadMemoHorses());
  }, []);

  // フォームリセット
  const resetForm = useCallback(() => {
    setHorseName('');
    setSelectedTags([]);
    setMemoText('');
    setRaceId('');
    setRaceName('');
    setEditingId(null);
    setErrors([]);
  }, []);

  // タグ選択トグル
  const toggleTag = (tagId: MemoTagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  // バリデーション
  const validate = (): string[] => {
    const errs: string[] = [];
    if (!horseName.trim()) errs.push('馬名は必須です');
    if (horseName.trim().length > 50) errs.push('馬名は50文字以内で入力してください');
    if (selectedTags.length === 0) errs.push('タグを1つ以上選択してください');
    if (memoText.length > 1000) errs.push('メモは1000文字以内で入力してください');
    return errs;
  };

  // 保存
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);

    if (editingId) {
      updateMemoHorse(editingId, {
        horseName: horseName.trim(),
        tags: selectedTags,
        memo: memoText.trim(),
        raceId: raceId.trim() || undefined,
        raceName: raceName.trim() || undefined,
      });
    } else {
      addMemoHorse({
        horseName: horseName.trim(),
        tags: selectedTags,
        memo: memoText.trim(),
        raceId: raceId.trim() || undefined,
        raceName: raceName.trim() || undefined,
      });
    }

    setMemos(loadMemoHorses());
    resetForm();
  };

  // 編集モードに入る
  const startEdit = (memo: MemoHorse) => {
    setEditingId(memo.id);
    setHorseName(memo.horseName);
    setSelectedTags([...memo.tags]);
    setMemoText(memo.memo);
    setRaceId(memo.raceId ?? '');
    setRaceName(memo.raceName ?? '');
    setErrors([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 削除
  const handleDelete = (id: string) => {
    if (!confirm('このメモを削除しますか？')) return;
    deleteMemoHorse(id);
    setMemos(loadMemoHorses());
    if (editingId === id) resetForm();
  };

  // フィルタ適用
  const filteredMemos = memos.filter((m) => {
    if (filterTag && !m.tags.includes(filterTag)) return false;
    if (searchText && !m.horseName.includes(searchText) && !m.memo.includes(searchText)) {
      return false;
    }
    return true;
  });

  // タグIDからタグ情報を取得
  const getTag = (tagId: MemoTagId) => MEMO_TAGS.find((t) => t.id === tagId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">メモ馬入力</h1>

      {/* === 入力フォーム === */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? '✏️ メモ編集' : '📝 新規メモ'}
        </h2>

        {/* エラー表示 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            {errors.map((err, i) => (
              <p key={i} className="text-red-700 text-sm">{err}</p>
            ))}
          </div>
        )}

        {/* 馬名 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            馬名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={horseName}
            onChange={(e) => setHorseName(e.target.value)}
            placeholder="例: ディープインパクト"
            className="border rounded px-3 py-2 w-full text-sm"
          />
        </div>

        {/* レース情報（任意） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レースID（任意）
            </label>
            <input
              type="text"
              value={raceId}
              onChange={(e) => setRaceId(e.target.value)}
              placeholder="例: 0620240101"
              className="border rounded px-3 py-2 w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レース名（任意）
            </label>
            <input
              type="text"
              value={raceName}
              onChange={(e) => setRaceName(e.target.value)}
              placeholder="例: 有馬記念"
              className="border rounded px-3 py-2 w-full text-sm"
            />
          </div>
        </div>

        {/* タグ選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            タグ <span className="text-red-500">*</span>
            <span className="ml-2 text-gray-400 font-normal">（複数選択可）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MEMO_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    isSelected
                      ? `${tag.color} border-current font-semibold ring-2 ring-offset-1 ring-current`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* テキストメモ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メモ
            <span className="ml-2 text-gray-400 font-normal">
              ({memoText.length}/1000)
            </span>
          </label>
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="調教内容、パドック印象、馬場適性、過去レース分析など自由に記入..."
            rows={4}
            className="border rounded px-3 py-2 w-full text-sm resize-y"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
          >
            {editingId ? '更新する' : '保存する'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {/* === 一覧 === */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3">
          保存済みメモ ({memos.length}件)
        </h2>

        {/* フィルタ */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="馬名・メモで検索..."
            className="border rounded px-3 py-1.5 text-sm w-48"
          />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value as MemoTagId | '')}
            className="border rounded px-3 py-1.5 text-sm"
          >
            <option value="">全タグ</option>
            {MEMO_TAGS.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredMemos.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-gray-600">
          {memos.length === 0
            ? 'メモ馬が登録されていません。上のフォームから追加してください。'
            : '該当するメモがありません。'}
        </div>
      )}

      {/* メモ一覧カード */}
      <div className="space-y-3">
        {filteredMemos.map((memo) => (
          <div
            key={memo.id}
            className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* 馬名 + レース名 */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-base">{memo.horseName}</h3>
                  {memo.raceName && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {memo.raceName}
                    </span>
                  )}
                </div>

                {/* タグ */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {memo.tags.map((tagId) => {
                    const tag = getTag(tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tagId}
                        className={`px-2 py-0.5 rounded-full text-xs border ${tag.color}`}
                      >
                        {tag.label}
                      </span>
                    );
                  })}
                </div>

                {/* メモ本文 */}
                {memo.memo && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {memo.memo}
                  </p>
                )}

                {/* 日時 */}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(memo.createdAt).toLocaleString('ja-JP')}
                  {memo.updatedAt !== memo.createdAt && ' (更新済み)'}
                </p>
              </div>

              {/* 操作ボタン */}
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => startEdit(memo)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(memo.id)}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
