# PROMPT_TEMPLATES — 作業依頼/再開テンプレ

この文書は、作業依頼や再開時の入力（プロンプト）を標準化し、ワークフロー不整合を減らすためのテンプレート集です。

## 1) 自律実行（Assume Yes / Tier 1）テンプレ

```text
⏩作業継続

目的:
- <何を達成したいか>

前提/SSOT:
- SSOT は AI_CONTEXT.md。
- OpenSpec 変更の場合は openspec validate --strict を前提にする。

やってよいこと:
- 影響範囲が Tier 1（ドキュメント/軽微な整理/CI設定/テスト強化など）なら確認不要で進めてよい。

やってはいけないこと:
- 破壊的変更・本番相当の影響・仕様追加（Tier 2/3 相当）は、必ず Issue/PR 単位にし、判断が必要なら停止して質問する。

完了条件:
- <テスト/validate を含めたDoD>

中断可能点:
- <PR 作成直後 / CI 成功後 など>

追加情報:
- <関連Issue/PR、再現手順、スクショ等>
```

## 2) OpenSpec 変更の適用（/openspec-apply）テンプレ

```text
/openspec-apply

Change ID:
- <openspec/changes/<id>>

期待する成果:
- <実装内容>

検証:
- openspec validate --strict --no-interactive
- npm test

注意:
- 仕様差分（spec delta）以外の変更は最小化。
- ドキュメントは SSOT を優先し、重複は避ける。
```

## 3) OpenSpec アーカイブ（/openspec-archive）テンプレ

```text
/openspec-archive

対象 Change ID:
- <id1>
- <id2>

条件:
- change の tasks が完了していること（未完了ならアーカイブせず停止して相談）。

手順:
- openspec validate --strict --no-interactive
- openspec archive <id> -y
- openspec validate --strict --no-interactive
- npm test

出力:
- PR を作成し、Summary / Archived IDs / Verification を記載。
```

## 4) バージョン整合（VERSION / package.json）テンプレ

```text
目的:
- VERSION と package.json の version を一致させ、リリース運用の SSOT を保つ。

手順:
- VERSION と package.json を確認
- どちらを SSOT とするか docs/RELEASE.md / docs/BRANCHING.md に従って調整
- npm test

完了条件:
- VERSION と package.json の一致
- CI green
```
