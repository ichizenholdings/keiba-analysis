# Goal Hub — AI Worker Farm 連携ガイド

> このリポジトリはIchizen HoldingsのAI Worker Farmと連携しています。
> 長くなりそうなタスク・複雑な実装は、自分で全部やらずにGoal Hubに投げてください。

## Goal Hubとは

AI Worker Farm の中央タスク管理システム。ゴール（やりたいこと）を投げると：

1. **plan.sh** がClaude AIでサブタスクに自動分解
2. **poll.sh** が各Mac miniワーカーにタスクを自動配信
3. **run-cycle.sh** がClaude Codeでタスクを自律実行（ソクラテスレビュー付き）
4. **orchestrate.sh** が全タスク完了を検知して結果を集約

**人間がやること = ゴールを投げるだけ。**

## いつGoal Hubに投げるべきか

| こういう時 | Goal Hubに投げる |
|---|---|
| 実装が3ファイル以上にまたがる | ✅ |
| 1時間以上かかりそう | ✅ |
| テスト・ビルド確認が必要 | ✅ |
| リファクタ・リデザイン | ✅ |
| ドキュメント大量作成 | ✅ |
| 5分で終わる修正 | ❌ 自分でやる |
| 調査・質問 | ❌ Claude Codeに直接聞く |

## ゴールの投げ方

### 方法1: API直接（最速）

```bash
curl -X POST "https://kpimanagement.vercel.app/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submitGoal",
    "goal": {
      "title": "このリポの〇〇を実装する",
      "description": "## 背景
...
## やること
...
## 完了条件
...",
      "member_id": "kida",
      "assigned_host": ""
    }
  }'
```

### 方法2: ソクラテス先生経由（/chat）

KPI Managementの /chat ページで「〇〇をやりたい」と話すと、
ソクラテス先生が `<executeTask>` タグでGoal Hubにタスクを投げてくれる。

### 方法3: plan.sh（ゴール分解付き）

```bash
cd ~/ai-worker-farm/repo/worker
./plan.sh --new "このリポの〇〇を実装する" \
  --description "詳細な説明" \
  --member kida
```

## ゴール記述のコツ

良いゴール記述 = ワーカーが迷わず実行できる記述。

```markdown
## 背景（なぜやるのか）
現状の問題を1-2文で。

## やること（具体的に）
- ファイルパスを明記
- 変更内容を具体的に
- 「いい感じに」禁止、数値で指定

## 完了条件（チェックリスト）
- [ ] 〇〇ファイルが存在する
- [ ] npx next build / npm test が通る
- [ ] git commit + push されている

## 注意事項
- 変えてはいけないもの
- npm install禁止（木田の承認必要）
```

## 監視・確認

- **タスク状態確認**: https://kpimanagement.vercel.app/monitor
- **API**: `curl "https://kpimanagement.vercel.app/api/agent?action=readAgentTasks&status=running"`
- **ログ**: `tail -f ~/ai-worker-farm/logs/poll.log`

## リポジトリ境界ルール

Goal Hubは複数リポにまたがるタスクも管理できるが、
**各タスクは1リポ内で完結させること**。
リポをまたぐ場合はリポごとにサブタスクを分ける。
