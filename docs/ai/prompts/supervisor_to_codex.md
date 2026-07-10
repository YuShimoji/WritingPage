# Supervisor to Codex Outcome Package

監修側が Codex へ渡す Prompt の正本。コマンド単位の細切れ指示ではなく、
1つのユーザー成果を完成させる package として使う。角括弧を埋め、不要な節は
削除する。長い禁止事項リストを足す代わりに、実際の hard stop だけを書く。

```text
# Outcome
[完了時にユーザーの作業・判断がどう変わるかを1〜3文]

# Why now / current evidence
- bottleneck: [今の進行を止めている一点]
- current state: [commit / CURRENT_STATE live block / UI evidence]
- useful references: [必要なファイルだけ]

# Outcome slice
次の最大3件を、1つの成果として完了する:
1. [主変更]
2. [主変更に不可欠な関連修正。なければ削除]
3. [検証・可視化・運用接続。なければ削除]

# Autonomy envelope
- Codex may decide: [可逆な実装詳細、関連テスト、局所コピー、内部構成など]
- Codex owns: 調査、実装、関連修正、ローカル検証、CURRENT_STATE live block更新、通常のcommit/push
- do not stop for: 軽微な報告、ファイル単位の確認、既に示した同一承認

# Implementation decision gate
[NONE、または方向選択が必要な場合だけ記載]
- compare before build: [layout / language / color / type / motion / content など]
- routes required: 2〜4案と推奨1案
- choosing a route means: このpackage内の範囲で実装承認

# Hard stops
破壊的変更、依存追加、DB/auth/API契約変更、不可逆な外部公開、仕様衝突だけで停止する。
[今回固有の停止条件があれば追加]

# Acceptance and evidence
- [観測できる完了条件]
- [focused test / build / screenshot / readback]
- product behaviorを変えた場合は関連spec/registryも同期する

# Closeout
- CURRENT_STATEは履歴追記ではなくlive blockを置換する
- 外部statusは手動二重更新せず、構成済みの自動projectionで反映する
- 完了報告は、成果・workflowへの効果・証拠・残る判断・意味の違う次の入口を自然文で示す
```

## 監修側の運用

- 同じ outcome の続きは新しい Prompt に分割せず、この package の evidence または
  steering delta として追記する。
- backlog候補を選んだだけなら調査承認に留める。上の implementation decision gate で
  routeを選んだ場合は、その範囲の実装まで承認済みとする。
- 主観性が高い成果物を完成形で突然出さない。比較は低コストで先に行い、選択後に
  buildする。
- Review後の好み修正はまとめて1 batchにする。2回収束しなければ、3回目の微修正を
  指示せず方向比較へ戻す。
