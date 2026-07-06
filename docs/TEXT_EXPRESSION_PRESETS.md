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

| ID | Category | Visual semantics | Surface | Status | Risk note |
| --- | --- | --- | --- | --- | --- |
| `dialogue` | Semantic textbox preset | Plain dialogue box with accent left border and no animation layer; `rotate(0deg) scale(1)`. | Mixed: WYSIWYG, MD preview, Reader | Core | Low layout risk; baseline fixture for ordinary boxed speech. |
| `monologue` | Semantic textbox preset | Upright inner-description box using italic, fade-in, soft ornament, and quieter frame; `rotate(0deg) scale(0.98)`. | Mixed: WYSIWYG, MD preview, Reader | Core | Slight scale and fade can affect rhythm, but it must not imply instability by default. |
| `tilted-monologue` | Semantic textbox preset | Same layers as `monologue`, but explicitly slanted; `rotate(-2deg) scale(0.98)`. | Mixed: WYSIWYG, MD preview, Reader | Experimental | Alters alignment and visual drift; opt-in only for unstable inner voice evidence. |
| `inner-voice` | Semantic textbox preset | Older strong inner voice shorthand with stronger tilt; `rotate(-4deg) scale(0.98)`. | Mixed: WYSIWYG, MD preview, Reader | Review-debt / legacy | Strong layout drift; keep for existing content, not for the canonical monologue sample. |
| `narration` | Semantic textbox preset | Quieter narration block with mono ornament; `rotate(0deg) scale(0.95)`. | Mixed: WYSIWYG, MD preview, Reader | Core | Scale can slightly compress reading rhythm. |
| `chant` | Semantic textbox preset | Bold outline, shake animation, burst ornament, centered emphasis; `rotate(0deg) scale(1.05)`. | Mixed: WYSIWYG, MD preview, Reader | Optional | Motion and enlargement can dominate nearby prose; reduced-motion drops animation. |
| `warning` | Semantic textbox preset | Bold warning block with shake and burst ornament; `rotate(2deg) scale(1.02)`. | Mixed: WYSIWYG, MD preview, Reader | Optional | Tilt and shake are intentional warning cues but disturb alignment. |
| `typing-sequence` | Semantic textbox preset | Monospace typing sequence with type animation and mono ornament; `rotate(0deg) scale(1)`. | Mixed: WYSIWYG, MD preview, Reader | Review-debt / legacy | Motion changes reading pace; reduced-motion must preserve readable text. |
| `se-animal-fade` | Semantic textbox preset | Black outline, shake/fade, burst ornament, SFX marker; `rotate(0deg) scale(1)`. | Mixed: WYSIWYG, MD preview, Reader | Review-debt / legacy | SFX styling and motion can overpower normal manuscript review. |

## Inline Effects

| ID group | Category | Surface | Status | Risk note |
| --- | --- | --- | --- | --- |
| `bold`, `italic`, `underline`, `strike` | Basic inline decoration | Mixed: WYSIWYG, MD preview, Reader | Core | Low risk; `strike` maps to `.decor-strikethrough` and must remain visible in Reader preview. |
| `smallcaps`, `light`, `shadow`, `black`, `outline`, `glow`, `wide`, `narrow` | Static inline accent | Mixed: WYSIWYG, MD preview, Reader | Optional | Can affect readability, weight, or line length; review in body-sized text. |
| `uppercase`, `lowercase`, `capitalize` | Inline case transform | Mixed: WYSIWYG, MD preview, Reader | Optional | Can change Japanese mixed-text legibility and semantic tone. |

## Animation / Ornament Dictionary

| Group | Category | Surface | Status | Risk note |
| --- | --- | --- | --- | --- |
| `fade`, `slide`, `type`, `pulse`, `shake`, `bounce`, `fadein` | Animation layer | Mixed: WYSIWYG, MD preview, Reader | Optional | Motion changes reading rhythm; all current entries drop under reduced-motion. |
| `wave`, `sparkle`, `cosmic`, `fire`, `glitch` | Text texture layer | Mixed: WYSIWYG, MD preview, Reader | Experimental | Strong visual styling can become genre language if reused as a default. |
| `soft`, `burst`, `mono` | Box ornament layer | Mixed: WYSIWYG, MD preview, Reader | Optional | Static box decoration; review density and contrast around long prose. |

## Exceptional Blocks And Inline Markup

| ID / syntax | Category | Visual semantics | Surface | Status | Risk note |
| --- | --- | --- | --- | --- | --- |
| `:::zw-typing` | Block expression | Typewriter reveal with speed/mode attributes and an always-readable full text fallback. | Mixed: WYSIWYG, MD preview, Reader | Optional | Motion directly controls reading pace; click/scroll modes need explicit review. |
| `:::zw-dialog` | Block expression | Character/speaker dialog card with position, bubble/border/transparent styles, and optional icon. | Mixed: WYSIWYG, MD preview, Reader | Optional | Adds layout framing and avatar/icon weight; can shift manuscript tone. |
| `:::zw-scroll` | Block expression | Scroll-triggered reveal with fade/slide/zoom variants. | Mixed: WYSIWYG, MD preview, Reader | Experimental | Depends on viewport and scroll timing; reduced-motion must keep content visible. |
| `:::zw-pathtext` | Block expression | SVG path text following a curve/path. | Mixed: WYSIWYG, MD preview, Reader | Experimental | Alters line flow and selection expectations; use as an opt-in display feature. |
| `{base|reading}` / legacy ruby notation | Inline annotation | Ruby annotation rendered as `<ruby><rt>...`. | Mixed: WYSIWYG, MD preview, Reader | Core | Affects line height and vertical rhythm; hidden-rt settings change review appearance. |
| `{kenten|text}` | Inline annotation | Kenten emphasis dots over target text. | Mixed: MD preview, Reader, WYSIWYG support controls | Optional | Changes emphasis density and can clash with ruby/vertical text review. |

## Review Defaults

- Default monologue evidence should compare `dialogue` vs `monologue`; `monologue` is now an upright, quiet inner-description box.
- Tilt evidence should name `tilted-monologue` or use an explicit `tilt:` DSL attribute.
- `inner-voice` remains valid legacy content but should not be used as the canonical current inner-description sample.
- Full showcase `16` and `19` intentionally include `dialogue`, `monologue`, and `tilted-monologue` so reviewers can distinguish default parity from explicit tilt.
