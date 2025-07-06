# 技術仕様書

## アーキテクチャ概要

### システム構成
```
┌─────────────────┐
│   ブラウザ      │
├─────────────────┤
│   index.html    │ ← エントリーポイント
├─────────────────┤
│   styles.css    │ ← スタイル定義
├─────────────────┤
│   script.js     │ ← ビジネスロジック
├─────────────────┤
│ LocalStorage    │ ← データ永続化
└─────────────────┘
```

### クラス設計

#### KanbanApp クラス
メインアプリケーションクラス

```javascript
class KanbanApp {
    constructor()           // 初期化
    init()                 // アプリケーション起動
    
    // データ管理
    loadFromLocalStorage() // データ読み込み
    saveToLocalStorage()   // データ保存
    
    // タスク操作
    createTask()           // タスク作成
    updateTask()           // タスク更新
    deleteTask()           // タスク削除
    archiveTask()          // タスクアーカイブ
    restoreTask()          // タスク復元
    
    // 表示制御
    render()               // 画面描画
    renderTasks()          // タスク一覧描画
    renderArchive()        // アーカイブ描画
    
    // UI操作
    openModal()            // モーダル表示
    closeModal()           // モーダル非表示
    toggleTaskMenu()       // タスクメニュー切り替え
}
```

## データモデル

### タスクエンティティ
```typescript
interface Task {
    id: string;              // ユニークID（タイムスタンプベース）
    title: string;           // タスクタイトル（必須）
    description?: string;    // タスク説明（任意）
    status: TaskStatus;      // ステータス
    priority: Priority;      // 優先度
    createdAt: string;       // 作成日時（ISO8601）
    updatedAt: string;       // 更新日時（ISO8601）
    archivedAt?: string;     // アーカイブ日時（任意）
}

type TaskStatus = 'todo' | 'progress' | 'done';
type Priority = 'high' | 'medium' | 'low';
```

### LocalStorage スキーマ
```javascript
// タスクデータ
localStorage['kanban-tasks'] = JSON.stringify(Task[])

// アーカイブデータ  
localStorage['kanban-archived'] = JSON.stringify(Task[])
```

## API 設計

### 内部API（KanbanAppクラスのメソッド）

#### タスク管理API
```javascript
// タスク作成
createTask(title: string, description: string, priority: Priority): Task

// タスク更新
updateTask(id: string, updates: Partial<Task>): void

// タスク削除
deleteTask(id: string): void

// ステータス更新
updateTaskStatus(taskId: string, newStatus: TaskStatus): void

// アーカイブ
archiveTask(id: string): void
restoreTask(id: string): void
```

#### 検索・フィルタAPI
```javascript
// フィルタ適用
getFilteredTasks(): Task[]

// 検索語ハイライト
highlightSearchTerm(text: string): string

// ソート適用
sortTasks(tasks: Task[], sortBy: SortOption): Task[]
```

## イベント処理

### DOMイベント
```javascript
// クリックイベント
document.addEventListener('click', handleDocumentClick)

// フォーム送信
taskForm.addEventListener('submit', handleFormSubmit)

// 入力変更
searchInput.addEventListener('input', handleSearchInput)

// ドラッグ&ドロップ
element.addEventListener('dragstart', handleDragStart)
element.addEventListener('drop', handleDrop)
```

### カスタムイベント
```javascript
// タスク更新時
this.dispatchEvent('task-updated', { task })

// アーカイブ時
this.dispatchEvent('task-archived', { task })
```

## パフォーマンス最適化

### レンダリング最適化
1. **差分更新**: 変更があった部分のみDOM更新
2. **イベント委譲**: 親要素でのイベント処理
3. **DocumentFragment**: 複数要素の一括挿入

### メモリ管理
1. **イベントリスナー**: 適切な削除
2. **オブジェクト参照**: 循環参照の回避
3. **DOM参照**: 不要な参照の削除

