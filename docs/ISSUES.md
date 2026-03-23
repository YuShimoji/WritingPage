# Issues（検証棚卸しからのアクション化）

このファイルは、2026-03-14 の全体検証結果をもとに、AI エージェントがそのまま着手しやすい単位へ分解したバックログです。

- 方針: 1 セクション = 1 issue
- 優先順: 上から高い
- 基本ルール: 実装を直すだけでなく、仕様・テスト・関連ドキュメントも同じ issue 内で整合させる

> **2026-03-15 新仕様との整合注記**
> SP-070〜076 の新規仕様策定により、以下のIssueの文脈が変化している:
>
> - Issue #1 (doc://): SP-072 で `chapter://` (ドキュメント内) と `doc://` (ドキュメント間) の棲み分けを定義。doc://修正は引き続き有効
> - Issue #2 (APP_SPEC): 新仕様7件の存在を反映する必要あり。スコープ拡大
> - Issue #3 (GADGETS.md): SP-076 (ドックパネル) でガジェット配置構造がさらに変わる。現行整理は有効だが将来変更を注記すること
> - Issue #4 (インポート/エクスポート): SP-075 (Google Keep) はスコープ外 (2026-03-23)。EPUB/DOCXも除外。現行4形式 (TXT/MD/HTML/PDF) で十分
> - Issue #7 (SSOT): 新仕様7件 + spec-index.json 更新で部分的に解決方向。文書役割定義は引き続き必要

---

## 8) ~~Editor モード UX 統合改善 (2026-03-19)~~ — 解決済み (2026-03-23 SP-079 Step 1-4)

チャプター管理の 3 点イシュー + ドキュメント操作の不整合。詳細は [docs/issues/2026-03-19_chapter-ux-issues.md](issues/2026-03-19_chapter-ux-issues.md) を参照。

- **Issue A**: ~~章モードが一方向移行でロールバック不可~~ → SP-079 Step 1 (chapterMode デフォルト化) + Step 2 (解除ボタン) で解決
- **Issue B**: ~~文字数が DSL 構文を含む~~ → SP-079 Step 3 (countPlainChars() に統一) で解決
- **Issue C**: ~~Legacy モードの章追加が本文に混在~~ → SP-079 Step 4 (Legacy 変換バナー) + Step 2 (ロールバック UI) で対処
- **Issue D** (別 Worker 担当): 「構造 > ドキュメント」でファイルをクリックすると順序が入れ替わる / 内容が消失する — **未確認**

---

## 1) ~~`doc://` リンク仕様を確定し、実装と E2E を一致させる~~ ✅ 解決済み (2026-03-16)

> **解決**: 正規表現を修正し `#` をdocIdから除外。プレーンテキスト正規表現の重複マッチも除外。E2E 6/6通過。

### Goal（目的）

- `doc://<docId>#<section>` リンクの構文を正しく扱えるようにし、実装・テスト・仕様の3点を一致させる

### Background / Problem（背景・問題）

- `js/link-graph.js` の `parseDocLinks()` が `doc://doc1#section1` を `docId = "doc1#section1"` と解釈しており、`section` を正しく分離できていない
- `e2e/wikilinks.spec.js` もその誤挙動を期待値として固定しているため、将来修正を入れるとテストが邪魔をする
- 現状は「実装バグ」と「誤ったテスト」が同時に存在している

### Scope（作業範囲）

- `js/link-graph.js` の `parseDocLinks()` を修正
- `doc://` の正式な構文を仕様へ明記
- `e2e/wikilinks.spec.js` の期待値を修正
- 必要なら `doc://` を使う他 API の呼び出し側も点検

### DoD（受入基準）

- [ ] `doc://doc1#section1` で `docId = "doc1"`、`section = "section1"` になる
- [ ] `doc://doc1` で `docId = "doc1"`、`section = undefined` になる
- [ ] `[[wikilink]]` と `doc://` の両方について既存機能が壊れていない
- [ ] E2E が新仕様に合わせて通る
- [ ] 仕様ドキュメントに構文例が追記されている

### Evidence（根拠）

- `js/link-graph.js`
- `e2e/wikilinks.spec.js`

### Agent Notes（着手メモ）

- 仕様未確定のまま実装を変えないこと
- まず構文契約を決めてから、実装とテストを同時更新すること

---

## 2) ~~`docs/APP_SPECIFICATION.md` を現行実装ベースで更新し、SSOT を回復する~~ ✅ 解決済み (2026-03-16)

> **解決**: 全面リライト。サイドバー6カテゴリ化、テスト271件/38ファイル、プラグイン実装済み記載、SP-070〜076新仕様反映、エディタモード詳細追記、Story Wiki追記。

### Goal（目的）

- 現行の Zen Writer v0.3.29 の仕様書として信頼できる状態に戻す

### Background / Problem（背景・問題）

- サイドバー構成が旧4タブ前提のまま残っているが、実装は `sections / structure / edit / theme / assist / advanced` の6カテゴリ・アコーディオンになっている
- テスト件数や UI 構成など複数の数値・説明が古い
- 制限事項に「プラグインシステム未実装」とあるが、実装と運用ガイドは存在する

