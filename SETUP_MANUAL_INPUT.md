# 手動入力機能 セットアップガイド

## 必要な追加パッケージ

以下のパッケージを手動でインストールしてください：

### OCR関連（必須）
```bash
npm install tesseract.js
```
- ブラウザ/Node.js両対応のOCRエンジン
- 日本語（jpn）+ 英語（eng）の認識に対応

### 画像前処理（推奨）
```bash
npm install sharp
npm install -D @types/sharp
```
- 画像のグレースケール変換・正規化・シャープニング
- OCR精度の向上に寄与
- インストールしなくても動作可能（OCR精度が低下する）

## ファイル構成

```
src/
├── types/
│   └── manual-input.ts          # 型定義
├── lib/
│   └── manual-input/
│       ├── index.ts             # エクスポート集約
│       ├── validate.ts          # バリデーション
│       ├── store.ts             # DB保存ロジック
│       └── ocr.ts               # OCR処理
├── app/
│   ├── manual-input/
│   │   └── page.tsx             # 手動入力UI
│   └── api/
│       ├── manual-input/
│       │   └── route.ts         # 手動入力API
│       └── ocr/
│           └── route.ts         # OCR API
```

## 動作確認

```bash
# 開発サーバー起動
npm run dev

# 手動入力ページ
# http://localhost:3000/manual-input

# API エンドポイント
# POST /api/manual-input  - 手動入力データの登録
# POST /api/ocr           - 画像OCR処理
```
