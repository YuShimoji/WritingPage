## MODIFIED Requirements

### Requirement: Sidebar Expansion Behavior
システムは、左サイドバーを展開してもメインエリアが隠れないレイアウトを維持するものとする（SHALL）。

#### Scenario: Sidebar toggle
- WHEN 左サイドバーを展開
- THEN メインエリアの幅が自動調整され、隠れない

### Requirement: Color Palette Reflection
カラーパレットは、現在選択されている色を反映するものとする（SHALL）。

#### Scenario: Color display
- WHEN カラーパレットを開く
- THEN 現在の色がハイライトされる

### Requirement: Smooth Editor Scrolling
エディタ内のキー移動で、スクロールがガクガクしない滑らかな動作とする（SHALL）。

#### Scenario: Key navigation
- WHEN 矢印キーなどで移動
- THEN スクロールが滑らかに追従

### Requirement: Word Wrap Configuration
システムは、折り返し文字数を指定できる設定を提供するものとする（SHALL）。

#### Scenario: Set wrap length
- WHEN 設定で文字数を指定
- THEN エディタに適用され保存される

### Requirement: Word Count Stamp
システムは、その時点までの文字数を表示するスタンプ機能を提供するものとする（SHALL）。

#### Scenario: Show word count
- WHEN 区切り位置で表示
- THEN 文字数が表示される

### Requirement: Paragraph Word Count Aggregation
段落ごとに自動的に文字数を集計する機能を提供するものとする（SHALL）。

#### Scenario: Aggregate counts
- WHEN 段落終了
- THEN 文字数が集計表示される

### Requirement: File/Chapter Indicator
現在編集しているファイル/ノード/章を表示するものとする（SHALL）。

#### Scenario: Display current context
- WHEN 編集中
- THEN ファイル/章情報が表示される

### Requirement: File List View
ファイルがどのように保存されているかを一覧できる機能を提供するものとする（SHALL）。

#### Scenario: List files
- WHEN 一覧を開く
- THEN 保存ファイルが表示される

### Requirement: Enhanced Discard Confirmation
破棄時に本当に破棄して良いか確認し、残存変更を通知するものとする（SHALL）。

#### Scenario: Confirm discard
- WHEN 破棄操作
- THEN 確認ダイアログで変更内容を表示