### Scope（作業範囲）

- `docs/APP_SPECIFICATION.md` 全体の棚卸し
- UI 構成、主要機能、テスト件数、制限事項、今後の拡張予定の更新
- 実装済みだが仕様未反映の項目を追記

### DoD（受入基準）

- [ ] サイドバー構成が現行 UI と一致している
- [ ] テスト件数・E2E ファイル数などの数値が現行状態と一致している
- [ ] プラグイン機能の扱いが現実に即している
- [ ] 「実装済み」「未実装」「将来予定」の区分が現在の実態に沿っている
- [ ] 他の主要文書 (`README.md`, `docs/ROADMAP.md`) と矛盾が最小化されている

### Evidence（根拠）

- `docs/APP_SPECIFICATION.md`
- `docs/ROADMAP.md`
- `index.html`
- `js/sidebar-manager.js`
- `js/plugin-manager.js`

### Agent Notes（着手メモ）

- 実装を仕様に寄せるのではなく、まず現行実装を基準に事実を書き起こすこと
- 将来予定は `docs/ROADMAP.md` と二重管理しないこと

---

## 3) ~~`docs/GADGETS.md` の旧記述を整理し、現行アーキテクチャと一致させる~~ ✅ 解決済み (2026-03-16)

> **解決**: カテゴリ説明を旧3カテゴリ(Structure/Typography/Assist)から現行6カテゴリ(sections/structure/edit/theme/assist/advanced)に更新。タブ→アコーディオン表記修正。groupIdリファレンス修正。SP-070/SP-076連動注記追加。ロードアウト例更新。

### Goal（目的）

- ガジェット基盤の説明書を、現行のアコーディオン/グループ構成に合わせて再整理する

### Background / Problem（背景・問題）

- 文書内に旧来の `structure / typography / assist / wiki` 前提の記述が残っている
- 同じ文書内の一覧表では `edit / theme / advanced / sections` を使っており、内部矛盾している
- 実装者が group 名や DOM セレクタの正しい基準を判断しづらい

### Scope（作業範囲）

- `docs/GADGETS.md` の現行セクションを実装準拠で更新
- 古いタブ前提記述を削除または「過去仕様」と明記
- `data-gadget-group`、ロードアウト、SidebarManager の責務説明を現行コードに合わせる

### DoD（受入基準）

- [ ] 現行 group 名が `index.html` / `js/sidebar-manager.js` と一致している
- [ ] 旧構成の記述が現行説明に混ざっていない
- [ ] ガジェット一覧、グループ集計、DOM セレクタ説明に矛盾がない
- [ ] 将来案と現行仕様が明確に分離されている

### Evidence（根拠）

- `docs/GADGETS.md`
- `index.html`
- `js/sidebar-manager.js`
- `js/gadgets-init.js`

### Agent Notes（着手メモ）

- 「現行」と「将来案」を混在させないこと
- 実装コード中の実際の `data-gadget-group` を必ず起点にすること

---

## 4) ~~インポート/エクスポートの対応範囲をプラットフォーム別に仕様化し、UI と揃える~~ ✅ 解決済み (2026-03-16)

> **解決**: APP_SPECIFICATION.md にプラットフォーム別4x4マトリクスとUIアクセス経路を追記。Browser/PWAはDocumentsガジェット経由でTXT/MD読込・書出+印刷、ElectronはFile メニューでHTML含む全形式対応。実態とUIが一致していることを確認。

### Goal（目的）

- Browser/PWA と Electron で何が可能かを明文化し、仕様・UI・実装のズレをなくす

### Background / Problem（背景・問題）

- 仕様書では `.txt/.md` の import/export や HTML export が一律に利用可能なように見える
- しかしブラウザ側 `PrintSettings` ガジェットは実質 `TXTエクスポート + 印刷` のみ
- HTML/Markdown エクスポートは Electron メニュー側に寄っており、利用可能条件が仕様に落ちていない

### Scope（作業範囲）

- 対応マトリクスを仕様へ追記
- Browser/PWA と Electron の差分を明記
- UI 側で未対応機能を見せない、または実装を追加して仕様へ揃える
- 必要なら README とヘルプも更新

### DoD（受入基準）

- [ ] 形式ごとの import/export 可否がプラットフォーム別に明文化されている
- [ ] Browser/PWA で見える UI が実際の対応範囲と一致している
- [ ] Electron のみ対応の機能は、その前提がユーザーに伝わる
- [ ] 少なくとも `\.txt`, `\.md`, `\.html`, `印刷/PDF` の扱いが文書上で曖昧でない

### Evidence（根拠）

- `docs/APP_SPECIFICATION.md`
- `js/gadgets-print.js`
- `js/electron-bridge.js`

### Agent Notes（着手メモ）

- 実装追加で揃えるか、仕様縮小で揃えるかは issue 内で判断してよい
- ただし最終的には「ユーザーから見た契約」が一意であること

---

## 5) ~~プラグイン機能を正式仕様へ昇格し、実装済み機能として整理する~~ ✅ 解決済み (2026-03-16)

