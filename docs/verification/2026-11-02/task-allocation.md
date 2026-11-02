# WritingPage 2026-11-02 分担表

## 共通の入力と完了条件

- 元分析 chat: `01a19a01-0a64-76e0-a37e-87ec77d7b217`。今回の分担元: `01a19aa5-7ce5-7a41-bdee-3aacb6c9c917`。
- 添付ログの無加工コピー: [task-allocation-source.txt](task-allocation-source.txt)。担当別の依頼文は `docs/ai/prompts/writingpage-*-20261102.md`。
- 開始時点: `main == origin/main == 99c626998a27d0ece2f2355a5596a581b42936b8`。製品の4件修正は再統合しない。10月候補全体・別branch docsを一括採用しない。
- 共通条件: 同じ checkout を共有し、担当パスのみ編集・stage。branch切替/reset/stash/force pushなし。本人の原稿を試験に使用せず、GUIはCI/package担当だけが占有。時間は期限ではない。外部公開・配布・通常起動先の切替なし。

## 担当と依存

| 担当 | 種別・モデル | 範囲と成果 | 依存・終了条件 |
|---|---|---|---|
| 親（このチャット） | 独立作業チャット。モデル指定不可のため既定設定で起動 | 分担計画・進捗統合・開始前記録 | CI/package担当の先行成果をWiki担当へ接続。各成果・clean/占有終了を確認 |
| CI / Electron package | 独立チャット、本人希望 `GPT-6 Luna / low` を指定依頼。指定可否・実値はチャット起動結果で確認 | release readiness exact CI binding、別出力先の新候補、app.asar identity、隔離profileで保存・再起動・4件回帰の技術確認。所有: `scripts/release-readiness-checkpoint.js`, `scripts/release-readiness-lib.js`, 必要最小限のpackage scripts / `electron/main.js`, 対応test、`docs/verification/2026-11-02/ci-package-verification.md`、先行担当中の `docs/CURRENT_STATE.md` live block | 本担当の開始前commit後に書込開始。source/成功CI/exe/asar/profileの同一性、4件個別結果。通常commit/push。GUI/Git/編集占有終了しWikiへ渡す |
| Rich候補比較 | 独立チャット、本人希望 `GPT-6 Luna / low` を指定依頼。指定可否・実値は起動結果で確認 | 固定SHAを読み取り専用で比較。報告のみ、ファイル・Git・GUI変更なし | 即時並行。候補2 branchの差、重複、4修正との関係、採否順位・focused next workを根拠付きで返却 |
| Story Wiki要件 | 独立チャット、本人希望 `GPT-6 Luna / low` を指定依頼。指定可否・実値は起動結果で確認 | title uniqueness / category add UIと保存復帰。所有: `js/story-wiki.js`、Wiki専用CSS、focused E2E、Wiki仕様・直接関連資料、検証記録 | CI/package担当の固定候補・占有終了後に編集開始。先行担当の候補へWikiが含まれないことを明示。focused挙動・狭幅画面・保存復帰、通常commit/push |

## 着手時の見込み

親の担当表commit後からCI/Electron候補の技術証跡まで約1〜3時間。根拠は既存toolingの差分レビュー、回帰テスト、CI再実行待ち、Electron build・隔離profileの再起動確認を含む。最初の環境確認ではGitHub CLI認証あり、Node `v22.19.0`、npm `10.9.3`、Electron CLIはPATH上で未検出。CI wait・Electronの起動経路が未確定なので実run/実機制御の判明時に更新し、時間で打切らない。

Rich比較は材料が揃い次第15〜25分目安で報告。Wiki実装は先行担当完了後に見込みを提示し、最初の10〜20分で仕様/API/既存UIを調べてUIラフ要否と再見積を返す。大きな配置変更が必要な場合はチャットに完成想定ラフを提示してから組み立てる。

## 作業開始記録（親commit後に解禁）

- 割当記録commit: pending
- CI/package担当: 先行実行。実行開始後、担当thread IDと開始時刻、モデル指定の成否、編集許可を追記する。
- Rich比較: 読み取り専用のため並行開始可。担当thread IDとモデル指定結果を追記する。
- Wiki: CI担当の候補固定・占有終了まで読み取り専用。thread IDと依存handoffを追記する。
