# Text Expression Tier 1 実装メモ

## 実装方針

- parser は DSL parse / serialize に集中
- renderer は projection に集中
- WYSIWYG 差分は bridge で吸収
- inline effect / animation / ornament は辞書で分離

## 今回の接続点

- preview:
  - `js/editor-preview.js`
- WYSIWYG:
  - `js/editor-wysiwyg.js`
- settings:
  - `js/storage.js`
- preset button:
  - `js/app-editor-bridge.js`

## TODO

- block ornament の専用辞書と editor UI
- nested textbox の backlog UI 強化
- preset editor UI で textEffects / animations / ornaments を編集可能にする
