# ui-design-gradient Specification

## Purpose
UIDesignガジェットによる背景グラデーション制御を定義する。線形/放射、角度、色、強度の設定と永続化を規定。
## Requirements
### Requirement: UI Background Gradient Control Gadget
 The system MUST provide a gadget that allows users to control the application background gradient (linear/radial, angle, two colors, intensity).
 アプリは背景グラデーションをガジェットから制御できる機能を提供しなければならない（線形/放射、角度、2色、強度）。

#### Scenario: Enable linear gradient
- WHEN ユーザーが UIDesign ガジェットで「有効化」をONにし、角度=135°, 色=c1/c2, 強度=0.35 を設定
- THEN `--app-bg-gradient` が `linear-gradient(135deg, rgba(c1,0.35) 0%, rgba(c2,0.35) 100%)` に更新され、`body` に適用される

#### Scenario: Persist settings
- WHEN ページを再読み込み
- THEN 設定は `settings.ui.bgGradient` から復元され、同じ見た目が再現される

#### Scenario: Disable gradient
- WHEN ユーザーが有効化をOFFにする
- THEN `--app-bg-gradient` は `none` となり、背景は従来通りの `--app-bg` のみでレンダリングされる

