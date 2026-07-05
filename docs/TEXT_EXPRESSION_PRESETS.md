# Text Expression Preset Catalog

This catalog is the review-facing registry for special text displays. The code authority remains the runtime dictionaries and renderer modules, but this file records the intended semantics so Reader/Editor parity reviews do not have to infer meaning from screenshots.

## Rendering Contract

| Layer | Code authority | Review rule |
| --- | --- | --- |
| Textbox preset IDs | `js/modules/editor/TextboxPresetRegistry.js` | Preset IDs are author-facing shorthand. Keep their default meaning stable. |
| Preset expansion | `js/modules/editor/TextExpressionPresetResolver.js` | `preview`, `reader`, and `wysiwyg` use the same preset meaning unless a future spec explicitly says otherwise. |
| HTML projection | `js/modules/editor/TextboxEffectRenderer.js` | The renderer emits `.zw-textbox`, `data-preset`, `data-role`, and transform styles. |
| Rich/Markdown bridge | `js/modules/editor/TextboxRichTextBridge.js` | WYSIWYG round-trip preserves the DSL and preset name. |
| Reader preview | `js/reader-preview.js`, `js/zw-postmarkdown-html-pipeline.js` | Reader is a read-only review surface, not a second preset implementation. |

## Built-In Textbox Presets

| ID | Category | Default semantics | Transform | Status / review note |
| --- | --- | --- | --- | --- |
| `dialogue` | Standard semantic | Plain dialogue box with accent left border and no animation layer. | `rotate(0deg) scale(1)` | Baseline comparison fixture for normal text box display. |
| `monologue` | Standard semantic | Inner-description / monologue box using italic, fade-in, soft ornament, and a quieter frame. | `rotate(0deg) scale(0.98)` | Default inner-description display. It must not imply instability by default. |
| `tilted-monologue` | Experimental semantic | Same inner-description layers as `monologue`, but explicitly tilted. | `rotate(-2deg) scale(0.98)` | Opt-in evidence for intentionally unstable inner voice. Do not treat it as the default monologue. |
| `inner-voice` | Legacy compatibility | Older inner voice shorthand with stronger tilt. | `rotate(-4deg) scale(0.98)` | Kept for existing content and legacy fixtures; review as legacy-strong, not the default semantic monologue. |
| `narration` | Standard semantic | Quieter narration block with mono ornament. | `rotate(0deg) scale(0.95)` | Prose/narration emphasis without dialogue framing. |
| `chant` | Standard semantic | Bold outline, shake animation, burst ornament, centered emphasis. | `rotate(0deg) scale(1.05)` | High-emphasis fantasy/chant display. |
| `warning` | Standard semantic | Bold warning block with shake and burst ornament. | `rotate(2deg) scale(1.02)` | System/warning display; tilt is part of the warning cue. |
| `typing-sequence` | Legacy / system | Monospace typing sequence with type animation and mono ornament. | `rotate(0deg) scale(1)` | Motion drops under reduced-motion rules. |
| `se-animal-fade` | Legacy / SFX | Black outline, shake/fade, burst ornament, SFX marker. | `rotate(0deg) scale(1)` | Legacy SFX example. |

## Inline Effects

| ID group | Runtime source | Meaning |
| --- | --- | --- |
| `bold`, `italic`, `underline`, `strike` | `TextEffectDictionary` | Basic text decoration classes. `strike` maps to `.decor-strikethrough` and must remain visible in Reader preview. |
| `smallcaps`, `light`, `shadow`, `black`, `outline`, `glow`, `wide`, `narrow` | `TextEffectDictionary` | Static style accents. Review for readability, not animation. |
| `uppercase`, `lowercase`, `capitalize` | `TextEffectDictionary` | Case transforms. Use carefully for Japanese mixed text. |

## Animation / Ornament Dictionary

| Group | Runtime source | Meaning |
| --- | --- | --- |
| `fade`, `slide`, `type`, `pulse`, `shake`, `bounce`, `fadein` | `TextAnimationDictionary` | Animation classes. All current entries drop under reduced-motion. |
| `wave`, `sparkle`, `cosmic`, `fire`, `glitch` | `TextAnimationDictionary` textures | Text texture classes, not textbox presets. |
| `soft`, `burst`, `mono` | `TextOrnamentDictionary` | Box-level static ornament classes used by textbox presets. |

## Review Defaults

- Default monologue evidence should compare `dialogue` vs `monologue`; `monologue` is now an upright, quiet inner-description box.
- Tilt evidence should name `tilted-monologue` or use an explicit `tilt:` DSL attribute.
- `inner-voice` remains valid legacy content but should not be used as the canonical current inner-description sample.
- Full showcase `16` and `19` intentionally include `dialogue`, `monologue`, and `tilted-monologue` so reviewers can distinguish default parity from explicit tilt.
