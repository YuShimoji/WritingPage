# worker-monitor.js 使用方法

## 概要

`worker-monitor.js` は、AI_CONTEXT.md の Worker完了ステータスを監視・更新するスクリプトです。

## 配置場所

- 中央リポジトリ: `.shared-workflows/scripts/worker-monitor.js`
- プロジェクト側で使用する場合: `.shared-workflows/scripts/worker-monitor.js` を直接実行（submodule経由）

## 機能

### 1. Worker完了ステータスの更新

`updateWorkerStatus(aiContextPath, workerName, newStatus)` 関数を使用して、AI_CONTEXT.md の Worker完了ステータスを更新します。

**使用例（Node.jsスクリプト内）**:

```javascript
const { updateWorkerStatus } = require('.shared-workflows/scripts/worker-monitor.js');

// AI_CONTEXT.md の Worker完了ステータスを更新
updateWorkerStatus('AI_CONTEXT.md', 'TASK_010', 'completed');
```

### 2. Worker完了ステータスの監視

`monitorWorkers(aiContextPath, checkInterval)` 関数を使用して、AI_CONTEXT.md の Worker完了ステータスを定期的に監視します。

**使用例（Node.jsスクリプト内）**:

```javascript
const { monitorWorkers } = require('.shared-workflows/scripts/worker-monitor.js');

// AI_CONTEXT.md の Worker完了ステータスを1分間隔で監視
const intervalId = monitorWorkers('AI_CONTEXT.md', 60000);

// 監視を停止する場合
clearInterval(intervalId);
```

### 3. コマンドライン実行

コマンドラインから直接実行して、Worker完了ステータスを監視します。

**使用方法**:

```bash
# デフォルト（AI_CONTEXT.md を監視）
node .shared-workflows/scripts/worker-monitor.js

# カスタムパスを指定
node .shared-workflows/scripts/worker-monitor.js path/to/AI_CONTEXT.md
```

**動作**:
- AI_CONTEXT.md の Worker完了ステータスを1分間隔で監視
- すべての critical Worker が完了した場合、監視を自動停止（async_mode が false の場合）
- Ctrl+C で手動停止

## AI_CONTEXT.md の形式

worker-monitor.js は、AI_CONTEXT.md の以下の形式を想定しています:

```markdown
## Worker完了ステータス

- TASK_010: completed
- TASK_011: pending
```

または:

```markdown
- **Worker完了ステータス**: TASK_010: completed, TASK_011: pending
```

## 注意事項

- worker-monitor.js は AI_CONTEXT.md の「Worker完了ステータス」セクションを自動的に更新します
- 監視機能は長時間実行されるため、バックグラウンドで実行することを推奨します
- async_mode が true の場合、すべての Worker が完了しても監視を自動停止しません

## 統合例

既存のスクリプト（例: `todo-sync.js`）と統合する場合:

```javascript
const { updateWorkerStatus } = require('.shared-workflows/scripts/worker-monitor.js');
const path = require('path');

function syncWorkerStatus(taskName, status) {
  const aiContextPath = path.join(process.cwd(), 'AI_CONTEXT.md');
  updateWorkerStatus(aiContextPath, taskName, status);
}
```

## 参考

- 中央リポジトリ: `https://github.com/YuShimoji/shared-workflows`
- ローカルパス（submodule）: `.shared-workflows/`