### データアクセス最適化
1. **LocalStorage**: 必要時のみアクセス
2. **JSON解析**: エラーハンドリング
3. **キャッシュ**: メモリ内キャッシュ活用

## セキュリティ

### XSS対策
```javascript
// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// innerHTML使用時の注意
element.innerHTML = escapeHtml(userInput);
```

### データ検証
```javascript
// 入力値検証
function validateTask(task) {
    if (!task.title || task.title.trim().length === 0) {
        throw new Error('タイトルは必須です');
    }
    if (!['todo', 'progress', 'done'].includes(task.status)) {
        throw new Error('無効なステータスです');
    }
}
```

## エラーハンドリング

### 例外処理パターン
```javascript
// LocalStorage アクセス
try {
    const data = JSON.parse(localStorage.getItem('kanban-tasks'));
    return data || [];
} catch (error) {
    console.error('データ読み込みエラー:', error);
    return [];
}

// DOM操作
try {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`要素が見つかりません: ${id}`);
    }
    // 処理続行
} catch (error) {
    console.error('DOM操作エラー:', error);
    // フォールバック処理
}
```

## テスト戦略

### 単体テスト対象
```javascript
// データ操作関数
describe('TaskManager', () => {
    test('タスク作成', () => {
        const task = createTask('テスト', 'テスト説明', 'high');
        expect(task.title).toBe('テスト');
        expect(task.priority).toBe('high');
    });
});

// フィルタ・ソート関数
describe('TaskFilter', () => {
    test('ステータスフィルタ', () => {
        const filtered = filterByStatus(tasks, 'todo');
        expect(filtered.every(task => task.status === 'todo')).toBe(true);
    });
});
```

### 統合テスト対象
- ページ読み込み時の初期化
- タスク作成から表示までの一連の流れ
- ドラッグ&ドロップの動作
- LocalStorageとの連携

### E2Eテスト対象
- ユーザー操作シナリオ
- ブラウザ間の互換性
- レスポンシブデザインの動作

## デプロイメント

### 静的ホスティング
```bash
# ローカル開発サーバー
python -m http.server 8000
# または
npx serve src/

# GitHub Pages
git push origin main
# GitHub Pages設定でsrc/フォルダを指定
```

### 必要な設定
- UTF-8エンコーディング
- MIME Type設定（.js, .css）
- HTTPSプロトコル（PWA化時）

## ブラウザ対応

### 必要な機能
```javascript
// ES6+ 機能
const, let, arrow functions, template literals, classes

// DOM API
addEventListener, querySelector, localStorage

// HTML5 API  
Drag and Drop API, Local Storage API

// CSS3 機能
Grid Layout, Flexbox, CSS Variables, Animations
```

### ポリフィル対応（必要時）
```javascript
// IE11対応（参考）
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement) {
        return this.indexOf(searchElement) !== -1;
    };
}
```

## 開発環境

### 推奨ツール
- **エディタ**: Visual Studio Code
- **拡張機能**: Live Server, Prettier
- **ブラウザ**: Chrome DevTools
- **バージョン管理**: Git

### 開発ワークフロー
1. **開発**: Live Serverで動作確認
2. **テスト**: 複数ブラウザでの確認
3. **デバッグ**: Chrome DevToolsでの調査
4. **コミット**: 機能単位での変更管理

## 保守・運用

### ログ管理
```javascript
// デバッグログ
console.log('Task created:', task);

// エラーログ
console.error('操作エラー:', error);

// 警告ログ
console.warn('非推奨の操作:', operation);
```

### 監視項目
- LocalStorageの使用量
- JavaScript エラー発生率
- パフォーマンス指標
- ユーザー操作ログ

### 更新プロセス
1. **バックアップ**: 既存データの保護
2. **テスト**: 新機能の動作確認
3. **デプロイ**: 段階的なリリース
4. **監視**: リリース後の動作確認