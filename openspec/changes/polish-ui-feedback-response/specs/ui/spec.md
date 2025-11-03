## ADDED Requirements
### Requirement: Sidebar Header Stability
サイドバー展開時にヘッダーが伸縮しないようにし、閉じるボタンを展開ボタン部分に配置する。

#### Scenario: Sidebar Toggle Stability
- **WHEN** サイドバー展開ボタンをクリック
- **THEN** ヘッダー幅は変化せず、閉じるボタンが表示される

### Requirement: Wiki Gadget Uniqueness
Wikiガジェットの項目名がループせず、重複がない。

#### Scenario: Unique Wiki Items
- **WHEN** Wikiガジェットを表示
- **THEN** 各項目名はユニークでループしない

### Requirement: Goal Calculation Continuation
目標文字数が100%を超えても計算を継続。

#### Scenario: Beyond 100% Goals
- **WHEN** 文字数が目標を超える
- **THEN** 進捗バーが100%を超えて表示される

### Requirement: Goal Calendar Integration
目標文字数がカレンダーガジェットと連携。

#### Scenario: Calendar Goal Sync
- **WHEN** 目標期限を設定
- **THEN** カレンダーに表示される

### Requirement: Goal Clock Integration
目標文字数がClockガジェットと連携。

#### Scenario: Clock Goal Reminder
- **WHEN** 目標期限が近づく
- **THEN** Clockガジェットがリマインダー表示

### Requirement: Button Color Customization
ボタンの色をユーザーが変更可能。

#### Scenario: Button Color Change
- **WHEN** 設定でボタン色を選択
- **THEN** すべてのボタンが指定色に変わる

### Requirement: Scroll Stability
スクロールが戻らないバグを修正。

#### Scenario: Stable Scrolling
- **WHEN** エディタをスクロール
- **THEN** 位置が維持される

### Requirement: Character Stamp Display
文字数スタンプが表示される。

#### Scenario: Stamp Visibility
- **WHEN** エディタを表示
- **THEN** 右下に文字数スタンプが表示される

### Requirement: Inline Character Stamp Position & Config
インライン文字数スタンプは本文に混入せず、選択範囲・段落に対する視覚的オーバーレイとして表示される。

#### Scenario: Default Positioning
- **WHEN** スタンプ挿入（ボタン/Alt+S）
- **THEN** 選択範囲の最後の文字位置（選択なし時はカーソル段落の末尾）にインラインで表示される
- **AND** ビューポート外へはみ出す場合は自動でクランプされる（将来の調整対象）

#### Scenario: Gadget-based Adjustment
- **WHEN** スタンプ位置設定ガジェットでオフセットやアンカーを調整
- **THEN** オーバーレイの表示位置（dx/dy、アンカー: 後/前/行末など）が反映され、設定に保存される

### Requirement: Undo/Redo Checkpoint Grouping (Backlog)
アンドゥ/リドゥはチェックポイント単位でグルーピングし、履歴一覧として閲覧・復元できる。

#### Scenario: Grouped History
- **WHEN** チェックポイントを作成（自動/手動）
- **THEN** その間の編集操作がひとまとまりの履歴として一覧化され、選択復元できる

### Requirement: Sidebar Push Layout & Toggle Position
左サイドバー開閉はヘッダーを変形させず、メインエリアをサイドバー幅ぶん押し出す。開/閉のボタンは同一位置に表示され続ける（または単一トグルボタン）。

#### Scenario: No Overlap, Fixed Toggle
- **WHEN** サイドバーを開く
- **THEN** メインエリアはサイドバー幅だけ右へマージンが付与され、コンテンツと重ならない
- **AND** ヘッダーは縮まず、開く/閉じるボタンはツールバー内の同一座標に表示（単一トグルでも可）

### Requirement: Font Decoration as Meta (Realtime)
文字装飾は本文にタグを挿入せず、メタ情報（スタイルラン）として管理し、表示はリアルタイムに反映する。

#### Scenario: Non-destructive Formatting
- **WHEN** 装飾を適用
- **THEN** 本文テキストは変化せず、メタ情報に装飾が記録され、即座に表示へ反映される
- **AND** Undo/Redo はメタ情報の変更として正しく動作する
