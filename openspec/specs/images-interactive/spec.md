# images-interactive Specification

## Purpose
画像のインタラクティブ制御機能を定義する。プリセット選択、パラメータ調整、ホバー操作を規定（将来実装予定）。
## Requirements
### Requirement: Interactive Image Controls
The system SHALL provide interactive controls and presets for images, including VN-oriented behavior.

#### Scenario: Preset selection
- WHEN user chooses a preset (e.g., VN/CG style)
- THEN image parameters apply (size, alignment, opacity, filters)

#### Scenario: Fine-grained controls
- WHEN user adjusts numeric parameters
- THEN changes apply immediately and persist per image

#### Scenario: Hover interactions
- WHEN user hovers over an image overlay
- THEN interactive handles and toggles appear

