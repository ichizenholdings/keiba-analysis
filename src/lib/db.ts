import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.KEIBA_DB_PATH || path.join(process.cwd(), 'data', 'keiba.db');

let db: Database.Database | null = null;

/** SQLiteデータベース接続を取得（シングルトン） */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
  }
  return db;
}

/** テーブル存在確認 */
export function tableExists(tableName: string): boolean {
  const db = getDb();
  const row = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
  ).get(tableName) as { name: string } | undefined;
  return !!row;
}
