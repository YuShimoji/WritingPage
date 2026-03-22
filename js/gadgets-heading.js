/**
 * gadgets-heading.js
 * 見出しタイポグラフィ設定ガジェット (SP-058 Phase 2+3)
 * 責務: 見出しプリセット選択、ミニプレビュー、H1-H6 個別調整
 */
(function () {
  'use strict';

  var utils = window.ZWGadgetsUtils;
  var ZWGadgets = window.ZWGadgets;
  if (!utils || !ZWGadgets) return;

  var DETAIL_LEVELS = ['h1', 'h2', 'h3'];
  var SIMPLE_LEVELS = ['h4', 'h5', 'h6'];
  var ALL_LEVELS = DETAIL_LEVELS.concat(SIMPLE_LEVELS);
  var LEVEL_LABELS = {
    h1: '見出し1', h2: '見出し2', h3: '見出し3',
    h4: '見出し4', h5: '見出し5', h6: '見出し6'
  };
  var WEIGHT_OPTIONS = [
    { value: 'normal', label: '標準' },
    { value: '500', label: '中太' },
    { value: '600', label: 'やや太' },
    { value: 'bold', label: '太字' },
    { value: '800', label: '極太' },
    { value: '900', label: '最太' }
  ];
  var H46_STORAGE_KEY = 'zenwriter-heading-h46-open';

  ZWGadgets.register('HeadingStyles', function (el) {
    try {
      var theme = window.ZenWriterTheme;
      var storage = window.ZenWriterStorage;
      var registry = window.HeadingPresetRegistry;
      if (!theme || !storage || !registry) {
        var warn = document.createElement('p');
        warn.textContent = '見出し設定を読み込めません。';
        warn.style.opacity = '0.7';
        warn.style.fontSize = '0.9rem';
        el.appendChild(warn);
        return;
      }

      var settings = storage.loadSettings() || {};
      var headingSettings = settings.heading || { preset: 'default', custom: {} };

      var wrap = document.createElement('div');
      wrap.className = 'gadget-heading-styles';
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.gap = '0.75rem';

      function makeSection(title) {
        var section = document.createElement('div');
        section.className = 'heading-section';
        var heading = document.createElement('h4');
        heading.textContent = title;
        heading.style.margin = '0';
        heading.style.fontSize = '0.95rem';
        section.appendChild(heading);
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '0.375rem';
        return section;
      }

      // --- セクション1: プリセット選択 ---
      var presetSection = makeSection('プリセット');
      var presetSelect = document.createElement('select');
      presetSelect.id = 'heading-preset-select';

      function rebuildPresetSelect(selectedId) {
        presetSelect.innerHTML = '';
        var latest = storage.loadSettings() || {};
        var all = registry.listAllPresets(latest);
        var builtInGroup = document.createElement('optgroup');
        builtInGroup.label = '組み込み';
        var userGroup = null;
        all.forEach(function (p) {
          var opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.label;
          if (p.builtIn) {
            builtInGroup.appendChild(opt);
          } else {
            if (!userGroup) {
              userGroup = document.createElement('optgroup');
              userGroup.label = 'カスタム';
            }
            opt.setAttribute('data-user-defined', 'true');
            userGroup.appendChild(opt);
          }
        });
        presetSelect.appendChild(builtInGroup);
        if (userGroup) presetSelect.appendChild(userGroup);
        presetSelect.value = selectedId || 'default';
        updateDeleteBtnVisibility();
      }

      rebuildPresetSelect(headingSettings.preset || 'default');
      presetSelect.addEventListener('change', function () {
        currentCustom = {};
        applyAndRefreshUI();
        updateDeleteBtnVisibility();
      });
      presetSection.appendChild(presetSelect);

      // 保存/削除ボタン行
      var presetBtnRow = document.createElement('div');
      presetBtnRow.style.cssText = 'display:flex;gap:0.375rem;align-items:center;';

      var savePresetBtn = document.createElement('button');
      savePresetBtn.type = 'button';
      savePresetBtn.className = 'small';
      savePresetBtn.textContent = '現在の設定を保存';
      savePresetBtn.addEventListener('click', function () {
        var name = prompt('プリセット名を入力:');
        if (!name || !name.trim()) return;
        var merged = getMergedValues();
        var entry = registry.saveUserPreset(storage, name.trim(), merged);
        if (!entry) { alert('保存に失敗しました（上限に達している可能性があります）'); return; }
        rebuildPresetSelect(entry.id);
        presetSelect.value = entry.id;
        currentCustom = {};
        applyAndRefreshUI();
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) {}
      });
      presetBtnRow.appendChild(savePresetBtn);

      var deletePresetBtn = document.createElement('button');
      deletePresetBtn.type = 'button';
      deletePresetBtn.className = 'small';
      deletePresetBtn.textContent = '削除';
      deletePresetBtn.style.display = 'none';
      deletePresetBtn.addEventListener('click', function () {
        var id = presetSelect.value;
        if (!registry.isUserPreset(id)) return;
        if (!confirm('このプリセットを削除しますか？')) return;
        registry.deleteUserPreset(storage, id);
        currentCustom = {};
        rebuildPresetSelect('default');
        applyAndRefreshUI();
        try { window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged')); } catch (_) {}
      });
      presetBtnRow.appendChild(deletePresetBtn);
      presetSection.appendChild(presetBtnRow);

      function updateDeleteBtnVisibility() {
        if (!deletePresetBtn) return;
        deletePresetBtn.style.display = registry.isUserPreset(presetSelect.value) ? 'inline-block' : 'none';
      }

      // --- セクション2: ミニプレビュー ---
      var previewBox = document.createElement('div');
      previewBox.className = 'heading-preview';
      previewBox.style.background = 'var(--hover-bg-color, rgba(128,128,128,0.08))';
      previewBox.style.borderRadius = '6px';
      previewBox.style.padding = '0.5rem 0.625rem';
      previewBox.style.display = 'flex';
      previewBox.style.flexDirection = 'column';
      previewBox.style.gap = '0.125rem';

      var previewLines = {};
      ALL_LEVELS.forEach(function (level) {
        var line = document.createElement('div');
        line.style.fontWeight = 'bold';
        line.style.lineHeight = '1.3';
        line.style.whiteSpace = 'nowrap';
        line.style.overflow = 'hidden';
        line.style.textOverflow = 'ellipsis';
        line.textContent = level.toUpperCase() + ' 見出しサンプル';
        previewBox.appendChild(line);
        previewLines[level] = line;
      });
      presetSection.appendChild(previewBox);
      wrap.appendChild(presetSection);

      // --- セクション3: H1-H3 個別調整（詳細） ---
      var currentCustom = headingSettings.custom && typeof headingSettings.custom === 'object'
        ? JSON.parse(JSON.stringify(headingSettings.custom))
        : {};
      var levelControls = {};

      var adjustSection = makeSection('個別調整 (H1-H3)');

      DETAIL_LEVELS.forEach(function (level) {
        var levelWrap = document.createElement('div');
        levelWrap.style.display = 'flex';
        levelWrap.style.flexDirection = 'column';
        levelWrap.style.gap = '0.25rem';
        levelWrap.style.paddingTop = '0.25rem';
        if (level !== 'h1') {
          levelWrap.style.borderTop = '1px solid var(--border-color)';
          levelWrap.style.marginTop = '0.25rem';
        }

        var levelLabel = document.createElement('div');
        levelLabel.style.fontSize = '0.85rem';
        levelLabel.style.fontWeight = '600';
        levelLabel.textContent = LEVEL_LABELS[level];
        levelWrap.appendChild(levelLabel);

        var ctrl = {};

        // size slider
        var sizeRow = makeSliderRow('サイズ', 0.8, 3, 0.05, 'em', level, 'size', ctrl);
        levelWrap.appendChild(sizeRow);

        // weight select
        var weightRow = document.createElement('div');
        weightRow.style.display = 'flex';
        weightRow.style.alignItems = 'center';
        weightRow.style.gap = '0.375rem';
        var weightLabel = document.createElement('span');
        weightLabel.style.fontSize = '0.8rem';
        weightLabel.style.opacity = '0.8';
        weightLabel.style.minWidth = '32px';
        weightLabel.textContent = '太さ:';
        var weightSelect = document.createElement('select');
        weightSelect.setAttribute('data-level', level);
        weightSelect.setAttribute('data-prop', 'weight');
        weightSelect.style.flex = '1';
        WEIGHT_OPTIONS.forEach(function (w) {
          var opt = document.createElement('option');
          opt.value = w.value;
          opt.textContent = w.label;
          weightSelect.appendChild(opt);
        });
        weightSelect.addEventListener('change', function () {
          onCustomChange(level, 'weight', weightSelect.value);
        });
        weightRow.appendChild(weightLabel);
        weightRow.appendChild(weightSelect);
        levelWrap.appendChild(weightRow);
        ctrl.weightSelect = weightSelect;

        // lineHeight slider
        var lhRow = makeSliderRow('行間', 1.0, 2.5, 0.05, '', level, 'lineHeight', ctrl);
        levelWrap.appendChild(lhRow);

        // letterSpacing slider
        var lsRow = makeSliderRow('字間', -0.05, 0.2, 0.01, 'em', level, 'letterSpacing', ctrl);
        levelWrap.appendChild(lsRow);

        adjustSection.appendChild(levelWrap);
        levelControls[level] = ctrl;
      });

      // リセットボタン
      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'small';
      resetBtn.id = 'heading-reset-btn';
      resetBtn.textContent = 'プリセットに戻す';
      resetBtn.addEventListener('click', function () {
        currentCustom = {};
        applyAndRefreshUI();
      });
      adjustSection.appendChild(resetBtn);
      wrap.appendChild(adjustSection);

      // --- セクション4: H4-H6 簡易調整（折りたたみ） ---
      var h46Section = document.createElement('div');
      h46Section.className = 'heading-section';

      var h46Header = document.createElement('div');
      h46Header.style.cssText = 'cursor:pointer;display:flex;align-items:center;gap:0.25rem;font-size:0.9rem;font-weight:600;user-select:none;';
      var h46Arrow = document.createElement('span');
      h46Arrow.style.cssText = 'font-size:0.7rem;width:12px;display:inline-block;transition:transform 0.15s;';
      var h46Title = document.createElement('span');
      h46Title.textContent = 'H4-H6 調整';
      h46Header.appendChild(h46Arrow);
      h46Header.appendChild(h46Title);
      h46Section.appendChild(h46Header);

      var h46Content = document.createElement('div');
      h46Content.style.display = 'flex';
      h46Content.style.flexDirection = 'column';
      h46Content.style.gap = '0.25rem';
      h46Content.style.paddingLeft = '0.25rem';

      SIMPLE_LEVELS.forEach(function (level) {
        var levelWrap = document.createElement('div');
        levelWrap.style.display = 'flex';
        levelWrap.style.flexDirection = 'column';
        levelWrap.style.gap = '0.25rem';
        levelWrap.style.paddingTop = '0.25rem';
        if (level !== 'h4') {
          levelWrap.style.borderTop = '1px solid var(--border-color)';
          levelWrap.style.marginTop = '0.25rem';
        }

        var levelLabel = document.createElement('div');
        levelLabel.style.fontSize = '0.85rem';
        levelLabel.style.fontWeight = '600';
        levelLabel.textContent = LEVEL_LABELS[level];
        levelWrap.appendChild(levelLabel);

        var ctrl = {};

        // size slider only
        var sizeRow = makeSliderRow('サイズ', 0.8, 2, 0.05, 'em', level, 'size', ctrl);
        levelWrap.appendChild(sizeRow);

        h46Content.appendChild(levelWrap);
        levelControls[level] = ctrl;
      });

      h46Section.appendChild(h46Content);

      // H4-H6 collapse logic
      var h46Open = false;
      try { h46Open = localStorage.getItem(H46_STORAGE_KEY) === 'true'; } catch (_) {}
      function setH46Open(open) {
        h46Open = open;
        h46Arrow.textContent = open ? '\u25BC' : '\u25B6';
        h46Content.style.display = open ? 'flex' : 'none';
        try { localStorage.setItem(H46_STORAGE_KEY, open ? 'true' : 'false'); } catch (_) {}
      }
      h46Header.addEventListener('click', function () { setH46Open(!h46Open); });
      setH46Open(h46Open);

      wrap.appendChild(h46Section);
      el.appendChild(wrap);

      // --- ヘルパー: スライダー行を生成 ---
      function makeSliderRow(label, min, max, step, unit, level, prop, ctrlObj) {
        var row = document.createElement('div');
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '0.125rem';

        var lbl = document.createElement('div');
        lbl.style.fontSize = '0.8rem';
        lbl.style.opacity = '0.8';

        var input = document.createElement('input');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.setAttribute('data-level', level);
        input.setAttribute('data-prop', prop);

        input.addEventListener('input', function () {
          lbl.textContent = label + ': ' + input.value + unit;
          onCustomChange(level, prop, input.value + unit);
        });

        row.appendChild(lbl);
        row.appendChild(input);

        ctrlObj[prop + 'Input'] = input;
        ctrlObj[prop + 'Label'] = lbl;
        ctrlObj[prop + 'Unit'] = unit;
        ctrlObj[prop + 'LabelText'] = label;

        return row;
      }

      // --- 内部関数 ---

      function getMergedValues() {
        var presetId = presetSelect.value || 'default';
        var latest = storage.loadSettings() || {};
        var presetValues = registry.getValues(presetId, latest);
        var merged = {};
        ALL_LEVELS.forEach(function (level) {
          var base = presetValues[level] || {};
          var custom = currentCustom[level] || {};
          merged[level] = Object.assign({}, base, custom);
        });
        return merged;
      }

      function updatePreview() {
        var merged = getMergedValues();
        ALL_LEVELS.forEach(function (level) {
          var line = previewLines[level];
          if (!line) return;
          var val = merged[level] || {};
          line.style.fontSize = val.size || '1em';
          line.style.fontWeight = val.weight || 'bold';
          line.style.letterSpacing = val.letterSpacing || '0em';
          line.style.lineHeight = val.lineHeight || '1.3';
        });
      }

      function updateControls() {
        var merged = getMergedValues();
        ALL_LEVELS.forEach(function (level) {
          var ctrl = levelControls[level];
          if (!ctrl) return;
          var val = merged[level] || {};

          // size (all levels)
          if (ctrl.sizeInput) {
            var sizeNum = parseFloat(val.size) || 1;
            ctrl.sizeInput.value = sizeNum;
            ctrl.sizeLabel.textContent = ctrl.sizeLabelText + ': ' + sizeNum + ctrl.sizeUnit;
          }

          // weight (H1-H3 only)
          if (ctrl.weightSelect) {
            ctrl.weightSelect.value = val.weight || 'bold';
          }

          // lineHeight (H1-H3 only)
          if (ctrl.lineHeightInput) {
            var lhNum = parseFloat(val.lineHeight) || 1.3;
            ctrl.lineHeightInput.value = lhNum;
            ctrl.lineHeightLabel.textContent = ctrl.lineHeightLabelText + ': ' + lhNum + ctrl.lineHeightUnit;
          }

          // letterSpacing (H1-H3 only)
          if (ctrl.letterSpacingInput) {
            var lsNum = parseFloat(val.letterSpacing) || 0;
            ctrl.letterSpacingInput.value = lsNum;
            ctrl.letterSpacingLabel.textContent = ctrl.letterSpacingLabelText + ': ' + lsNum + ctrl.letterSpacingUnit;
          }
        });
      }

      function onCustomChange(level, prop, value) {
        if (!currentCustom[level]) currentCustom[level] = {};
        currentCustom[level][prop] = value;
        applyAndRefreshUI();
      }

      function applyAndRefreshUI() {
        try {
          theme.applyHeadingSettings(presetSelect.value, currentCustom);
        } catch (e) {
          console.error('applyHeadingSettings failed', e);
        }
        updatePreview();
        updateControls();
      }

      function refreshState() {
        try {
          var latest = storage.loadSettings();
          if (!latest || !latest.heading) return;
          var pid = latest.heading.preset || 'default';
          rebuildPresetSelect(pid);
          currentCustom = latest.heading.custom && typeof latest.heading.custom === 'object'
            ? JSON.parse(JSON.stringify(latest.heading.custom))
            : {};
          updatePreview();
          updateControls();
        } catch (e) {
          console.error('refreshState failed', e);
        }
      }

      // 初期描画
      updatePreview();
      updateControls();

      window.addEventListener('ZWLoadoutsChanged', refreshState);
      window.addEventListener('ZWLoadoutApplied', refreshState);
      window.addEventListener('ZenWriterSettingsChanged', refreshState);

    } catch (e) {
      console.error('HeadingStyles gadget failed:', e);
      try {
        el.textContent = '見出しスタイルガジェットの初期化に失敗しました。';
      } catch (_) { }
    }
  }, {
    groups: ['theme'],
    title: '見出しスタイル',
    description: '見出しプリセット選択とH1-H6の個別調整。'
  });

})();
