(function () {
  'use strict';

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function clamp(n, min, max) { n = parseFloat(n); if (isNaN(n)) return min; return Math.max(min, Math.min(max, n)); }
  function toInt(n, d) { var v = parseInt(n, 10); return isNaN(v) ? d : v; }

  function withStorage(updater) {
    try {
      var s = window.ZenWriterStorage.loadSettings();
      updater(s);
      window.ZenWriterStorage.saveSettings(s);
    } catch (_) { }
  }

  function refreshTypewriter() { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyTypewriterIfEnabled === 'function') window.ZenWriterEditor.applyTypewriterIfEnabled(); } catch (_) { } }
  function applyWrapCols() { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyWrapCols === 'function') window.ZenWriterEditor.applyWrapCols(); } catch (_) { } }

  function hexToRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) { h = h.split('').map(x => x + x).join(''); } var n = parseInt(h, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
  function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }

  function createColorPickerRow(c1, c2, gap) {
    var row = el('div'); row.style.display = 'flex'; row.style.gap = gap || '8px';
    row.appendChild(c1); row.appendChild(c2);
    return row;
  }

  function createRangeRow(labelText, input) {
    var row = el('div');
    var lbl = el('div'); lbl.textContent = labelText; lbl.style.fontSize = '12px';
    row.appendChild(lbl); row.appendChild(input);
    return row;
  }

  function register() {
    if (!window.ZWGadgets || typeof window.ZWGadgets.register !== 'function') return;

    // Typewriter Gadget
    window.ZWGadgets.register('Typewriter', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var tw = (s && s.typewriter) || {};
      root.innerHTML = '';
      root.style.display = 'grid'; root.style.gap = '8px';

      var row1 = el('label', 'toggle-switch');
      var enabled = el('input'); enabled.type = 'checkbox'; enabled.id = 'typewriter-enabled'; enabled.checked = !!tw.enabled;
      var lbl1 = el('span'); lbl1.textContent = 'タイプライターモード';
      row1.appendChild(enabled); row1.appendChild(lbl1);

      var row2 = el('div');
      var anchor = el('input'); anchor.type = 'range'; anchor.id = 'typewriter-anchor-ratio'; anchor.min = '0.05'; anchor.max = '0.95'; anchor.step = '0.05'; anchor.value = String(typeof tw.anchorRatio === 'number' ? tw.anchorRatio : 0.5);
      var aLbl = el('div'); aLbl.textContent = 'アンカー位置: ' + anchor.value; aLbl.style.fontSize = '12px';
      row2.appendChild(aLbl); row2.appendChild(anchor);

      var row3 = el('div');
      var stick = el('input'); stick.type = 'range'; stick.id = 'typewriter-stickiness'; stick.min = '0'; stick.max = '1'; stick.step = '0.1'; stick.value = String(typeof tw.stickiness === 'number' ? tw.stickiness : 0.9);
      var sLbl = el('div'); sLbl.textContent = '張り付き強度: ' + stick.value; sLbl.style.fontSize = '12px';
      row3.appendChild(sLbl); row3.appendChild(stick);

      var row4 = el('div');
      var wrapCols = el('input'); wrapCols.type = 'range'; wrapCols.min = '40'; wrapCols.max = '120'; wrapCols.step = '10'; wrapCols.value = String(typeof tw.wrapCols === 'number' ? tw.wrapCols : 80);
      var wLbl = el('div'); wLbl.textContent = '折り返し文字数: ' + wrapCols.value; wLbl.style.fontSize = '12px';
      row4.appendChild(wLbl); row4.appendChild(wrapCols);

      var btnApply = el('button', 'small'); btnApply.textContent = '今すぐ整列';

      enabled.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.enabled = !!enabled.checked; }); refreshTypewriter(); });
      anchor.addEventListener('input', function () { aLbl.textContent = 'アンカー位置: ' + anchor.value; });
      anchor.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.anchorRatio = clamp(anchor.value, 0.05, 0.95); }); refreshTypewriter(); });
      stick.addEventListener('input', function () { sLbl.textContent = '張り付き強度: ' + stick.value; });
      stick.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.stickiness = clamp(stick.value, 0, 1); }); refreshTypewriter(); });
      wrapCols.addEventListener('input', function () { wLbl.textContent = '折り返し文字数: ' + wrapCols.value; });
      wrapCols.addEventListener('change', function () { withStorage(function (cfg) { cfg.typewriter = cfg.typewriter || {}; cfg.typewriter.wrapCols = clamp(wrapCols.value, 40, 120); }); applyWrapCols(); });
      btnApply.addEventListener('click', refreshTypewriter);

      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(row4); root.appendChild(btnApply);
    }, { title: 'Typewriter', groups: ['assist'], description: 'タイプライター風スクロール。カーソル行を常に画面中央に維持します。' });

    // Focus Mode Gadget
    window.ZWGadgets.register('FocusMode', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var fm = (s && s.focusMode) || {};
      root.innerHTML = '';
      root.style.display = 'grid'; root.style.gap = '8px';

      var row1 = el('label', 'toggle-switch');
      var enabled = el('input'); enabled.type = 'checkbox'; enabled.id = 'focus-mode-enabled'; enabled.checked = !!fm.enabled;
      var lbl1 = el('span'); lbl1.textContent = 'フォーカスモード';
      row1.appendChild(enabled); row1.appendChild(lbl1);

      var row2 = el('div');
      var dimOpacity = el('input'); dimOpacity.type = 'range'; dimOpacity.id = 'focus-dim-opacity'; dimOpacity.min = '0'; dimOpacity.max = '1'; dimOpacity.step = '0.1'; dimOpacity.value = String(typeof fm.dimOpacity === 'number' ? fm.dimOpacity : 0.3);
      var dLbl = el('div'); dLbl.textContent = '減光: ' + dimOpacity.value; dLbl.style.fontSize = '12px';
      row2.appendChild(dLbl); row2.appendChild(dimOpacity);

      var row3 = el('div');
      var blurRadius = el('input'); blurRadius.type = 'range'; blurRadius.id = 'focus-blur-radius'; blurRadius.min = '0'; blurRadius.max = '10'; blurRadius.step = '0.5'; blurRadius.value = String(typeof fm.blurRadius === 'number' ? fm.blurRadius : 2);
      var bLbl = el('div'); bLbl.textContent = 'ぼかし: ' + blurRadius.value + 'px'; bLbl.style.fontSize = '12px';
      row3.appendChild(bLbl); row3.appendChild(blurRadius);

      function refreshFocusMode() {
        try {
          if (window.ZenWriterEditor && typeof window.ZenWriterEditor.scheduleFocusModeUpdate === 'function') {
            window.ZenWriterEditor.scheduleFocusModeUpdate();
          }
        } catch (_) { }
      }

      enabled.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.enabled = !!enabled.checked;
        });
        refreshFocusMode();
      });
      dimOpacity.addEventListener('input', function () { dLbl.textContent = '減光: ' + dimOpacity.value; });
      dimOpacity.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.dimOpacity = clamp(parseFloat(dimOpacity.value), 0, 1);
        });
        refreshFocusMode();
      });
      blurRadius.addEventListener('input', function () { bLbl.textContent = 'ぼかし: ' + blurRadius.value + 'px'; });
      blurRadius.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.focusMode = cfg.focusMode || {};
          cfg.focusMode.blurRadius = clamp(parseFloat(blurRadius.value), 0, 10);
        });
        refreshFocusMode();
      });

      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3);
    }, { title: 'Focus Mode', groups: ['assist'], description: '集中モード。編集中の段落以外を薄暗くして注意を集中させます。' });

    // SnapshotManager は gadgets-snapshot.js に個別ファイル化済み

    // Markdown Preview Gadget
    window.ZWGadgets.register('MarkdownPreview', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var prev = (s && s.preview) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '6px';

      var row = el('div');
      var sync = el('input'); sync.type = 'checkbox'; sync.checked = !!prev.syncScroll; var lbl = el('label'); lbl.textContent = 'スクロール同期'; lbl.style.marginLeft = '6px'; row.appendChild(sync); row.appendChild(lbl);

      var btnToggle = el('button', 'small'); btnToggle.textContent = 'プレビュー開閉';
      btnToggle.addEventListener('click', function () {
        var pv = document.getElementById('editor-preview'); if (!pv) return; pv.classList.toggle('editor-preview--collapsed');
      });
      sync.addEventListener('change', function () { withStorage(function (cfg) { cfg.preview = cfg.preview || {}; cfg.preview.syncScroll = !!sync.checked; }); });

      root.appendChild(row); root.appendChild(btnToggle);
    }, { title: 'Markdown Preview', groups: ['edit'], description: 'Markdownのリアルタイムプレビュー表示とスクロール同期。' });

    // UI Settings Gadget
    window.ZWGadgets.register('UISettings', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var ui = (s && s.ui) || {};
      var fs = (s && s.fontSizes) || {};
      var editorCfg = (s && s.editor) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '8px';

      var presRow = el('div');
      var sel = el('select');['buttons', 'tabs', 'dropdown', 'accordion'].forEach(function (k) { var o = el('option'); o.value = k; o.textContent = k; sel.appendChild(o); }); sel.value = String(ui.tabsPresentation || 'tabs');
      var l1 = el('label'); l1.textContent = 'タブ表示方式'; l1.style.display = 'block'; presRow.appendChild(l1); presRow.appendChild(sel);

      // UI表示スタイル（アイコン/テキスト切替）
      var styleRow = el('div');
      var styleSel = el('select');
      [
        { value: 'default', label: 'アイコン+テキスト' },
        { value: 'icons-only', label: 'アイコンのみ' },
        { value: 'text-only', label: 'テキストのみ' }
      ].forEach(function (opt) {
        var o = el('option'); o.value = opt.value; o.textContent = opt.label; styleSel.appendChild(o);
      });
      styleSel.value = String(ui.uiStyle || 'default');
      var styleLabel = el('label'); styleLabel.textContent = 'ボタン表示'; styleLabel.style.display = 'block';
      styleRow.appendChild(styleLabel); styleRow.appendChild(styleSel);

      styleSel.addEventListener('change', function () {
        var val = styleSel.value;
        withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.uiStyle = val; });
        document.documentElement.setAttribute('data-ui-style', val === 'default' ? '' : val);
      });

      // 初期適用
      if (ui.uiStyle && ui.uiStyle !== 'default') {
        document.documentElement.setAttribute('data-ui-style', ui.uiStyle);
      }

      var widthRow = el('div');
      var rng = el('input'); rng.type = 'range'; rng.min = '220'; rng.max = '560'; rng.step = '10'; rng.value = String(typeof ui.sidebarWidth === 'number' ? ui.sidebarWidth : 320);
      var note = el('div'); note.style.fontSize = '12px'; note.textContent = 'サイドバー幅: ' + rng.value + 'px';
      widthRow.appendChild(note); widthRow.appendChild(rng);

      var fontRow = el('div');
      var hInput = el('input'); hInput.type = 'number'; hInput.min = '10'; hInput.max = '50'; hInput.value = String(fs.heading || 20);
      var bInput = el('input'); bInput.type = 'number'; bInput.min = '10'; bInput.max = '50'; bInput.value = String(fs.body || 16);
      var hLabel = el('label'); hLabel.textContent = '見出しサイズ'; hLabel.style.display = 'block';
      var bLabel = el('label'); bLabel.textContent = '本文サイズ'; bLabel.style.display = 'block';
      fontRow.appendChild(hLabel); fontRow.appendChild(hInput); fontRow.appendChild(bLabel); fontRow.appendChild(bInput);

      // エディタプレースホルダ設定
      var placeholderRow = el('div');
      var placeholderLabel = el('label');
      placeholderLabel.textContent = 'エディタプレースホルダ';
      placeholderLabel.style.display = 'block';
      var placeholderInput = el('input');
      placeholderInput.type = 'text';
      placeholderInput.placeholder = (window.UILabels && window.UILabels.EDITOR_PLACEHOLDER) || 'ここに小説を入力してください...';
      placeholderInput.value = typeof editorCfg.placeholder === 'string' ? editorCfg.placeholder : '';
      placeholderInput.style.width = '100%';
      placeholderRow.appendChild(placeholderLabel);
      placeholderRow.appendChild(placeholderInput);

      // Extended Textbox 設定
      var textboxCfg = editorCfg.extendedTextbox || {};
      var textboxRow = el('div');
      textboxRow.style.display = 'grid';
      textboxRow.style.gap = '6px';
      textboxRow.style.padding = '8px';
      textboxRow.style.border = '1px solid var(--border-color, #444)';
      textboxRow.style.borderRadius = '6px';

      var textboxTitle = el('div');
      textboxTitle.textContent = 'TextBox Effects';
      textboxTitle.style.fontSize = '12px';
      textboxTitle.style.fontWeight = 'bold';

      var textboxEnabledRow = el('label');
      textboxEnabledRow.style.display = 'flex';
      textboxEnabledRow.style.alignItems = 'center';
      textboxEnabledRow.style.gap = '6px';
      var textboxEnabled = el('input');
      textboxEnabled.type = 'checkbox';
      textboxEnabled.checked = textboxCfg.enabled !== false;
      var textboxEnabledText = el('span');
      textboxEnabledText.textContent = '機能を有効化';
      textboxEnabledRow.appendChild(textboxEnabled);
      textboxEnabledRow.appendChild(textboxEnabledText);

      var textboxPresetRow = el('div');
      var textboxPresetLabel = el('label');
      textboxPresetLabel.textContent = '既定プリセット';
      textboxPresetLabel.style.display = 'block';
      var textboxPresetSelect = el('select');
      textboxPresetSelect.style.width = '100%';
      var textboxPresets = (window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.list === 'function')
        ? window.TextboxPresetRegistry.list(s)
        : [];
      textboxPresets.forEach(function (preset) {
        var opt = el('option');
        opt.value = preset.id;
        opt.textContent = preset.label || preset.id;
        textboxPresetSelect.appendChild(opt);
      });
      if (textboxPresetSelect.options.length === 0) {
        var fallbackOpt = el('option');
        fallbackOpt.value = 'inner-voice';
        fallbackOpt.textContent = '心の声';
        textboxPresetSelect.appendChild(fallbackOpt);
      }
      textboxPresetSelect.value = textboxCfg.defaultPreset || 'inner-voice';
      textboxPresetRow.appendChild(textboxPresetLabel);
      textboxPresetRow.appendChild(textboxPresetSelect);

      var textboxSfxRow = el('label');
      textboxSfxRow.style.display = 'flex';
      textboxSfxRow.style.alignItems = 'center';
      textboxSfxRow.style.gap = '6px';
      var textboxShowSfx = el('input');
      textboxShowSfx.type = 'checkbox';
      textboxShowSfx.checked = textboxCfg.showSfxField !== false;
      var textboxShowSfxText = el('span');
      textboxShowSfxText.textContent = 'sfx フィールド表示';
      textboxSfxRow.appendChild(textboxShowSfx);
      textboxSfxRow.appendChild(textboxShowSfxText);

      function saveTextboxSettings(patch) {
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.extendedTextbox = cfg.editor.extendedTextbox || {};
          cfg.editor.extendedTextbox = {
            ...cfg.editor.extendedTextbox,
            ...patch
          };
        });
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) { }
      }

      textboxEnabled.addEventListener('change', function () {
        saveTextboxSettings({ enabled: !!textboxEnabled.checked });
      });
      textboxPresetSelect.addEventListener('change', function () {
        saveTextboxSettings({ defaultPreset: String(textboxPresetSelect.value || 'inner-voice') });
      });
      textboxShowSfx.addEventListener('change', function () {
        saveTextboxSettings({ showSfxField: !!textboxShowSfx.checked });
      });

      // ユーザー定義プリセット管理UI (Phase 3)
      var ALLOWED_ROLES = (window.TextboxPresetRegistry && window.TextboxPresetRegistry.ALLOWED_ROLES)
        ? window.TextboxPresetRegistry.ALLOWED_ROLES
        : ['dialogue', 'monologue', 'narration', 'sfx', 'system', 'custom'];

      var userPresetsContainer = el('div');
      userPresetsContainer.className = 'tb-user-presets';
      userPresetsContainer.style.display = 'grid';
      userPresetsContainer.style.gap = '4px';

      var userPresetsLabel = el('div');
      userPresetsLabel.textContent = 'カスタムプリセット';
      userPresetsLabel.style.fontSize = '12px';
      userPresetsLabel.style.fontWeight = 'bold';
      userPresetsContainer.appendChild(userPresetsLabel);

      var userPresetsList = el('div');
      userPresetsList.className = 'tb-user-presets-list';
      userPresetsContainer.appendChild(userPresetsList);

      function getUserPresets() {
        var cfg = window.ZenWriterStorage && typeof window.ZenWriterStorage.loadSettings === 'function'
          ? window.ZenWriterStorage.loadSettings() : {};
        return (cfg && cfg.editor && cfg.editor.extendedTextbox && Array.isArray(cfg.editor.extendedTextbox.userPresets))
          ? cfg.editor.extendedTextbox.userPresets : [];
      }

      function saveUserPresets(presets) {
        saveTextboxSettings({ userPresets: presets });
        renderUserPresetList();
        // 既定プリセットセレクトも更新
        refreshDefaultPresetSelect();
      }

      function refreshDefaultPresetSelect() {
        var current = textboxPresetSelect.value;
        textboxPresetSelect.innerHTML = '';
        var allPresets = (window.TextboxPresetRegistry && typeof window.TextboxPresetRegistry.list === 'function')
          ? window.TextboxPresetRegistry.list(window.ZenWriterStorage.loadSettings()) : [];
        allPresets.forEach(function (p) {
          var o = el('option'); o.value = p.id; o.textContent = p.label || p.id;
          textboxPresetSelect.appendChild(o);
        });
        textboxPresetSelect.value = current || 'inner-voice';
      }

      function renderUserPresetList() {
        userPresetsList.innerHTML = '';
        var presets = getUserPresets();
        if (presets.length === 0) {
          var empty = el('div');
          empty.textContent = 'カスタムプリセットはありません';
          empty.style.fontSize = '11px';
          empty.style.color = 'var(--text-color, #999)';
          empty.style.padding = '4px 0';
          userPresetsList.appendChild(empty);
          return;
        }
        presets.forEach(function (raw, idx) {
          var registry = window.TextboxPresetRegistry;
          var preset = registry && typeof registry.normalizePreset === 'function'
            ? registry.normalizePreset(raw, 'user-' + idx) : raw;
          if (!preset) return;

          var item = el('div');
          item.className = 'tb-preset-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '6px';
          item.style.padding = '4px 6px';
          item.style.border = '1px solid var(--border-color, #555)';
          item.style.borderRadius = '4px';

          var info = el('span');
          info.style.flex = '1';
          info.style.fontSize = '12px';
          info.textContent = (preset.label || preset.id) + ' (' + (preset.role || 'custom') + ')';

          var editBtn = el('button');
          editBtn.className = 'small';
          editBtn.textContent = '編集';
          editBtn.style.fontSize = '11px';
          editBtn.addEventListener('click', function () { openPresetEditor(preset, idx); });

          var dupBtn = el('button');
          dupBtn.className = 'small';
          dupBtn.textContent = '複製';
          dupBtn.style.fontSize = '11px';
          dupBtn.addEventListener('click', function () {
            var list = getUserPresets();
            var copy = JSON.parse(JSON.stringify(raw));
            copy.id = (copy.id || 'preset') + '-copy';
            copy.label = (copy.label || copy.id) + ' (コピー)';
            list.push(copy);
            saveUserPresets(list);
          });

          var delBtn = el('button');
          delBtn.className = 'small';
          delBtn.textContent = '削除';
          delBtn.style.fontSize = '11px';
          delBtn.style.color = 'var(--danger-color, #e74c3c)';
          delBtn.addEventListener('click', function () {
            var list = getUserPresets();
            list.splice(idx, 1);
            saveUserPresets(list);
          });

          item.appendChild(info);
          item.appendChild(editBtn);
          item.appendChild(dupBtn);
          item.appendChild(delBtn);
          userPresetsList.appendChild(item);
        });
      }

      // プリセット作成/編集フォーム
      function openPresetEditor(preset, editIndex) {
        // 既存のエディタがあれば削除
        var existing = userPresetsContainer.querySelector('.tb-preset-editor');
        if (existing) existing.remove();

        var isNew = editIndex === undefined || editIndex === null;
        var data = preset || { id: '', label: '', role: 'custom', anim: '', tilt: 0, scale: 1, sfx: '' };

        var editor = el('div');
        editor.className = 'tb-preset-editor';
        editor.style.display = 'grid';
        editor.style.gap = '4px';
        editor.style.padding = '8px';
        editor.style.border = '1px solid var(--accent-color, #4a9eff)';
        editor.style.borderRadius = '6px';
        editor.style.marginTop = '4px';

        var editorTitle = el('div');
        editorTitle.textContent = isNew ? '新規プリセット' : 'プリセット編集';
        editorTitle.style.fontSize = '12px';
        editorTitle.style.fontWeight = 'bold';
        editor.appendChild(editorTitle);

        function addField(labelText, inputEl) {
          var row = el('div');
          var lbl = el('label');
          lbl.textContent = labelText;
          lbl.style.display = 'block';
          lbl.style.fontSize = '11px';
          row.appendChild(lbl);
          row.appendChild(inputEl);
          editor.appendChild(row);
          return inputEl;
        }

        var idInput = el('input'); idInput.type = 'text'; idInput.value = data.id || ''; idInput.placeholder = 'preset-id'; idInput.style.width = '100%';
        addField('ID (英数字とハイフン)', idInput);

        var labelInput = el('input'); labelInput.type = 'text'; labelInput.value = data.label || ''; labelInput.placeholder = '表示名'; labelInput.style.width = '100%';
        addField('表示名', labelInput);

        var roleSelect = el('select'); roleSelect.style.width = '100%';
        ALLOWED_ROLES.forEach(function (r) {
          var o = el('option'); o.value = r; o.textContent = r; roleSelect.appendChild(o);
        });
        roleSelect.value = data.role || 'custom';
        addField('役割', roleSelect);

        var animInput = el('input'); animInput.type = 'text'; animInput.value = data.anim || ''; animInput.placeholder = 'fadein, shake, etc.'; animInput.style.width = '100%';
        addField('アニメーション', animInput);

        var tiltInput = el('input'); tiltInput.type = 'number'; tiltInput.min = '-20'; tiltInput.max = '20'; tiltInput.step = '1'; tiltInput.value = String(data.tilt || 0); tiltInput.style.width = '100%';
        addField('傾き (-20 ~ 20)', tiltInput);

        var scaleInput = el('input'); scaleInput.type = 'number'; scaleInput.min = '0.5'; scaleInput.max = '2.0'; scaleInput.step = '0.05'; scaleInput.value = String(data.scale || 1); scaleInput.style.width = '100%';
        addField('スケール (0.5 ~ 2.0)', scaleInput);

        var sfxInput = el('input'); sfxInput.type = 'text'; sfxInput.value = data.sfx || ''; sfxInput.placeholder = 'サウンドエフェクトID'; sfxInput.style.width = '100%';
        addField('SFX', sfxInput);

        var errorMsg = el('div');
        errorMsg.style.fontSize = '11px';
        errorMsg.style.color = 'var(--danger-color, #e74c3c)';
        errorMsg.style.display = 'none';
        editor.appendChild(errorMsg);

        var btnRow = el('div');
        btnRow.style.display = 'flex';
        btnRow.style.gap = '6px';
        btnRow.style.justifyContent = 'flex-end';

        var saveBtn = el('button');
        saveBtn.className = 'small';
        saveBtn.textContent = isNew ? '作成' : '保存';
        saveBtn.addEventListener('click', function () {
          var registry = window.TextboxPresetRegistry;
          var sanitizedId = registry && typeof registry.sanitizeId === 'function'
            ? registry.sanitizeId(idInput.value) : idInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');

          if (!sanitizedId) {
            errorMsg.textContent = 'IDを入力してください';
            errorMsg.style.display = 'block';
            return;
          }
          if (!labelInput.value.trim()) {
            errorMsg.textContent = '表示名を入力してください';
            errorMsg.style.display = 'block';
            return;
          }

          // 組み込みプリセットとのID重複チェック
          var builtins = (registry && registry.BUILTIN_PRESETS) ? registry.BUILTIN_PRESETS : [];
          var builtinDup = builtins.some(function (b) { return b.id === sanitizedId; });
          if (builtinDup) {
            errorMsg.textContent = '組み込みプリセットと同じIDは使用できません';
            errorMsg.style.display = 'block';
            return;
          }

          var newPreset = {
            id: sanitizedId,
            label: labelInput.value.trim(),
            role: roleSelect.value || 'custom',
            anim: animInput.value.trim(),
            tilt: clamp(parseFloat(tiltInput.value), -20, 20),
            scale: clamp(parseFloat(scaleInput.value), 0.5, 2.0),
            sfx: sfxInput.value.trim()
          };

          var list = getUserPresets();
          if (isNew) {
            // 既存ユーザープリセットとのID重複チェック
            var userDup = list.some(function (u) { return (u.id || '') === sanitizedId; });
            if (userDup) {
              errorMsg.textContent = '同じIDのカスタムプリセットが既に存在します';
              errorMsg.style.display = 'block';
              return;
            }
            list.push(newPreset);
          } else {
            list[editIndex] = newPreset;
          }
          saveUserPresets(list);
          editor.remove();
        });

        var cancelBtn = el('button');
        cancelBtn.className = 'small';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', function () { editor.remove(); });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        editor.appendChild(btnRow);

        userPresetsContainer.appendChild(editor);
      }

      var addPresetBtn = el('button');
      addPresetBtn.className = 'small';
      addPresetBtn.textContent = '+ 新規プリセット';
      addPresetBtn.style.marginTop = '4px';
      addPresetBtn.addEventListener('click', function () { openPresetEditor(null); });
      userPresetsContainer.appendChild(addPresetBtn);

      renderUserPresetList();

      textboxRow.appendChild(textboxTitle);
      textboxRow.appendChild(textboxEnabledRow);
      textboxRow.appendChild(textboxPresetRow);
      textboxRow.appendChild(textboxSfxRow);
      textboxRow.appendChild(userPresetsContainer);

      // タブ配置（上下左右）
      var placementRow = el('div');
      var placementSel = el('select');
      [
        { value: 'left', label: '左' },
        { value: 'right', label: '右' },
        { value: 'top', label: '上' },
        { value: 'bottom', label: '下' }
      ].forEach(function (opt) {
        var o = el('option'); o.value = opt.value; o.textContent = opt.label; placementSel.appendChild(o);
      });
      placementSel.value = String(ui.tabPlacement || 'left');
      var placementLabel = el('label'); placementLabel.textContent = 'タブ配置'; placementLabel.style.display = 'block';
      placementRow.appendChild(placementLabel); placementRow.appendChild(placementSel);

      // タブ順序変更UI
      var orderRow = el('div');
      var orderLabel = el('label'); orderLabel.textContent = 'タブ順序'; orderLabel.style.display = 'block';
      var orderContainer = el('div'); orderContainer.style.display = 'flex'; orderContainer.style.flexDirection = 'column'; orderContainer.style.gap = '4px';
      var orderList = el('div'); orderList.id = 'tab-order-list'; orderList.style.display = 'flex'; orderList.style.flexDirection = 'column'; orderList.style.gap = '4px';
      orderContainer.appendChild(orderList);
      orderRow.appendChild(orderLabel); orderRow.appendChild(orderContainer);

      // タブ順序リストを更新
      function refreshTabOrderList() {
        try {
          orderList.innerHTML = '';
          var tabs = [];
          if (window.sidebarManager) {
            if (Array.isArray(window.sidebarManager.accordionCategories) && window.sidebarManager.accordionCategories.length) {
              tabs = window.sidebarManager.accordionCategories
                .map(function (cat) { return cat && cat.id; })
                .filter(Boolean);
            } else if (typeof window.sidebarManager.getTabOrder === 'function') {
              tabs = window.sidebarManager.getTabOrder();
            }
          }
          if (tabs.length === 0) {
            var msg = el('div'); msg.textContent = 'タブが見つかりません'; msg.style.fontSize = '12px'; msg.style.color = 'var(--text-color, #666)'; orderList.appendChild(msg);
            return;
          }
          tabs.forEach(function (tabId, index) {
            var item = el('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '8px';
            item.style.padding = '4px 8px';
            item.style.border = '1px solid var(--border-color, #e0e0e0)';
            item.style.borderRadius = '4px';
            item.style.backgroundColor = 'var(--ui-bg, #fff)';
            item.draggable = true;
            item.dataset.tabId = tabId;

            var upBtn = el('button'); upBtn.className = 'small'; upBtn.textContent = '↑'; upBtn.style.flex = '0 0 auto';
            var downBtn = el('button'); downBtn.className = 'small'; downBtn.textContent = '↓'; downBtn.style.flex = '0 0 auto';
            var label = el('span'); label.textContent = tabId; label.style.flex = '1';
            var removeBtn = el('button'); removeBtn.className = 'small'; removeBtn.textContent = '×'; removeBtn.style.flex = '0 0 auto';

            if (index === 0) upBtn.disabled = true;
            if (index === tabs.length - 1) downBtn.disabled = true;

            upBtn.addEventListener('click', function () {
              if (index > 0) {
                var newOrder = tabs.slice();
                newOrder[index] = tabs[index - 1];
                newOrder[index - 1] = tabs[index];
                if (window.sidebarManager && typeof window.sidebarManager.saveTabOrder === 'function') {
                  window.sidebarManager.saveTabOrder(newOrder);
                }
                refreshTabOrderList();
                // タブを再構築
                if (window.sidebarManager && typeof window.sidebarManager.bootstrapTabs === 'function') {
                  window.sidebarManager.bootstrapTabs();
                }
              }
            });

            downBtn.addEventListener('click', function () {
              if (index < tabs.length - 1) {
                var newOrder = tabs.slice();
                newOrder[index] = tabs[index + 1];
                newOrder[index + 1] = tabs[index];
                if (window.sidebarManager && typeof window.sidebarManager.saveTabOrder === 'function') {
                  window.sidebarManager.saveTabOrder(newOrder);
                }
                refreshTabOrderList();
                // タブを再構築
                if (window.sidebarManager && typeof window.sidebarManager.bootstrapTabs === 'function') {
                  window.sidebarManager.bootstrapTabs();
                }
              }
            });

            item.appendChild(upBtn);
            item.appendChild(downBtn);
            item.appendChild(label);
            item.appendChild(removeBtn);
            orderList.appendChild(item);
          });
        } catch (e) {
          console.error('タブ順序リスト更新エラー:', e);
        }
      }

      // 初期化時にタブ順序リストを更新
      setTimeout(refreshTabOrderList, 500);

      sel.addEventListener('change', function () { withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.tabsPresentation = String(sel.value || 'tabs'); }); try { var sb = document.getElementById('sidebar'); if (sb) sb.setAttribute('data-tabs-presentation', String(sel.value)); if (window.sidebarManager && typeof window.sidebarManager.applyTabsPresentationUI === 'function') window.sidebarManager.applyTabsPresentationUI(); } catch (_) { } });
      placementSel.addEventListener('change', function () {
        var val = placementSel.value;
        withStorage(function (cfg) { cfg.ui = cfg.ui || {}; cfg.ui.tabPlacement = val; });
        if (window.sidebarManager && typeof window.sidebarManager.saveTabPlacement === 'function') {
          window.sidebarManager.saveTabPlacement(val);
        }
      });
      hInput.addEventListener('change', function () { withStorage(function (cfg) { cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.heading = toInt(hInput.value, 20); }); applyElementFontSizes(); });
      bInput.addEventListener('change', function () { withStorage(function (cfg) { cfg.fontSizes = cfg.fontSizes || {}; cfg.fontSizes.body = toInt(bInput.value, 16); }); applyElementFontSizes(); });

      placeholderInput.addEventListener('change', function () {
        var value = String(placeholderInput.value || '');
        withStorage(function (cfg) {
          cfg.editor = cfg.editor || {};
          cfg.editor.placeholder = value;
        });
        try {
          var editorEl = (window.ZenWriterEditor && window.ZenWriterEditor.editor) || document.getElementById('editor');
          if (editorEl) {
            if (value.trim()) {
              editorEl.setAttribute('placeholder', value);
            } else if (window.UILabels && window.UILabels.EDITOR_PLACEHOLDER) {
              editorEl.setAttribute('placeholder', window.UILabels.EDITOR_PLACEHOLDER);
            }
          }
        } catch (_) { }
      });

      var tabRow = el('div');
      var tabLabel = el('label'); tabLabel.textContent = '新しいタブ'; tabLabel.style.display = 'block';
      var tabInput = el('input'); tabInput.type = 'text'; tabInput.placeholder = 'タブ名'; tabInput.style.width = '100%';
      var tabBtn = el('button', 'small'); tabBtn.textContent = '追加';
      tabRow.appendChild(tabLabel); tabRow.appendChild(tabInput); tabRow.appendChild(tabBtn);

      tabBtn.addEventListener('click', function () {
        var name = tabInput.value.trim();
        if (!name) { alert((window.UILabels && window.UILabels.TAB_NAME_REQUIRED) || 'タブ名を入力してください'); return; }
        try {
          if (window.sidebarManager && typeof window.sidebarManager.addTab === 'function') {
            var id = window.sidebarManager.addTab(null, name);
            if (id && typeof window.sidebarManager.activateSidebarGroup === 'function') {
              window.sidebarManager.activateSidebarGroup(id);
            }
          }
        } catch (_) { }
        tabInput.value = '';
        alert((window.UILabels && window.UILabels.TAB_ADDED) || 'タブを追加しました');
      });

      var manageRow = el('div');
      var manageLabel = el('label'); manageLabel.textContent = 'タブ管理'; manageLabel.style.display = 'block';
      var tabSelect = el('select');
      var renameInput = el('input'); renameInput.type = 'text'; renameInput.placeholder = '新しい名前';
      var renameBtn = el('button', 'small'); renameBtn.textContent = '名称変更';
      var removeBtn = el('button', 'small'); removeBtn.textContent = '削除';
      manageRow.appendChild(manageLabel); manageRow.appendChild(tabSelect); manageRow.appendChild(renameInput); manageRow.appendChild(renameBtn); manageRow.appendChild(removeBtn);

      function refreshSelect() {
        while (tabSelect.firstChild) tabSelect.removeChild(tabSelect.firstChild);
        var list = (window.sidebarManager && window.sidebarManager.sidebarTabConfig) ? window.sidebarManager.sidebarTabConfig : [];
        list.forEach(function (t) { var o = document.createElement('option'); o.value = t.id; o.textContent = t.label || t.id; tabSelect.appendChild(o); });
      }
      refreshSelect();
      renameBtn.addEventListener('click', function () { var id = tabSelect.value; var name = renameInput.value.trim(); if (!id || !name) return; try { if (window.sidebarManager && typeof window.sidebarManager.renameTab === 'function') window.sidebarManager.renameTab(id, name); } catch (_) { } renameInput.value = ''; refreshSelect(); alert((window.UILabels && window.UILabels.TAB_RENAMED) || '名称を変更しました'); });
      removeBtn.addEventListener('click', function () { var id = tabSelect.value; if (!id) return; if (!confirm((window.UILabels && window.UILabels.TAB_DELETE_CONFIRM) || '削除しますか？')) return; try { if (window.sidebarManager && typeof window.sidebarManager.removeTab === 'function') window.sidebarManager.removeTab(id); } catch (_) { } refreshSelect(); alert((window.UILabels && window.UILabels.TAB_DELETED) || '削除しました'); });

      // 自動保存設定
      var autoSaveCfg = (s && s.autoSave) || {};
      var autoSaveRow = el('div');
      autoSaveRow.style.display = 'grid';
      autoSaveRow.style.gap = '4px';

      var autoSaveLabel = el('label');
      autoSaveLabel.style.display = 'flex';
      autoSaveLabel.style.alignItems = 'center';
      autoSaveLabel.style.gap = '6px';
      var autoSaveCheck = el('input');
      autoSaveCheck.type = 'checkbox';
      autoSaveCheck.id = 'auto-save-enabled';
      autoSaveCheck.checked = !!autoSaveCfg.enabled;
      var autoSaveLabelText = el('span');
      autoSaveLabelText.textContent = '自動保存';
      autoSaveLabel.appendChild(autoSaveCheck);
      autoSaveLabel.appendChild(autoSaveLabelText);

      var autoSaveDelayRow = el('div');
      autoSaveDelayRow.style.display = 'flex';
      autoSaveDelayRow.style.alignItems = 'center';
      autoSaveDelayRow.style.gap = '6px';
      autoSaveDelayRow.style.fontSize = '12px';
      var autoSaveDelayLabel = el('span');
      autoSaveDelayLabel.textContent = '遅延:';
      var autoSaveDelayInput = el('input');
      autoSaveDelayInput.type = 'number';
      autoSaveDelayInput.id = 'auto-save-delay-ms';
      autoSaveDelayInput.min = '500';
      autoSaveDelayInput.max = '30000';
      autoSaveDelayInput.step = '500';
      autoSaveDelayInput.value = String(autoSaveCfg.delayMs || 2000);
      autoSaveDelayInput.style.width = '70px';
      var autoSaveDelayUnit = el('span');
      autoSaveDelayUnit.textContent = 'ms';
      autoSaveDelayRow.appendChild(autoSaveDelayLabel);
      autoSaveDelayRow.appendChild(autoSaveDelayInput);
      autoSaveDelayRow.appendChild(autoSaveDelayUnit);

      autoSaveCheck.addEventListener('change', function () {
        withStorage(function (cfg) {
          cfg.autoSave = cfg.autoSave || {};
          cfg.autoSave.enabled = !!autoSaveCheck.checked;
        });
      });

      autoSaveDelayInput.addEventListener('change', function () {
        var val = parseInt(autoSaveDelayInput.value, 10);
        if (isNaN(val) || val < 500) val = 500;
        if (val > 30000) val = 30000;
        autoSaveDelayInput.value = String(val);
        withStorage(function (cfg) {
          cfg.autoSave = cfg.autoSave || {};
          cfg.autoSave.delayMs = val;
        });
      });

      autoSaveRow.appendChild(autoSaveLabel);
      autoSaveRow.appendChild(autoSaveDelayRow);

      // フローティングパネル設定
      var floatRow = el('div');
      floatRow.style.display = 'grid';
      floatRow.style.gap = '6px';
      var floatLabel = el('div'); floatLabel.textContent = 'フローティングパネル'; floatLabel.style.fontSize = '12px'; floatLabel.style.fontWeight = 'bold';

      var floatTabSelect = el('select');
      floatTabSelect.style.width = '100%';
      var tabOptions = [
        { id: 'structure', label: '構造', group: 'structure' },
        { id: 'typography', label: 'テーマ・フォント', group: 'typography' },
        { id: 'assist', label: 'アシスト', group: 'assist' },
        { id: 'wiki', label: 'Wiki', group: 'wiki' }
      ];
      tabOptions.forEach(function (opt) {
        var o = el('option'); o.value = opt.id; o.textContent = opt.label; floatTabSelect.appendChild(o);
      });

      var floatBtnRow = el('div');
      floatBtnRow.style.display = 'flex';
      floatBtnRow.style.gap = '6px';
      var floatBtn = el('button', 'small'); floatBtn.textContent = '表示/非表示';
      var floatCloseBtn = el('button', 'small'); floatCloseBtn.textContent = '閉じる';
      floatBtnRow.appendChild(floatBtn);
      floatBtnRow.appendChild(floatCloseBtn);

      floatRow.appendChild(floatLabel);
      floatRow.appendChild(floatTabSelect);
      floatRow.appendChild(floatBtnRow);

      // フローティングパネル生成/トグル
      function createOrToggleFloatingPanel(tabId) {
        try {
          if (!window.ZenWriterPanels || typeof window.ZenWriterPanels.createDockablePanel !== 'function') {
            alert('Panels API が利用できません');
            return;
          }

          var tabConfig = tabOptions.find(function (t) { return t.id === tabId; });
          if (!tabConfig) return;

          var panelId = tabId + '-floating-panel';
          var existing = document.getElementById(panelId);
          if (existing) {
            window.ZenWriterPanels.togglePanel(panelId);
            return;
          }

          var container = document.createElement('div');
          container.id = tabId + '-floating-gadgets-panel';
          container.className = 'gadgets-panel';
          container.dataset.gadgetGroup = tabConfig.group;
          container.setAttribute('aria-label', tabConfig.label + 'ガジェット (フローティング)');

          var panel = window.ZenWriterPanels.createDockablePanel(panelId, tabConfig.label, container, { width: 320 });

          var floatingContainer = document.getElementById('floating-panels');
          if (!floatingContainer) {
            floatingContainer = document.createElement('div');
            floatingContainer.id = 'floating-panels';
            floatingContainer.className = 'floating-panels';
            document.body.appendChild(floatingContainer);
          }
          floatingContainer.appendChild(panel);

          if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
            window.ZWGadgets.init('#' + container.id, { group: tabConfig.group });
          }
        } catch (_) { }
      }

      floatBtn.addEventListener('click', function () {
        createOrToggleFloatingPanel(floatTabSelect.value);
      });

      floatCloseBtn.addEventListener('click', function () {
        var panelId = floatTabSelect.value + '-floating-panel';
        if (window.ZenWriterPanels) {
          window.ZenWriterPanels.hidePanel(panelId);
        }
      });

      // ガジェットUX設定
      var gadgetUXRow = el('div');
      gadgetUXRow.style.display = 'grid';
      gadgetUXRow.style.gap = '6px';

      var gadgetUXLabel = el('div');
      gadgetUXLabel.textContent = 'ガジェット表示';
      gadgetUXLabel.style.fontSize = '12px';
      gadgetUXLabel.style.fontWeight = 'bold';

      // ヘルプアイコン表示トグル
      var helpIconRow = el('label');
      helpIconRow.style.display = 'flex';
      helpIconRow.style.alignItems = 'center';
      helpIconRow.style.gap = '6px';
      var helpIconCheck = el('input');
      helpIconCheck.type = 'checkbox';
      helpIconCheck.checked = localStorage.getItem('zenwriter-gadget-help-visible') !== 'false';
      var helpIconText = el('span');
      helpIconText.textContent = 'ガジェットヘルプアイコンを表示';
      helpIconRow.appendChild(helpIconCheck);
      helpIconRow.appendChild(helpIconText);

      helpIconCheck.addEventListener('change', function() {
        localStorage.setItem('zenwriter-gadget-help-visible', helpIconCheck.checked ? 'true' : 'false');
        // 即座に反映
        document.querySelectorAll('.gadget-help-btn').forEach(function(btn) {
          btn.style.display = helpIconCheck.checked ? '' : 'none';
        });
      });

      // 一括操作ボタン表示トグル
      var bulkToggleRow = el('label');
      bulkToggleRow.style.display = 'flex';
      bulkToggleRow.style.alignItems = 'center';
      bulkToggleRow.style.gap = '6px';
      var bulkToggleCheck = el('input');
      bulkToggleCheck.type = 'checkbox';
      bulkToggleCheck.checked = localStorage.getItem('zenwriter-gadget-bulk-toggle-visible') !== 'false';
      var bulkToggleText = el('span');
      bulkToggleText.textContent = '一括折りたたみボタンを表示';
      bulkToggleRow.appendChild(bulkToggleCheck);
      bulkToggleRow.appendChild(bulkToggleText);

      bulkToggleCheck.addEventListener('change', function() {
        localStorage.setItem('zenwriter-gadget-bulk-toggle-visible', bulkToggleCheck.checked ? 'true' : 'false');
        // 即座に反映
        document.querySelectorAll('.gadget-bulk-toggle-btn').forEach(function(btn) {
          btn.style.display = bulkToggleCheck.checked ? '' : 'none';
        });
      });

      gadgetUXRow.appendChild(gadgetUXLabel);
      gadgetUXRow.appendChild(helpIconRow);
      gadgetUXRow.appendChild(bulkToggleRow);

      root.appendChild(presRow); root.appendChild(placementRow); root.appendChild(orderRow); root.appendChild(styleRow); root.appendChild(widthRow); root.appendChild(autoSaveRow); root.appendChild(tabRow); root.appendChild(manageRow); root.appendChild(fontRow); root.appendChild(placeholderRow); root.appendChild(textboxRow); root.appendChild(floatRow); root.appendChild(gadgetUXRow);
    }, { title: 'UI Settings', groups: ['advanced'], description: 'UIの表示設定。プレゼンテーション、サイドバー配置、フォントサイズなど。' });

    // UI Design Gadget (background gradient)
    window.ZWGadgets.register('UIDesign', function (root, api) {
      var s = window.ZenWriterStorage.loadSettings();
      var ui = (s && s.ui) || {};
      var g = ui.bgGradient || { enabled: false, type: 'linear', angle: 135, c1: '#101318', c2: '#262f3f', opacity: 0.35 };
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '6px';

      function hexToRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) { h = h.split('').map(x => x + x).join(''); } var n = parseInt(h, 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
      function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
      function apply(cfg) {
        var v = 'none';
        if (cfg.enabled) {
          var a = Math.max(0, Math.min(1, Number(cfg.opacity) || 0));
          var c1 = rgba(cfg.c1 || '#000', a), c2 = rgba(cfg.c2 || '#000', a);
          if (cfg.type === 'radial') v = 'radial-gradient(circle at 50% 40%, ' + c1 + ' 0%, ' + c2 + ' 70%)';
          else v = 'linear-gradient(' + (Number(cfg.angle) || 0) + 'deg, ' + c1 + ' 0%, ' + c2 + ' 100%)';
        }
        document.documentElement.style.setProperty('--app-bg-gradient', v);
        withStorage(function (cfgS) { cfgS.ui = cfgS.ui || {}; cfgS.ui.bgGradient = g; });
        if (api && typeof api.refresh === 'function') api.refresh();
      }

      var row0 = el('label', 'toggle-switch');
      var enable = el('input'); enable.type = 'checkbox'; enable.checked = !!g.enabled;
      var l0 = el('span'); l0.textContent = '背景グラデーション';
      row0.appendChild(enable); row0.appendChild(l0);
      var typeSel = el('select');['linear', 'radial'].forEach(function (t) { var o = el('option'); o.value = t; o.textContent = t; typeSel.appendChild(o); }); typeSel.value = String(g.type || 'linear');
      var angle = el('input'); angle.type = 'range'; angle.min = '0'; angle.max = '360'; angle.step = '1'; angle.value = String(g.angle || 135); var aLbl = el('div'); aLbl.textContent = '角度: ' + angle.value + '°'; aLbl.style.fontSize = '12px'; var row1 = el('div'); row1.appendChild(aLbl); row1.appendChild(angle);
      var c1 = el('input'); c1.type = 'color'; c1.value = String(g.c1 || '#101318'); var c2 = el('input'); c2.type = 'color'; c2.value = String(g.c2 || '#262f3f'); var row2 = el('div'); row2.style.display = 'flex'; row2.style.gap = '8px'; row2.appendChild(c1); row2.appendChild(c2);
      var op = el('input'); op.type = 'range'; op.min = '0'; op.max = '1'; op.step = '0.05'; op.value = String(typeof g.opacity === 'number' ? g.opacity : 0.35); var oLbl = el('div'); oLbl.textContent = '強度: ' + op.value; oLbl.style.fontSize = '12px'; var row3 = el('div'); row3.appendChild(oLbl); row3.appendChild(op);
      var btn = el('button', 'small'); btn.textContent = '適用';

      enable.addEventListener('change', function () { g.enabled = !!enable.checked; apply(g); });
      typeSel.addEventListener('change', function () { g.type = String(typeSel.value || 'linear'); apply(g); });
      angle.addEventListener('input', function () { aLbl.textContent = '角度: ' + angle.value + '°'; });
      angle.addEventListener('change', function () { g.angle = parseInt(angle.value, 10) || 0; apply(g); });
      c1.addEventListener('change', function () { g.c1 = String(c1.value || '#101318'); apply(g); });
      c2.addEventListener('change', function () { g.c2 = String(c2.value || '#262f3f'); apply(g); });
      op.addEventListener('input', function () { oLbl.textContent = '強度: ' + op.value; });
      op.addEventListener('change', function () { g.opacity = Math.max(0, Math.min(1, parseFloat(op.value) || 0.35)); apply(g); });
      btn.addEventListener('click', function () { apply(g); });

      root.appendChild(row0); root.appendChild(typeSel); root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(btn);
      apply(g);
    }, { title: 'UI Design', groups: ['advanced'], description: '背景グラデーションの設定。色、角度、強度をカスタマイズ。' });

    // Font Decoration Gadget (パネルのミラー)
    window.ZWGadgets.register('FontDecoration', function (root) {
      root.innerHTML = '';
      var mkBtn = function (id, label) { var b = el('button', 'decor-btn'); b.dataset.tag = id; b.textContent = label; b.style.margin = '2px'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('bold', 'B')); row1.appendChild(mkBtn('italic', 'I')); row1.appendChild(mkBtn('underline', 'U')); row1.appendChild(mkBtn('strike', 'S')); row1.appendChild(mkBtn('black', '極'));
      var row2 = el('div'); row2.appendChild(mkBtn('light', '細')); row2.appendChild(mkBtn('smallcaps', 'SC')); row2.appendChild(mkBtn('shadow', '影')); row2.appendChild(mkBtn('outline', '輪')); row2.appendChild(mkBtn('glow', '光'));
      var row3 = el('div'); row3.appendChild(mkBtn('uppercase', '大')); row3.appendChild(mkBtn('lowercase', '小')); row3.appendChild(mkBtn('capitalize', '頭')); row3.appendChild(mkBtn('wide', '広')); row3.appendChild(mkBtn('narrow', '狭'));
      var row4 = el('div'); row4.appendChild(mkBtn('kenten', '傍点'));
      function bind(container) {
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function (btn) { btn.addEventListener('click', function () { try { var tag = btn.dataset.tag; if (tag === 'kenten') { var rich = window.ZenWriterEditor && window.ZenWriterEditor.richTextEditor; if (rich && rich.isWysiwygMode && typeof rich.wrapSelectionWithSpan === 'function') { rich.wrapSelectionWithSpan('kenten'); } else if (window.ZenWriterEditor && typeof window.ZenWriterEditor.insertTextAtCursor === 'function') { window.ZenWriterEditor.insertTextAtCursor('{kenten|', { suffix: '}' }); } } else if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') { window.ZenWriterEditor.applyFontDecoration(tag); } } catch (_) { } }); });
      }
      root.appendChild(row1); root.appendChild(row2); root.appendChild(row3); root.appendChild(row4); bind(root);
    }, { title: 'Font Decoration', groups: ['edit'], description: 'テキストに太字・斜体・下線・影などの装飾を適用。' });

    // Text Animation Gadget (パネルのミラー)
    window.ZWGadgets.register('TextAnimation', function (root) {
      root.innerHTML = '';
      var mkBtn = function (id, label) { var b = el('button', 'decor-btn'); b.dataset.tag = id; b.textContent = label; b.style.margin = '2px'; return b; };
      var row1 = el('div'); row1.appendChild(mkBtn('fade', 'フェード')); row1.appendChild(mkBtn('slide', 'スライド')); row1.appendChild(mkBtn('type', 'タイプ')); row1.appendChild(mkBtn('pulse', 'パルス'));
      var row2 = el('div'); row2.appendChild(mkBtn('shake', 'シェイク')); row2.appendChild(mkBtn('bounce', 'バウンス')); row2.appendChild(mkBtn('fadein', '遅フェード'));
      function bind(container) {
        var btns = container.querySelectorAll('.decor-btn');
        btns.forEach(function (btn) { btn.addEventListener('click', function () { try { if (window.ZenWriterEditor && typeof window.ZenWriterEditor.applyFontDecoration === 'function') { window.ZenWriterEditor.applyFontDecoration(btn.dataset.tag); } } catch (_) { } }); });
      }
      root.appendChild(row1); root.appendChild(row2); bind(root);
    }, { title: 'Text Animation', groups: ['edit'], description: 'テキストにフェード・スライド・バウンスなどのアニメーション効果を適用。' });

    // Editor Layout Gadget (余白・幅・背景色)
    window.ZWGadgets.register('EditorLayout', function (root) {
      var s = window.ZenWriterStorage.loadSettings();
      var layout = (s && s.editorLayout) || {};
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '8px';

      // 最大幅設定
      var maxWidthRow = el('div');
      var maxWidthLabel = el('div'); maxWidthLabel.textContent = '最大幅 (0=全幅)'; maxWidthLabel.style.fontSize = '12px';
      var maxWidthInput = el('input'); maxWidthInput.type = 'number'; maxWidthInput.min = '0'; maxWidthInput.max = '2000'; maxWidthInput.step = '50';
      maxWidthInput.value = String(typeof layout.maxWidth === 'number' ? layout.maxWidth : 900);
      maxWidthRow.appendChild(maxWidthLabel); maxWidthRow.appendChild(maxWidthInput);

      // padding設定
      var paddingRow = el('div');
      var paddingLabel = el('div'); paddingLabel.textContent = '内余白 (px)'; paddingLabel.style.fontSize = '12px';
      var paddingInput = el('input'); paddingInput.type = 'number'; paddingInput.min = '0'; paddingInput.max = '100'; paddingInput.step = '5';
      paddingInput.value = String(typeof layout.padding === 'number' ? layout.padding : 32);
      paddingRow.appendChild(paddingLabel); paddingRow.appendChild(paddingInput);

      // 余白エリア背景色
      var marginBgRow = el('div');
      var marginBgLabel = el('div'); marginBgLabel.textContent = '余白背景色'; marginBgLabel.style.fontSize = '12px';
      var marginBgInput = el('input'); marginBgInput.type = 'color';
      marginBgInput.value = layout.marginBgColor || '#f5f5dc';
      marginBgRow.appendChild(marginBgLabel); marginBgRow.appendChild(marginBgInput);

      // 適用ボタン
      var applyBtn = el('button', 'small'); applyBtn.textContent = '適用';

      function applyLayout() {
        var maxW = toInt(maxWidthInput.value, 900);
        var pad = toInt(paddingInput.value, 32);
        var bg = marginBgInput.value || '#f5f5dc';

        withStorage(function (cfg) {
          cfg.editorLayout = cfg.editorLayout || {};
          cfg.editorLayout.maxWidth = maxW;
          cfg.editorLayout.padding = pad;
          cfg.editorLayout.marginBgColor = bg;
        });

        // Apply to DOM
        var editor = document.getElementById('editor');
        var container = document.querySelector('.editor-container');

        if (editor) {
          editor.style.maxWidth = maxW > 0 ? maxW + 'px' : 'none';
          editor.style.padding = pad + 'px';
        }

        if (container) {
          if ((maxW > 0 || pad > 0) && bg) {
            container.style.backgroundColor = bg;
          } else {
            // 余白がない場合はテーマ側の背景色に戻す
            container.style.backgroundColor = '';
          }
        }
      }

      applyBtn.addEventListener('click', applyLayout);

      root.appendChild(maxWidthRow);
      root.appendChild(paddingRow);
      root.appendChild(marginBgRow);
      root.appendChild(applyBtn);
    }, { title: 'Editor Layout', groups: ['advanced'], description: 'エディタの最大幅、内余白、余白背景色を調整。' });

    // Scene Gradient Gadget (背景グラデーション 3レイヤ)
    window.ZWGadgets.register('SceneGradient', function (root, api) {
      var s = window.ZenWriterStorage.loadSettings();
      var scene = (s && s.scene) || {};
      var base = scene.base || { enabled: false, type: 'linear', angle: 180, c1: '#f5f5dc', c2: '#e0e0c0', strength: 0.5 };
      var pattern = scene.pattern || { enabled: false, type: 'repeating-linear', angle: 45, c1: '#ffffff', c2: '#e0e0e0', size: 50, strength: 0.3 };
      var overlay = scene.overlay || { enabled: false, type: 'radial', c1: '#000000', c2: 'transparent', strength: 0.2 };
      root.innerHTML = ''; root.style.display = 'grid'; root.style.gap = '12px';

      function applyScene() {
        var layers = [];

        // Overlay Layer (最前面)
        if (overlay.enabled) {
          var oStr = Math.max(0, Math.min(1, Number(overlay.strength) || 0));
          var oc1 = rgba(overlay.c1 || '#000', oStr);
          var oc2 = overlay.type === 'radial' ? rgba(overlay.c2 || 'transparent', 0) : rgba(overlay.c2 || '#000', oStr);
          if (overlay.type === 'radial') {
            layers.push('radial-gradient(ellipse at center, ' + oc2 + ' 0%, ' + oc1 + ' 100%)');
          } else {
            layers.push('linear-gradient(180deg, ' + oc1 + ' 0%, ' + oc2 + ' 100%)');
          }
        }

        // Pattern Layer
        if (pattern.enabled) {
          var pStr = Math.max(0, Math.min(1, Number(pattern.strength) || 0));
          var pc1 = rgba(pattern.c1 || '#fff', pStr);
          var pc2 = rgba(pattern.c2 || '#e0e0e0', pStr);
          var size = Math.max(10, Number(pattern.size) || 50);
          var angle = Number(pattern.angle) || 45;
          if (pattern.type === 'repeating-linear') {
            layers.push('repeating-linear-gradient(' + angle + 'deg, ' + pc1 + ' 0px, ' + pc2 + ' ' + size + 'px)');
          } else {
            layers.push('repeating-radial-gradient(circle, ' + pc1 + ' 0px, ' + pc2 + ' ' + size + 'px)');
          }
        }

        // Base Layer (背面)
        if (base.enabled) {
          var bStr = Math.max(0, Math.min(1, Number(base.strength) || 0));
          var bc1 = rgba(base.c1 || '#f5f5dc', bStr);
          var bc2 = rgba(base.c2 || '#e0e0c0', bStr);
          var angle = Number(base.angle) || 180;
          if (base.type === 'solid') {
            layers.push(bc1);
          } else if (base.type === 'radial') {
            layers.push('radial-gradient(circle at 50% 50%, ' + bc1 + ' 0%, ' + bc2 + ' 100%)');
          } else {
            layers.push('linear-gradient(' + angle + 'deg, ' + bc1 + ' 0%, ' + bc2 + ' 100%)');
          }
        }

        var editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
          if (layers.length > 0) {
            editorContainer.style.backgroundImage = layers.join(', ');
          } else {
            editorContainer.style.backgroundImage = '';
          }
        }

        withStorage(function (cfg) { cfg.scene = { base: base, pattern: pattern, overlay: overlay }; });
        if (api && typeof api.refresh === 'function') api.refresh();
      }

      // Base Layer UI
      var baseTitle = el('div'); baseTitle.textContent = 'Base Layer'; baseTitle.style.fontWeight = 'bold'; baseTitle.style.fontSize = '14px';
      var baseRow0 = el('label', 'toggle-switch toggle-compact');
      var baseEnable = el('input'); baseEnable.type = 'checkbox'; baseEnable.checked = !!base.enabled;
      baseRow0.appendChild(baseEnable);
      var baseType = el('select');['solid', 'linear', 'radial'].forEach(function (t) { var o = el('option'); o.value = t; o.textContent = t; baseType.appendChild(o); }); baseType.value = String(base.type || 'linear');
      var baseAngle = el('input'); baseAngle.type = 'range'; baseAngle.min = '0'; baseAngle.max = '360'; baseAngle.step = '1'; baseAngle.value = String(base.angle || 180); var baseALbl = el('div'); baseALbl.textContent = '角度: ' + baseAngle.value + '°'; baseALbl.style.fontSize = '12px'; var baseRow1 = el('div'); baseRow1.appendChild(baseALbl); baseRow1.appendChild(baseAngle);
      var baseC1 = el('input'); baseC1.type = 'color'; baseC1.value = String(base.c1 || '#f5f5dc'); var baseC2 = el('input'); baseC2.type = 'color'; baseC2.value = String(base.c2 || '#e0e0c0'); var baseRow2 = createColorPickerRow(baseC1, baseC2);
      var baseStr = el('input'); baseStr.type = 'range'; baseStr.min = '0'; baseStr.max = '1'; baseStr.step = '0.05'; baseStr.value = String(typeof base.strength === 'number' ? base.strength : 0.5); var baseSLbl = el('div'); baseSLbl.textContent = '強度: ' + baseStr.value; baseSLbl.style.fontSize = '12px'; var baseRow3 = el('div'); baseRow3.appendChild(baseSLbl); baseRow3.appendChild(baseStr);

      baseEnable.addEventListener('change', function () { base.enabled = !!baseEnable.checked; applyScene(); });
      baseType.addEventListener('change', function () { base.type = String(baseType.value || 'linear'); applyScene(); });
      baseAngle.addEventListener('input', function () { baseALbl.textContent = '角度: ' + baseAngle.value + '°'; });
      baseAngle.addEventListener('change', function () { base.angle = parseInt(baseAngle.value, 10) || 0; applyScene(); });
      baseC1.addEventListener('change', function () { base.c1 = String(baseC1.value || '#f5f5dc'); applyScene(); });
      baseC2.addEventListener('change', function () { base.c2 = String(baseC2.value || '#e0e0c0'); applyScene(); });
      baseStr.addEventListener('input', function () { baseSLbl.textContent = '強度: ' + baseStr.value; });
      baseStr.addEventListener('change', function () { base.strength = parseFloat(baseStr.value) || 0.5; applyScene(); });

      // Pattern Layer UI
      var patternTitle = el('div'); patternTitle.textContent = 'Pattern Layer'; patternTitle.style.fontWeight = 'bold'; patternTitle.style.fontSize = '14px'; patternTitle.style.marginTop = '8px';
      var patternRow0 = el('label', 'toggle-switch toggle-compact');
      var patternEnable = el('input'); patternEnable.type = 'checkbox'; patternEnable.checked = !!pattern.enabled;
      patternRow0.appendChild(patternEnable);
      var patternType = el('select');['repeating-linear', 'repeating-radial'].forEach(function (t) { var o = el('option'); o.value = t; o.textContent = t; patternType.appendChild(o); }); patternType.value = String(pattern.type || 'repeating-linear');
      var patternAngle = el('input'); patternAngle.type = 'range'; patternAngle.min = '0'; patternAngle.max = '360'; patternAngle.step = '1'; patternAngle.value = String(pattern.angle || 45); var patternALbl = el('div'); patternALbl.textContent = '角度: ' + patternAngle.value + '°'; patternALbl.style.fontSize = '12px'; var patternRow1 = el('div'); patternRow1.appendChild(patternALbl); patternRow1.appendChild(patternAngle);
      var patternSize = el('input'); patternSize.type = 'range'; patternSize.min = '10'; patternSize.max = '200'; patternSize.step = '5'; patternSize.value = String(pattern.size || 50); var patternSzLbl = el('div'); patternSzLbl.textContent = 'サイズ: ' + patternSize.value + 'px'; patternSzLbl.style.fontSize = '12px'; var patternRow2 = createRangeRow('サイズ: ' + patternSize.value + 'px', patternSize);
      var patternC1 = el('input'); patternC1.type = 'color'; patternC1.value = String(pattern.c1 || '#ffffff'); var patternC2 = el('input'); patternC2.type = 'color'; patternC2.value = String(pattern.c2 || '#e0e0e0'); var patternRow3 = createColorPickerRow(patternC1, patternC2);
      var patternStr = el('input'); patternStr.type = 'range'; patternStr.min = '0'; patternStr.max = '1'; patternStr.step = '0.05'; patternStr.value = String(typeof pattern.strength === 'number' ? pattern.strength : 0.3); var patternSLbl = el('div'); patternSLbl.textContent = '強度: ' + patternStr.value; patternSLbl.style.fontSize = '12px'; var patternRow4 = el('div'); patternRow4.appendChild(patternSLbl); patternRow4.appendChild(patternStr);

      patternEnable.addEventListener('change', function () { pattern.enabled = !!patternEnable.checked; applyScene(); });
      patternType.addEventListener('change', function () { pattern.type = String(patternType.value || 'repeating-linear'); applyScene(); });
      patternAngle.addEventListener('input', function () { patternALbl.textContent = '角度: ' + patternAngle.value + '°'; });
      patternAngle.addEventListener('change', function () { pattern.angle = parseInt(patternAngle.value, 10) || 0; applyScene(); });
      patternSize.addEventListener('input', function () { patternSzLbl.textContent = 'サイズ: ' + patternSize.value + 'px'; });
      patternSize.addEventListener('change', function () { pattern.size = parseInt(patternSize.value, 10) || 50; applyScene(); });
      patternC1.addEventListener('change', function () { pattern.c1 = String(patternC1.value || '#ffffff'); applyScene(); });
      patternC2.addEventListener('change', function () { pattern.c2 = String(patternC2.value || '#e0e0e0'); applyScene(); });
      patternStr.addEventListener('input', function () { patternSLbl.textContent = '強度: ' + patternStr.value; });
      patternStr.addEventListener('change', function () { pattern.strength = parseFloat(patternStr.value) || 0.3; applyScene(); });

      // Overlay Layer UI
      var overlayTitle = el('div'); overlayTitle.textContent = 'Overlay Layer'; overlayTitle.style.fontWeight = 'bold'; overlayTitle.style.fontSize = '14px'; overlayTitle.style.marginTop = '8px';
      var overlayRow0 = el('label', 'toggle-switch toggle-compact');
      var overlayEnable = el('input'); overlayEnable.type = 'checkbox'; overlayEnable.checked = !!overlay.enabled;
      overlayRow0.appendChild(overlayEnable);
      var overlayType = el('select');['radial', 'linear'].forEach(function (t) { var o = el('option'); o.value = t; o.textContent = t; overlayType.appendChild(o); }); overlayType.value = String(overlay.type || 'radial');
      var overlayC1 = el('input'); overlayC1.type = 'color'; overlayC1.value = String(overlay.c1 || '#000000'); var overlayC2 = el('input'); overlayC2.type = 'color'; overlayC2.value = String(overlay.c2 || '#ffffff'); var overlayRow1 = createColorPickerRow(overlayC1, overlayC2);
      var overlayStr = el('input'); overlayStr.type = 'range'; overlayStr.min = '0'; overlayStr.max = '1'; overlayStr.step = '0.05'; overlayStr.value = String(typeof overlay.strength === 'number' ? overlay.strength : 0.2); var overlaySLbl = el('div'); overlaySLbl.textContent = '強度: ' + overlayStr.value; overlaySLbl.style.fontSize = '12px'; var overlayRow2 = el('div'); overlayRow2.appendChild(overlaySLbl); overlayRow2.appendChild(overlayStr);

      overlayEnable.addEventListener('change', function () { overlay.enabled = !!overlayEnable.checked; applyScene(); });
      overlayType.addEventListener('change', function () { overlay.type = String(overlayType.value || 'radial'); applyScene(); });
      overlayC1.addEventListener('change', function () { overlay.c1 = String(overlayC1.value || '#000000'); applyScene(); });
      overlayC2.addEventListener('change', function () { overlay.c2 = String(overlayC2.value || '#ffffff'); applyScene(); });
      overlayStr.addEventListener('input', function () { overlaySLbl.textContent = '強度: ' + overlayStr.value; });
      overlayStr.addEventListener('change', function () { overlay.strength = parseFloat(overlayStr.value) || 0.2; applyScene(); });

      var applyBtn = el('button', 'small'); applyBtn.textContent = '適用'; applyBtn.addEventListener('click', applyScene);

      root.appendChild(baseTitle); root.appendChild(baseRow0); root.appendChild(baseType); root.appendChild(baseRow1); root.appendChild(baseRow2); root.appendChild(baseRow3);
      root.appendChild(patternTitle); root.appendChild(patternRow0); root.appendChild(patternType); root.appendChild(patternRow1); root.appendChild(patternRow2); root.appendChild(patternRow3); root.appendChild(patternRow4);
      root.appendChild(overlayTitle); root.appendChild(overlayRow0); root.appendChild(overlayType); root.appendChild(overlayRow1); root.appendChild(overlayRow2);
      root.appendChild(applyBtn);

      applyScene();
    }, { title: 'Scene Gradient', groups: ['theme'], description: 'シーンに合わせた3層グラデーション背景。雰囲気を視覚的に演出。' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', register); else register();
})();
