## Why
- Sidebarとガジェットのプレゼンテーション（ボタン/タブ/ドロップダウン/アコーディオン）を統一的に切替可能にして、UIの拡張性を高めたい。
- 情報設計を強化するため、Wiki（用語集）とノードグラフ（関係図）を中核機能として追加したい。
- 既存設定（タイプライター/スナップショット/プレビュー）をガジェット化し、配置・拡張を容易にしたい。
- 将来的に複数パネル/複数エディタを柔軟に配置できるアーキテクチャへ拡張したい。

## What Changes
- ADDED: Modular Tabs Presentation（buttons|tabs|dropdown|accordion）設定（UI Settings）
- ADDED: Wiki 機能（ページCRUD・タグ/フォルダ・AI生成フック）
- ADDED: Node Graph 機能（nodes/edges スキーマ・SVGエッジ・ドラッグ移動・パネルビュー）
- ADDED: Gadget: Typewriter / Snapshot Manager / Markdown Preview / UI Settings / Font Decoration / Text Animation
- MODIFIED: Gadgets loadout 適用時に手動グループ割当を上書きしない
- ADDED: Panels 拡張の叩き台（将来の複数サイドバー/フローティング/サイズ変更の要求を仕様化）
- ADDED: Editor: Typewriter モード復旧と設定適用
- ADDED: Help as Wiki（機能仕様をWiki形式で参照可能に）

## Impact
- Affected specs: ui, gadgets, wiki, nodegraph, panels, editor, help
- Affected code: index.html, js/app.js, js/editor.js, js/gadgets.js, js/panels.js, js/storage.js, js/wiki.js, js/nodegraph.js, js/gadgets-editor-extras.js
- Tests: 既存E2E(editor-settings)の維持＋将来E2E(ガジェット/プレゼンテーション/ノード/ウィキ)追加
