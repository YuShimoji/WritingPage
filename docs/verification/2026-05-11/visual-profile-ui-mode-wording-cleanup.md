# VisualProfile stale UI-state wording cleanup

Date: 2026-05-11

## Scope

- `docs/VISUAL_PROFILE.md` を、公開 UI 状態切替ではなくテーマ・背景・フォント・余白・本文表示・作業シーンの一括適用として再同期。
- `profile.uiMode` は legacy/internal compatibility field として残す。
- `js/visual-profile.js` は comment / JSDoc のみ同期。

## Non-scope

- Runtime API、profile schema、built-in profile、ユーザー保存導線、storage、UI 表示は変更しない。
- `docs/VISUAL_PROFILE.md` 以外の historical Focus / Normal docs はこの slice では触らない。

## Verification

- `node --check js/visual-profile.js` -> pass
- `node -e "JSON.parse(require('fs').readFileSync('docs/spec-index.json','utf8'))"` -> pass
- `git grep -n "表示モード\\|UIモード\\|settings.viewMode\\|ZenWriterUI.setViewMode" -- docs/VISUAL_PROFILE.md js/visual-profile.js` -> no matches
- `git diff --check` -> pass
