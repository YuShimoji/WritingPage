# Runtime State 窶・Zen Writer

> 譛邨よ峩譁ｰ: 2026-03-30 session 35

## 迴ｾ蝨ｨ菴咲ｽｮ

- 繝励Ο繧ｸ繧ｧ繧ｯ繝・ Zen Writer (WritingPage)
- 繝舌・繧ｸ繝ｧ繝ｳ: v0.3.32
- 繝悶Λ繝ｳ繝・ main
- 繧ｻ繝・す繝ｧ繝ｳ: 35
- 荳ｻ繝ｬ繝ｼ繝ｳ: Advance (WP-001 UI 逎ｨ縺堺ｸ翫￡繝ｻ鞫ｩ謫ｦ霆ｽ貂・
- 繧ｹ繝ｩ繧､繧ｹ: WP-001 谺｡繧ｹ繝ｩ繧､繧ｹ驕ｸ螳・(Reader 繝｢繝ｼ繝峨せ繧､繝・メ邨ｱ蜷・done)

---

## 繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ

| 謖・ｨ・| 蛟､ | 蜑榊屓 |
| ---- | --- | ---- |
| 繧ｻ繝・す繝ｧ繝ｳ逡ｪ蜿ｷ | 35 | 34 |
| 繧ｬ繧ｸ繧ｧ繝・ヨ謨ｰ | 28 | 28 |
| spec-index 繧ｨ繝ｳ繝医Μ | 55 | 55 |
| spec done | 43 | 42 |
| spec partial | 1 (SP-005) | 2 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl 繝輔ぃ繧､繝ｫ | 107 | 107 |
| CSS 繝輔ぃ繧､繝ｫ | 4 | 4 |
| E2E spec 繝輔ぃ繧､繝ｫ | 65 | 63 |
| E2E passed | 483 | 542 |
| E2E failed | 0 | 0 |
| E2E skipped | 3 | 3 |
| 讀懆ｨｼspec | 3 (sp081-*.spec.js) | 0 |
| TODO/FIXME/HACK | 0 | 0 |
| mock 繝輔ぃ繧､繝ｫ | 0 | 0 |

---

## 驥冗噪謖・ｨ・(GPS)

| 謖・ｨ・| 蛟､ |
| ---- | --- |
| 菴馴ｨ捺・譫懃黄 | 90% |
| 蝓ｺ逶､ | 93% |
| 谿・partial | SP-005(75%) |
| IDEA POOL open | 1 (WP-001 逹謇倶ｸｭ: UI逎ｨ縺堺ｸ翫￡繝ｻ鞫ｩ謫ｦ霆ｽ貂・ |
| IDEA POOL done | 2 (WP-002, WP-003) |
| 險ｭ險郁ｪｲ鬘・open | 0 (Q1-Q4 蜈ｨ隗｣豎ｺ) |
| 繝薙ず繝･繧｢繝ｫ逶｣譟ｻ open | V-2/V-3/V-4: 隗｣豸郁ｦ玖ｾｼ縺ｿ (session 26 Visual Audit 縺ｧ譁ｰ隕丞撫鬘後↑縺・ |

---

## 繝薙ず繝･繧｢繝ｫ逶｣譟ｻ霑ｽ霍｡

| 謖・ｨ・| 蛟､ |
| ---- | --- |
| blocks_since_visual_audit | 0 (session 35 縺ｧ螳滓命) |
| last_visual_audit_path | e2e/visual-audit-screenshots/ (20譫・ 2026-03-30 session 35) |
| visual_evidence_status | fresh |

---

## 閾ｪ蟾ｱ險ｺ譁ｭ繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ

| 險ｺ譁ｭ鬆・岼 | 騾｣邯壽焚 |
| --------- | ------- |
| Q4 No (謌先棡迚ｩ譛ｪ蜑埼ｲ) | 1 (session 35 縺ｯ Audit 縺ｮ縺ｿ) |
| Q6a No (蝓ｺ逶､譛ｪ迯ｲ蠕・ | 0 (Visual Audit 螳滓命) |
| Q6b No (繝ｦ繝ｼ繧ｶ繝ｼ蜿ｯ隕門､牙喧縺ｪ縺・ | 1 (session 35 縺ｯ Audit 縺ｮ縺ｿ) |
| 菫晏ｮ医Δ繝ｼ繝蛾｣邯・| 0 (Audit 螳滓命) |

---

## Session 35 螳滓命蜀・ｮｹ

### Visual Audit (Audit)
- git pull 縺ｧ origin/main 縺ｫ蜷梧悄 (session 33-34 縺ｮ 7 繧ｳ繝溘ャ繝亥叙霎ｼ縺ｿ)
- Visual Audit 20/20 passed (e2e/visual-audit-screenshots/ 縺ｫ 20 譫壽峩譁ｰ)
- 繝｢繝ｼ繝牙・譖ｿ + 遶邂｡逅・+ 繧ｵ繧､繝峨ヰ繝ｼ E2E: 18/18 passed (chapter-list, ui-mode-switch, ui-regression, sidebar-writing-focus)
- 譁ｰ隕・UI 繝舌げ: 縺ｪ縺・- 隕ｳ蟇・ 繧ｵ繝ｳ繝励Ν繝峨く繝･繝｡繝ｳ繝郁ｪｭ霎ｼ繝・せ繝・(09-11) 縺ｯ chapterMode 蠑ｷ蛻ｶ縺ｫ繧医ｊ遨ｺ迥ｶ諷九〒繧ｭ繝｣繝励メ繝｣ (繝・せ繝亥刀雉ｪ蝠城｡後√い繝励Μ繝舌げ縺ｧ縺ｯ縺ｪ縺・

---

### WP-001 hidden UI cleanup (Advance)
- index.html: hidden `#ui-mode-select` は残置しつつ、UI mode の依存先から外した
- app.js: `setUIMode()` の旧 select 同期を削除し、モード状態を `data-ui-mode` / visible mode buttons に集約
- command-palette.js: UI モード変更の fallback を hidden select から `.mode-switch-btn[data-mode]` click に変更
- 検証: `npx eslint js/app.js js/command-palette.js`
- 検証: 一時 Playwright spec で command palette の `focus -> normal` round-trip を確認 (1 passed)

## Session 34 螳滓命蜀・ｮｹ
### SP-081 繧ｳ繝溘ャ繝域紛逅・+ S4/persist 蛻・ｊ蛻・￠
- session 33 縺ｮ譛ｪ繧ｳ繝溘ャ繝亥､画峩繧・繧ｳ繝溘ャ繝・(螳溯｣・docs) 縺ｫ蛻・牡
- S4/persist NG: 繝・せ繝医せ繧ｯ繝ｪ繝励ヨ縺ｮ菫晏ｭ倥く繝ｼ繝代せ隱､繧・(s.ui.sidebarOpen vs s.sidebarOpen)縲ょｮ溯｣・・豁｣蟶ｸ
- project-context.md 縺ｮ done 莉ｶ謨ｰ菫ｮ豁｣ (42竊・3)縲〉untime-state.md 繝倥ャ繝繝ｼ譖ｴ譁ｰ
### WP-001 UI 逎ｨ縺堺ｸ翫￡ 窶・Reader 繝｢繝ｼ繝峨せ繧､繝・メ邨ｱ蜷・(Advance)
- index.html: mode-switch 縺ｫ Reader 繝懊ち繝ｳ (data-mode="reader", book-open 繧｢繧､繧ｳ繝ｳ) 霑ｽ蜉
- app.js: mode-switch-btn 繧ｯ繝ｪ繝・け繝上Φ繝峨Λ縺ｧ Reader enter/exit 繧貞他縺ｳ蛻・￠
- app.js: aria-pressed 繧貞・3繝懊ち繝ｳ (Normal/Focus/Reader) 縺ｧ蜷梧悄
- reader-preview.js: exitReaderMode 縺ｫ targetMode 蠑墓焚霑ｽ蜉縲∝虚逧・・繧ｿ繝ｳ逕滓・繧貞炎髯､
- css/style.css: return-bar z-index 200竊・500 (繝・・繝ｫ繝舌・繧｢繧､繧ｳ繝ｳ縺ｨ縺ｮ驥阪↑繧願ｧ｣豸・
- E2E: 34 passed (繝｢繝ｼ繝蛾未騾｣)縲・3 passed / 1 failed (wiki: 譌｢遏･荳榊ｮ牙ｮ・ / 1 skipped

---

## Session 30 螳滓命蜀・ｮｹ

### SP-081 繧ｨ繝・ぅ繧ｿ菴馴ｨ灘・讒狗ｯ・Phase 1 (Advance + Excise)
- chapter-list.js: Phase 1 (heading-based) 遶邂｡逅・ｒ蜈ｨ蜑企勁縲…hapterMode 荳譛ｬ蛹・(-254陦・
- chapter-store.js: migrateToChapterMode/revertChapterMode 蜑企勁縲‘nsureChapterMode 霑ｽ蜉
- app.js: setUIMode 縺ｫ繧ｨ繝・ず繝帙ヰ繝ｼ迥ｶ諷九け繝ｪ繧｢ + 繧ｵ繧､繝峨ヰ繝ｼ迥ｶ諷狗ｮ｡逅・+ 繝輔Ο繝ｼ繝・ぅ繝ｳ繧ｰ繝・・繝ｫ繝舌・髱櫁｡ｨ遉ｺ
- editor-wysiwyg.js: 繝輔Ο繝ｼ繝・ぅ繝ｳ繧ｰ繝・・繝ｫ繝舌・縺ｮ迥ｶ諷九ｒ data-visible 螻樊ｧ縺ｮ縺ｿ縺ｧ邂｡逅・- edge-hover.js: Focus 繝｢繝ｼ繝峨〒繧ｨ繝・ず繝帙ヰ繝ｼ繝偵Φ繝医ユ繧ｭ繧ｹ繝郁｡ｨ遉ｺ (2蝗櫁｡ｨ遉ｺ蠕瑚・蜍墓ｶ亥悉)
- app-file-manager.js: ensureChapterMode 縺ｫ蜿ら・螟画峩
- css/style.css: edge-hover-hint 繧ｹ繧ｿ繧､繝ｫ縲。lank 繝｢繝ｼ繝峨〒繝偵Φ繝磯撼陦ｨ遉ｺ
- e2e/chapter-list.spec.js: chapterMode 繝吶・繧ｹ縺ｫ蜈ｨ髱｢譖ｸ謠・(6/6 pass)
- e2e/content-guard.spec.js: API蜿ら・菫ｮ豁｣

### Session 29 霑ｽ蜉繧ｳ繝溘ャ繝・(BP-5 + 繧ｬ繧ｸ繧ｧ繝・ヨ cleanup + reader 邵ｦ譖ｸ縺・
- sidebar-manager.js: 繧｢繧ｳ繝ｼ繝・ぅ繧ｪ繝ｳ蜀榊・髦ｲ豁｢繝輔Λ繧ｰ (BP-5)
- gadgets-core.js: group 蜀・render 譎ゅ・繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・髢｢謨ｰ螳溯｡・- gadgets-themes.js / gadgets-typography.js: addCleanup API 蟇ｾ蠢・- reader-preview.js: 邵ｦ譖ｸ縺・讓ｪ譖ｸ縺阪ヨ繧ｰ繝ｫ
- index.html: 蛯咲せ繝懊ち繝ｳ + 邵ｦ譖ｸ縺阪ヨ繧ｰ繝ｫ繝懊ち繝ｳ

### Visual Audit
- 8譫壹・繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ: docs/verification/2026-03-29/
- Focus 繝｢繝ｼ繝・ 繝偵Φ繝医ユ繧ｭ繧ｹ繝域ｭ｣蟶ｸ陦ｨ遉ｺ縲∫ｫ繝代ロ繝ｫ繧ｹ繝ｩ繧､繝峨う繝ｳ豁｣蟶ｸ縲√し繧､繝峨ヰ繝ｼ閾ｪ蜍暮撼陦ｨ遉ｺ豁｣蟶ｸ
- Normal 繝｢繝ｼ繝・ 繝・・繝ｫ繝舌・蟶ｸ譎り｡ｨ遉ｺ縲√し繧､繝峨ヰ繝ｼ髢矩哩豁｣蟶ｸ
- Blank 繝｢繝ｼ繝・ 繝偵Φ繝磯撼陦ｨ遉ｺ菫ｮ豁｣貂医∩

### 繝・せ繝育ｵ先棡
- 繧ｳ繧｢繧ｹ繧､繝ｼ繝・55 passed / 0 failed / 1 skipped
- Visual Audit 20 passed

---

## Session 29 螳滓命蜀・ｮｹ

### WP-001 螳滉ｽｿ逕ｨ繝峨Μ繝悶Φ謾ｹ蝟・Phase 1 (Advance)
- editor-wysiwyg.js: 蛯咲せGUI (_handleKentenAction/_applyKenten/_removeKenten/_showKentenRemovePopup)
- index.html: WYSIWYG繝・・繝ｫ繝舌・縺ｫ蛯咲せ繝懊ち繝ｳ (#wysiwyg-kenten) 霑ｽ蜉
- app.js: .zwp.json 繝峨Ο繝・・繧､繝ｳ繝昴・繝・(document 繝ｬ繝吶Ν D&D 繝上Φ繝峨Λ + 繧ｪ繝ｼ繝舌・繝ｬ繧､)
- css/style.css: .zwp-drop-overlay 繧ｹ繧ｿ繧､繝ｫ霑ｽ蜉
- sidebar-manager.js: BP-5 菫ｮ豁｣ (繧｢繧ｳ繝ｼ繝・ぅ繧ｪ繝ｳ _toggleAccordion 蜀榊・髦ｲ豁｢繝輔Λ繧ｰ)
- E2E: 蝗槫ｸｰ縺ｪ縺・(ruby-wysiwyg 5/5, wysiwyg-editor 18/18, pathtext 27/27, content-guard 7/7 縺ｪ縺ｩ)

---

## Session 28 螳滓命蜀・ｮｹ

### SP-073 Phase 4 繝輔Μ繝ｼ繝上Φ繝画緒逕ｻ (Advance)
- PathHandleOverlay.js: RDP邁｡逡･蛹・+ Catmull-Rom竊偵・繧ｸ繧ｧ霑台ｼｼ繧｢繝ｫ繧ｴ繝ｪ繧ｺ繝霑ｽ蜉
- PathHandleOverlay.js: enterDrawingMode / exitDrawingMode / isDrawing API 霑ｽ蜉
- editor-wysiwyg.js: 繧ｳ繝ｳ繝・く繧ｹ繝医Γ繝九Η繝ｼ縺ｫ縲後ヵ繝ｪ繝ｼ繝上Φ繝画緒逕ｻ縲阪・繧ｿ繝ｳ霑ｽ蜉
- css/style.css: .zw-pathtext-drawing 繝昴Μ繝ｩ繧､繝ｳ繧ｹ繧ｿ繧､繝ｫ霑ｽ蜉
- spec-path-text.md: Phase 4 莉墓ｧ倩ｨ倩ｿｰ霑ｽ蜉縲√せ繝・・繧ｿ繧ｹ done/100% 縺ｫ譖ｴ譁ｰ
- spec-index.json: SP-073 done/100%
- E2E: pathtext-handles 20竊・7莉ｶ (Phase 4 譁ｰ隕・莉ｶ)

### WYSIWYG 繝舌げ菫ｮ豁｣ (Bugfix)
- editor-wysiwyg.js: 隕句・縺・H1-H3)/谿ｵ關ｽ/蠑慕畑繧・formatBlock 繧ｳ繝槭Φ繝峨↓菫ｮ豁｣
- editor-wysiwyg.js: 繝ｪ繧ｹ繝・UL/OL)繧・insertUnorderedList/insertOrderedList 縺ｫ菫ｮ豁｣
- css/style.css: 繝・・繝ｫ繝舌・ overflow-x:auto 竊・overflow:hidden + flex-wrap:wrap
- index.html + editor-wysiwyg.js: textarea 繝｢繝ｼ繝峨後Μ繝・メ繝・く繧ｹ繝医↓謌ｻ繧九阪ヰ繝翫・霑ｽ蜉
- editor-wysiwyg.js: 繝ｫ繝捺諺蜈･蠕後き繝ｼ繧ｽ繝ｫ繧・ruby 螟門・縺ｫ驟咲ｽｮ縲√・繝・・繧｢繝・・髢峨§蠕後↓繧ｨ繝・ぅ繧ｿ focus 蠕ｩ蟶ｰ

### dock-preset.spec.js 菫ｮ豁｣
- beforeEach 縺ｫ data-ui-mode=normal 險ｭ螳夊ｿｽ蜉 (focus 繝｢繝ｼ繝峨ョ繝輔か繝ｫ繝亥喧蟇ｾ蠢・

### Visual Audit
- 50譫壹・繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ蜿門ｾ・(docs/verification/2026-03-27/)
- UI繝舌げ5莉ｶ逋ｺ隕・竊・4莉ｶ菫ｮ豁｣貂医∩
- 譛ｪ菫ｮ豁｣: 讒矩繧｢繧ｳ繝ｼ繝・ぅ繧ｪ繝ｳ螻暮幕繝ｫ繝ｼ繝・(textarea 繝｢繝ｼ繝画凾)

### 逋ｺ隕九＠縺溷・騾壹ヰ繧ｰ繝代ち繝ｼ繝ｳ (docs/verification/session28-bug-patterns.md 縺ｫ險倬鹸)
- execCommand 逶ｴ謗･蜻ｼ縺ｳ蝠城｡後，SS overflow-x:auto 縺ｮ荳埼←蛻・ｽｿ逕ｨ縲√Δ繝ｼ繝牙・譖ｿ縺ｮ蠕ｩ蟶ｰ蟆守ｷ壽ｬ螯ゅ…ontenteditable 繧ｫ繝ｼ繧ｽ繝ｫ驟咲ｽｮ

---

## Session 27 螳滓命蜀・ｮｹ

### JSON 繝励Ο繧ｸ繧ｧ繧ｯ繝井ｿ晏ｭ・隱ｭ霎ｼ (Advance)
- storage.js: exportProjectJSON(docId) 窶・繝峨く繝･繝｡繝ｳ繝・蜈ｨ遶繧・zenwriter-v1 JSON 蠖｢蠑上〒菫晏ｭ・- storage.js: importProjectJSON(jsonString) 窶・JSON 縺九ｉ遶讒矩繧貞ｮ悟・蠕ｩ蜈・- storage.js: importProjectJSONFromFile() 窶・繝輔ぃ繧､繝ｫ驕ｸ謚槭ム繧､繧｢繝ｭ繧ｰ邨檎罰縺ｮ繧､繝ｳ繝昴・繝・- gadgets-documents-hierarchy.js: 縲繰SON菫晏ｭ倥阪繰SON隱ｭ霎ｼ縲阪・繧ｿ繝ｳ繧偵ヤ繝ｼ繝ｫ繝舌・縺ｫ霑ｽ蜉

### 繝輔か繝ｼ繧ｫ繧ｹ繝｢繝ｼ繝画隼蝟・(Advance)
- css/style.css: 繝輔か繝ｼ繧ｫ繧ｹ繝｢繝ｼ繝峨〒繝・・繝ｫ繝舌・繧帝撼陦ｨ遉ｺ蛹・(transform+opacity縲√お繝・ず繝帙ヰ繝ｼ縺ｧ蠕ｩ蟶ｰ)
- css/style.css: 遶繝代ロ繝ｫ繧偵ョ繝輔か繝ｫ繝磯撼陦ｨ遉ｺ竊貞ｷｦ繧ｨ繝・ず繝帙ヰ繝ｼ縺ｧ繧ｹ繝ｩ繧､繝峨う繝ｳ
- css/style.css: editor padding-top 隱ｿ謨ｴ縲《how-toolbar-fab 髱櫁｡ｨ遉ｺ
- edge-hover.js: 繝輔か繝ｼ繧ｫ繧ｹ繝｢繝ｼ繝画凾縺ｮ繝・・繝ｫ繝舌・/遶繝代ロ繝ｫ縺ｮ繧ｨ繝・ず繝帙ヰ繝ｼ蟇ｾ蠢・- edge-hover.js: 繝輔か繝ｼ繧ｫ繧ｹ繝｢繝ｼ繝画凾縺ｮ繧ｵ繧､繝峨ヰ繝ｼ髢矩哩繧ｹ繧ｭ繝・・

### 讀懆ｨｼ
- JSON round-trip 繝・せ繝・ 2遶縺ｮ繧ｿ繧､繝医Ν繝ｻ譛ｬ譁・′螳悟・荳閾ｴ縺ｧ蠕ｩ蜈・- Focus mode: opacity=0, translateY(-100%), pointer-events=none 遒ｺ隱・- E2E: 48 passed / 1 failed(譌｢遏･Legacy) / 1 skipped (荳ｻ隕・繧ｹ繧､繝ｼ繝・

### Nightshift 霑ｽ蜉菴懈･ｭ
- showFullToolbar 繝倥Ν繝代・: data-ui-mode=normal 繧定ｿｽ蜉・医ユ繧ｹ繝井ｿ｡鬆ｼ諤ｧ蜷台ｸ奇ｼ・- E2E: 繝・ヵ繧ｩ繝ｫ繝・ocus繝｢繝ｼ繝峨↓霑ｽ蠕・(openAssistPanel, beforeEach, 蛟句挨繝・せ繝・莉ｶ)
- spec-index.json: SP-080 (JSON繝励Ο繧ｸ繧ｧ繧ｯ繝井ｿ晏ｭ伜ｽ｢蠑・ 繧・done 縺ｧ霑ｽ蜉
- Electron: 繝｡繝九Η繝ｼ縺ｫ JSON繝励Ο繧ｸ繧ｧ繧ｯ繝井ｿ晏ｭ・隱ｭ霎ｼ 繧定ｿｽ蜉
- electron-bridge.js: export-project-json / import-project-json 繝上Φ繝峨Λ霑ｽ蜉

---

## Session 26 螳滓命蜀・ｮｹ

### 繝・ャ繝峨さ繝ｼ繝画ｹ邨ｶ (-1,121陦・
- storage-idb.js: nodegraph API 3髢｢謨ｰ + 遘ｻ陦後さ繝ｼ繝・+ export蜑企勁
- sidebar-manager.js: deprecated 繧ｿ繝也ｮ｡逅・繝｡繧ｽ繝・ラ蜑企勁 (addTab/removeTab/renameTab/getTabOrder/saveTabOrder)
- gadgets-editor-extras.js: 髱樊ｩ溯・繧ｿ繝也ｮ｡逅・I蜑企勁 (繧ｿ繝夜・ｺ・霑ｽ蜉/蜷咲ｧｰ螟画峩/蜑企勁)
- gadgets-core.js: addTab 繧・no-op 蛹・- ui-labels.js: TAB_* 繝ｩ繝吶Ν5莉ｶ蜑企勁
- morphology.js: 陬ｸ縺ｮ console.log 蜑企勁

### 繝・せ繝域紛逅・- e2e/test-ui-debug.spec.js 蜑企勁 (蜈ｨskip縲√ョ繝舌ャ繧ｰ蟆ら畑)
- e2e/session19-verify.spec.js 蜑企勁 (荳驕取ｧ讀懆ｨｼ)
- tests/e2e/ 繝・ぅ繝ｬ繧ｯ繝医Μ蜑企勁 (譌ｧ繝・せ繝医｝laywright config 蟇ｾ雎｡螟・
- e2e/visual-audit.spec.js: baseURL菫ｮ豁｣ (localhost:8080 竊・/index.html)
- e2e/editor-canvas-mode.spec.js: zoom 繝・せ繝・skip蛹・(Playwright迺ｰ蠅・宛邏・

### Visual Audit
- 20譫壹・繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繧ｷ繝ｧ繝・ヨ譖ｴ譁ｰ
- V-2/V-3/V-4: session 22-24 荳謗・〒隗｣豸郁ｦ玖ｾｼ縺ｿ (譁ｰ隕酋I繝舌げ逋ｺ隕九↑縺・
- visual-audit 繝・せ繝医・蜩∬ｳｪ蝠城｡後ｒ迚ｹ螳・(繧ｵ繝ｳ繝励Ν隱ｭ霎ｼ/繝｢繝ｼ繝繝ｫ髢句ｰ√・荳榊・蜷医・繝・せ繝亥・)

### 繝峨く繝･繝｡繝ｳ繝亥酔譛・- ROADMAP.md: E2E謨ｰ蛟､譖ｴ譁ｰ
- README.md / docs/README.md: ISSUES.md蜿ら・蜑企勁
- docs/ISSUES.md 竊・docs/archive/ISSUES-resolved.md 縺ｫ繧｢繝ｼ繧ｫ繧､繝・- GADGETS.md: 蜍慕噪繧ｿ繝泡PI險倩ｿｰ繧呈峩譁ｰ
- session25-status-matrix.md: V-1~V-5, 蛻､譁ｭ菫晉蕗鬆・岼繧呈峩譁ｰ

### E2E
- 542 passed / 0 failed / 3 skipped (63 spec files)
- visual-audit 20莉ｶ縺碁夐℃縺吶ｋ繧医≧縺ｫ縺ｪ縺｣縺・(+20)
- session蝗ｺ譛鋭pec 2莉ｶ蜑企勁 (-13 tests)