> **解決**: APP_SPECIFICATION.md のプラグインセクションを拡充。4つの実装済みAPI (gadgets/themes/storage/events)、2つの登録パターン (ZWPlugin正規API / ZenWriterPlugins簡易レジストリ)、セキュリティ制約、将来予定5項目を明記。PLUGIN_GUIDE.md にコード例と登録パターン説明を追加。

### Goal（目的）

- 既存のローカルプラグイン機能を「隠れ実装」ではなく、正式な機能として整理する

### Background / Problem（背景・問題）

- 実装には manifest 駆動のローカルプラグインローダーがある
- しかし主要仕様書では「未実装」扱いのままで、認識が分裂している
- その結果、利用者・保守者ともに「使ってよい機能なのか」「どこまで保証するのか」が不明

### Scope（作業範囲）

- プラグイン機能のサポート範囲を定義
- `docs/APP_SPECIFICATION.md` と `README.md` へ反映
- `docs/PLUGIN_GUIDE.md` との役割分担を明確化

### DoD（受入基準）

- [ ] 主要仕様書でプラグイン機能の存在が明記されている
- [ ] 「Trusted local plugins only」などの制約が仕様に反映されている
- [ ] 実装済み範囲と将来予定（remote plugin / sandbox 等）が区別されている
- [ ] 関連ドキュメントの導線が整理されている

### Evidence（根拠）

- `js/plugin-manager.js`
- `js/plugin-api.js`
- `js/plugins/manifest.json`
- `docs/PLUGIN_GUIDE.md`
- `docs/APP_SPECIFICATION.md`

### Agent Notes（着手メモ）

- 実装を拡張する issue ではなく、まず「現状何が使えるか」を明文化する issue
- セキュリティ制約は曖昧にせず明記すること

---

## 6) ~~README / 関連ドキュメントの死リンクと欠落文書を整理する~~ ✅ 解決済み (2026-03-16)

> **解決**: 死リンク5件を除去/差し替え。関連ドキュメントをカテゴリ分類。開発ロードマップをROADMAP.md参照に簡素化。本文中のDESIGN.md参照をARCHITECTURE.mdに修正。

### Goal（目的）

- README を入口文書として正常化し、参照先が存在しない状態を解消する

### Background / Problem（背景・問題）

- README から `docs/DESIGN.md`, `docs/USER_GUIDE.md`, `docs/PROJECT_HEALTH.md`, `docs/SNAPSHOT_DESIGN.md`, `docs/KNOWN_ISSUES.md` など、現状存在しない文書へリンクしている
- AI エージェントや人間が README を起点に読むと、探索コストと誤認が増える

### Scope（作業範囲）

- README の関連ドキュメント一覧を棚卸し
- 存在しない文書への参照を削除・差し替え・新規作成のいずれかで整理
- 必要なら `docs/README.md` も併せて整理

### DoD（受入基準）

- [ ] README から参照している主要文書がすべて存在する、または妥当な代替先に置き換わっている
- [ ] 「将来作成予定」の文書を現在の入口文書に混ぜない
- [ ] 新規作成した場合は最低限の役割説明がある

### Evidence（根拠）

- `README.md`
- `docs/README.md`

### Agent Notes（着手メモ）

- 単にリンクを消すだけでなく、「今このプロジェクトで読むべき文書の導線」を最適化すること
- 作成コストが高い文書は、まず代替先へのリンクへ差し替えてもよい

---

## 7) ~~仕様差分の再発防止として、文書の SSOT と更新責務を決める~~ ✅ 解決済み (2026-03-16)

> **解決**: docs/README.md に「文書役割の定義」セクションを新設。5分類(現行仕様/将来計画/個別仕様/実装ガイド/設計探索)の役割・SSOT・書くべきもの/書かないものを定義。変更種別ごとの更新対象マトリクス追加。4原則（実装コードが唯一の真、将来予定はROADMAP集約、設計と仕様の分離、重複削減）を明文化。

### Goal（目的）

- 今回のような「実装は進んでいるが仕様書が古い」状態を再発しにくくする

### Background / Problem（背景・問題）

- `APP_SPECIFICATION`, `ROADMAP`, `README`, `GADGETS` がそれぞれ別の時点の事実を持っている
- 現状では「どの文書が現行仕様の基準か」が明確でない

### Scope（作業範囲）

- 各文書の役割を定義
- 実装変更時に更新必須の文書を明記
- 必要なら README または docs index に運用ルールを追記

### DoD（受入基準）

- [ ] 各主要文書の役割が定義されている
- [ ] 「現行仕様」「将来計画」「実装ガイド」の境界が明文化されている
- [ ] 実装変更時にどの文書を更新すべきか判断できる

### Evidence（根拠）

- `README.md`
- `docs/APP_SPECIFICATION.md`
- `docs/ROADMAP.md`
- `docs/GADGETS.md`

### Agent Notes（着手メモ）

- 文書を増やしすぎるより、役割の重複を減らすことを優先する
- 「SSOT をどれにするか」より「何をどこに書かないか」を決めると整理しやすい
