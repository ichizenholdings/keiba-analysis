import type { MemoHorse } from '@/types/memo-horse';

const STORAGE_KEY = 'keiba-memo-horses';

/** localStorageからメモ馬一覧を取得 */
export function loadMemoHorses(): MemoHorse[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as MemoHorse[];
  } catch {
    return [];
  }
}

/** メモ馬一覧をlocalStorageに保存 */
function saveMemoHorses(memos: MemoHorse[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
}

/** メモ馬を追加 */
export function addMemoHorse(
  input: Omit<MemoHorse, 'id' | 'createdAt' | 'updatedAt'>
): MemoHorse {
  const now = new Date().toISOString();
  const memo: MemoHorse = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const list = loadMemoHorses();
  list.unshift(memo);
  saveMemoHorses(list);
  return memo;
}

/** メモ馬を更新 */
export function updateMemoHorse(
  id: string,
  updates: Partial<Pick<MemoHorse, 'horseName' | 'tags' | 'memo' | 'raceId' | 'raceName'>>
): MemoHorse | null {
  const list = loadMemoHorses();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveMemoHorses(list);
  return list[idx];
}

/** メモ馬を削除 */
export function deleteMemoHorse(id: string): boolean {
  const list = loadMemoHorses();
  const filtered = list.filter((m) => m.id !== id);
  if (filtered.length === list.length) return false;
  saveMemoHorses(filtered);
  return true;
}
